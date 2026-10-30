import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AccountState, Prisma, SchoolStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterSchoolRequestDto } from './dto/register-school.dto';
import {
  EmailOtpService,
  OTP_CODE_LENGTH,
  OTP_TTL_MS,
  type OtpDelivery,
} from './email-otp.service';
import {
  SCHOOL_TYPE_CONFIG,
  SchoolType,
} from './school-registration.constants';
import { NotificationsService } from '../notifications/notifications.service';

type EmailDelivery = OtpDelivery | 'skipped';

export interface SchoolRegistrationResult {
  success: true;
  message: string;
  requiresVerification: boolean;
  emailSent: boolean;
  emailDelivery: EmailDelivery;
  verificationCodeLength: number;
  verificationExpiresInSeconds: number;
  school: {
    id: string;
    name: string;
    code: string;
    slug: string;
    email: string;
    status: string;
  };
  administrator: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'SCHOOL_ADMIN';
    accountState: string;
  };
}

@Injectable()
export class SchoolRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly emailOtp: EmailOtpService,
    private readonly notifications: NotificationsService,
  ) {}

  async register(dto: RegisterSchoolRequestDto): Promise<SchoolRegistrationResult> {
    if (dto.consentToTerms !== true) {
      throw new BadRequestException('You must accept the Terms of Service to register.');
    }

    const schoolName = this.normalize(dto.school?.name);
    const schoolType = this.normalize(dto.school?.type);
    const country = this.normalize(dto.school?.country);
    const region = this.normalize(dto.school?.region);
    const city = this.normalize(dto.school?.city);
    const district = this.normalize(dto.school?.district);
    const address = this.normalize(dto.school?.address);
    const phone = this.normalize(dto.school?.phone);
    const schoolEmail = this.normalize(dto.school?.email).toLowerCase();

    const fullName = this.normalize(dto.admin?.fullName).replace(/\s+/g, ' ');
    const adminEmail = this.normalize(dto.admin?.email).toLowerCase();
    const password = dto.admin?.password ?? '';

    if (!schoolName) {
      throw new BadRequestException('School name is required.');
    }
    if (!schoolType) {
      throw new BadRequestException('School type is required.');
    }
    if (!country) {
      throw new BadRequestException('Country is required.');
    }
    if (!region) {
      throw new BadRequestException('Region is required.');
    }
    if (!city) {
      throw new BadRequestException('Town or district is required.');
    }
    if (!fullName) {
      throw new BadRequestException('Administrator full name is required.');
    }
    if (!adminEmail) {
      throw new BadRequestException('Administrator email is required.');
    }
    if (!password) {
      throw new BadRequestException('Password is required.');
    }

    const typeConfig = SCHOOL_TYPE_CONFIG[schoolType as SchoolType];
    if (!typeConfig) {
      throw new BadRequestException('Select a valid school type.');
    }

    this.assertPasswordPolicy(password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const identifiers = await this.generateSchoolIdentifiers(schoolName);
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const requiresVerification = process.env.SKIP_EMAIL_VERIFICATION !== 'true';
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');
    const formattedAddress = [address, city, district, region, country]
      .filter(Boolean)
      .join(', ');
    const currentYear = new Date().getFullYear();

    let created: {
      school: {
        id: string;
        name: string;
        code: string;
        slug: string;
        email: string | null;
        status: string;
      };
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        accountState: string;
      };
      verificationCode: string | null;
    };

    try {
      created = await this.prisma.$transaction(async (tx) => {
        const school = await tx.school.create({
          data: {
            name: schoolName,
            code: identifiers.code,
            slug: identifiers.slug,
            email: schoolEmail || adminEmail,
            phone: phone || null,
            address: formattedAddress || null,
            timezone: 'Africa/Accra',
            currency: 'GHS',
            status: SchoolStatus.PENDING,
          },
        });

        await tx.schoolSetting.createMany({
          data: [
            { schoolId: school.id, key: 'school_type', value: schoolType },
            { schoolId: school.id, key: 'school_level', value: typeConfig.level },
            { schoolId: school.id, key: 'school_ownership', value: 'Private' },
            { schoolId: school.id, key: 'country', value: country },
            { schoolId: school.id, key: 'region', value: region },
            { schoolId: school.id, key: 'district', value: district },
            { schoolId: school.id, key: 'city', value: city },
            {
              schoolId: school.id,
              key: 'registration_date',
              value: new Date().toISOString(),
            },
          ],
        });

        const user = await tx.user.create({
          data: {
            email: adminEmail,
            firstName,
            lastName,
            passwordHash,
            accountState: requiresVerification
              ? AccountState.PENDING_VERIFICATION
              : AccountState.ACTIVE,
            emailVerified: requiresVerification ? null : new Date(),
          },
        });

        const adminRole = await tx.role.create({
          data: {
            name: 'SCHOOL_ADMIN',
            description: 'Full administrative access to school workspace',
            schoolId: school.id,
            isSystem: true,
          },
        });

        await tx.role.createMany({
          data: [
            { name: 'TEACHER', description: 'Academic staff access' },
            { name: 'STUDENT', description: 'Student portal access' },
            { name: 'STAFF', description: 'Administrative staff access' },
            { name: 'PARENT', description: 'Parent portal access' },
            { name: 'ACCOUNTANT', description: 'Financial management access' },
            { name: 'LIBRARIAN', description: 'Library management access' },
          ].map((role) => ({
            ...role,
            schoolId: school.id,
            isSystem: true,
          })),
        });

        await tx.schoolMembership.create({
          data: {
            schoolId: school.id,
            userId: user.id,
            status: 'ACTIVE',
          },
        });

        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: adminRole.id,
            schoolId: school.id,
          },
        });

        const academicYear = await tx.academicYear.create({
          data: {
            schoolId: school.id,
            name: `Academic Year ${currentYear}/${currentYear + 1}`,
            code: `AY-${currentYear}-${currentYear + 1}`,
            startDate: new Date(`${currentYear}-09-01`),
            endDate: new Date(`${currentYear + 1}-06-30`),
            isCurrent: true,
            status: 'ACTIVE',
          },
        });

        const terms = [
          {
            name: 'Term 1',
            startDate: `${currentYear}-09-01`,
            endDate: `${currentYear}-12-20`,
          },
          {
            name: 'Term 2',
            startDate: `${currentYear + 1}-01-05`,
            endDate: `${currentYear + 1}-04-15`,
          },
          {
            name: 'Term 3',
            startDate: `${currentYear + 1}-05-02`,
            endDate: `${currentYear + 1}-07-31`,
          },
        ];

        for (const [index, term] of terms.entries()) {
          await tx.term.create({
            data: {
              academicYearId: academicYear.id,
              name: term.name,
              code: term.name.replace(/\s+/g, '-').toUpperCase(),
              sequence: index + 1,
              startDate: new Date(term.startDate),
              endDate: new Date(term.endDate),
              status: index === 0 ? 'ACTIVE' : 'UPCOMING',
            },
          });
        }

        for (const [index, classPreset] of typeConfig.classes.entries()) {
          const schoolClass = await tx.class.create({
            data: {
              schoolId: school.id,
              name: classPreset.name,
              code: classPreset.code,
              level: index + 1,
            },
          });

          for (const sectionName of classPreset.sections) {
            await tx.section.create({
              data: {
                classId: schoolClass.id,
                name: sectionName,
                code: sectionName.toUpperCase(),
              },
            });
          }
        }

        let verificationCode: string | null = null;
        if (requiresVerification) {
          const challenge = this.emailOtp.createChallenge(
            user.id,
            'EMAIL_VERIFICATION',
          );

          await tx.emailVerificationToken.deleteMany({
            where: { userId: user.id },
          });
          await tx.emailVerificationToken.create({
            data: {
              userId: user.id,
              tokenHash: challenge.tokenHash,
              expiresAt: challenge.expiresAt,
            },
          });

          verificationCode = challenge.code;
        }

        await this.audit.log(
          {
            userId: user.id,
            schoolId: school.id,
            action: 'SCHOOL_REGISTRATION_COMPLETED',
            module: 'AUTH',
            resourceId: school.id,
            metadata: {
              schoolName: school.name,
              schoolCode: school.code,
              adminEmail: user.email,
              schoolType,
              country,
              region,
            },
          },
          tx,
        );

        return {
          school: {
            id: school.id,
            name: school.name,
            code: school.code,
            slug: school.slug,
            email: school.email,
            status: school.status,
          },
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            accountState: user.accountState,
          },
          verificationCode,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A school or administrator account with these details already exists.',
        );
      }
      throw error;
    }

    let emailSent = false;
    let emailDelivery: EmailDelivery = requiresVerification
      ? 'pending'
      : 'skipped';

    if (requiresVerification && created.verificationCode) {
      const recipient = {
        id: created.user.id,
        email: created.user.email,
        firstName: created.user.firstName,
      };
      const delivery = await this.emailOtp.sendVerificationCode(
        recipient,
        created.school.name,
        created.verificationCode,
      );
      emailSent = delivery.emailSent;
      emailDelivery = delivery.emailDelivery;
    }

    // Notify Platform Super Admins of the new school registration awaiting review.
    try {
      const platformAdmins = await this.prisma.userRole.findMany({
        where: {
          role: {
            name: { in: ['PLATFORM_SUPER_ADMIN', 'SUPER_ADMIN'] },
            schoolId: null,
          },
        },
        select: { userId: true },
      });
      for (const assignment of platformAdmins) {
        await this.notifications.send(
          assignment.userId,
          'New school registration awaiting review',
          `${schoolName} (${identifiers.code}) has been registered and requires platform approval before activation.`,
          'SCHOOL_REGISTRATION',
          undefined,
        );
      }
    } catch {
      // Notification failures must not roll back the registration.
    }

    return {
      success: true,
      message: this.buildRegistrationMessage(requiresVerification, emailDelivery),
      requiresVerification,
      emailSent,
      emailDelivery,
      verificationCodeLength: OTP_CODE_LENGTH,
      verificationExpiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
      school: {
        ...created.school,
        email: created.school.email || adminEmail,
        status: String(created.school.status),
      },
      administrator: {
        id: created.user.id,
        fullName,
        firstName: created.user.firstName,
        lastName: created.user.lastName,
        email: created.user.email,
        role: 'SCHOOL_ADMIN',
        accountState: String(created.user.accountState),
      },
    };
  }

  private buildRegistrationMessage(
    requiresVerification: boolean,
    delivery: EmailDelivery,
  ): string {
    if (!requiresVerification) {
      return 'School workspace created. The administrator account is active and can sign in.';
    }

    switch (delivery) {
      case 'sent':
        return 'School workspace created. Enter the 5-digit code sent to the administrator email.';
      case 'pending':
        return 'School workspace created. Your verification code is being sent; request a new code if it does not arrive shortly.';
      default:
        return 'School workspace created, but the verification code could not be sent. Request a new code or contact support.';
    }
  }

  private normalize(value?: string | null): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private assertPasswordPolicy(password: string) {
    if (
      password.length < 12 ||
      password.length > 128 ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)
    ) {
      throw new BadRequestException(
        'Password must be at least 12 characters and contain uppercase, lowercase, number, and special character.',
      );
    }
  }

  private async generateSchoolIdentifiers(schoolName: string) {
    const normalized = schoolName
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');
    const words = normalized.split(/\s+/).filter(Boolean);
    const baseCode = (
      words.length > 1
        ? words.map((word) => word[0]).join('')
        : normalized.replace(/[^a-zA-Z0-9]/g, '')
    )
      .toUpperCase()
      .slice(0, 6);
    const baseSlug =
      normalized
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || `school-${Date.now().toString().slice(-6)}`;

    let code = baseCode || `SCH${Date.now().toString().slice(-6)}`;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const existing = await this.prisma.school.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!existing) break;
      code = `${baseCode.slice(0, 5)}${String(100 + attempt).slice(-3)}`;
    }

    let slug = baseSlug;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const existing = await this.prisma.school.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing) break;
      slug = `${baseSlug}-${100 + attempt}`;
    }

    const codeTaken = await this.prisma.school.findUnique({
      where: { code },
      select: { id: true },
    });
    const slugTaken = await this.prisma.school.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (codeTaken || slugTaken) {
      throw new ConflictException(
        'Could not allocate a unique school code. Please try a slightly different school name.',
      );
    }

    return { code, slug };
  }
}
