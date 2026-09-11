import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto, UpdateSchoolStatusDto } from './dto/update-school.dto';
import { SchoolStatus, MembershipStatus } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class SchoolsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateSchoolDto, actorId: string) {
    // Check if code or slug exists
    const existing = await this.prisma.school.findFirst({
      where: {
        OR: [{ code: dto.code }, { slug: dto.slug || this.slugify(dto.name) }],
      },
    });

    if (existing) {
      throw new ConflictException('School code or slug already exists');
    }

    const slug = dto.slug || this.slugify(dto.name);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create School
      const school = await tx.school.create({
        data: {
          name: dto.name,
          code: dto.code,
          slug,
          email: dto.adminEmail,
          phone: dto.phone,
          address: dto.address,
          timezone: dto.timezone || 'UTC',
          currency: dto.currency || 'USD',
          status: SchoolStatus.ACTIVE,
        },
      });

      // 2. Create School Admin User or Link Existing
      let user = await tx.user.findUnique({ where: { email: dto.adminEmail } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email: dto.adminEmail,
            firstName: dto.adminFirstName,
            lastName: dto.adminLastName,
            passwordHash: await argon2.hash('InitialPassword123!'), // Should be an invitation in production
          },
        });
      }

      // 3. Create Membership
      await tx.schoolMembership.create({
        data: {
          schoolId: school.id,
          userId: user.id,
          status: MembershipStatus.ACTIVE,
        },
      });

      // 4. Assign Role
      let role = await tx.role.findFirst({
        where: { name: 'SCHOOL_ADMIN', schoolId: school.id },
      });

      if (!role) {
        role = await tx.role.create({
          data: {
            name: 'SCHOOL_ADMIN',
            schoolId: school.id,
            isSystem: true,
            description: 'Full school administration',
          },
        });
      }

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          schoolId: school.id,
        },
      });

      await this.audit.log({
        userId: actorId,
        action: 'SCHOOL_CREATED',
        module: 'SCHOOLS',
        resourceId: school.id,
        metadata: { name: school.name, code: school.code },
      });

      return school;
    });
  }

  async findAll() {
    return this.prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: { memberships: true, students: true, teachers: true },
        },
      },
    });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async update(id: string, dto: UpdateSchoolDto, actorId: string) {
    const school = await this.prisma.school.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      userId: actorId,
      schoolId: id,
      action: 'SCHOOL_UPDATED',
      module: 'SCHOOLS',
      resourceId: id,
      metadata: dto,
    });

    return school;
  }

  async updateStatus(id: string, dto: UpdateSchoolStatusDto, actorId: string) {
    const school = await this.findOne(id);

    // Validate transition
    if (school.status === dto.status) {
      throw new BadRequestException(`School is already ${dto.status}`);
    }

    const updated = await this.prisma.school.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.audit.log({
      userId: actorId,
      schoolId: id,
      action: `SCHOOL_${dto.status}`,
      module: 'SCHOOLS',
      resourceId: id,
      metadata: { reason: dto.reason },
    });

    return updated;
  }

  private slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
}
