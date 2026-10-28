import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Request,
  Logger,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TenantGuard } from "../auth/guards/tenant.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { AccountState } from "@prisma/client";
import { randomBytes } from "crypto";
import * as argon2 from "argon2";

@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles("SCHOOL_ADMIN", "PRINCIPAL", "SUPER_ADMIN")
@Controller("schools/me")
export class SchoolsMeController {
  private readonly logger = new Logger(SchoolsMeController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authService: AuthService,
  ) {}

  private extractSchoolId(req: any): string {
    const headerSchoolId = req.headers["x-school-id"];
    if (headerSchoolId) return headerSchoolId;
    if (req.user?.schoolId) return req.user.schoolId;
    if (req.user?.memberships?.[0]?.schoolId) return req.user.memberships[0].schoolId;
    throw new ForbiddenException("No active school context found for user");
  }

  private async sendAccountSetupEmail(email: string) {
    try {
      await this.authService.forgotPassword(email);
    } catch (error) {
      this.logger.error(
        `Failed to send account setup email to ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @Get()
  async getSchoolProfile(@Request() req: any) {
    const schoolId = this.extractSchoolId(req);
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        schoolSettings: true,
        academicYears: { where: { isCurrent: true } },
        _count: {
          select: {
            students: true,
            teachers: true,
            staff: true,
            classes: true,
            subjects: true,
          },
        },
      },
    });

    if (!school) throw new NotFoundException("School profile not found");
    return school;
  }

  @Patch()
  async updateSchoolProfile(@Request() req: any, @Body() body: any) {
    return this.updateSchoolSettings(req, body);
  }

  @Patch("settings")
  async updateSchoolSettings(@Request() req: any, @Body() body: any) {
    const schoolId = this.extractSchoolId(req);

    const { name, phone, address, email, timezone, currency, ...customSettings } = body;

    const updatedSchool = await this.prisma.school.update({
      where: { id: schoolId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(email && { email }),
        ...(timezone && { timezone }),
        ...(currency && { currency }),
      },
    });

    // Save remaining settings into SchoolSetting
    for (const [key, value] of Object.entries(customSettings)) {
      if (value !== undefined) {
        await this.prisma.schoolSetting.upsert({
          where: { schoolId_key: { schoolId, key } },
          update: { value: value as any },
          create: { schoolId, key, value: value as any },
        });
      }
    }

    await this.audit.log({
      userId: req.user.id,
      schoolId,
      action: "SCHOOL_PROFILE_UPDATED",
      module: "SCHOOLS",
      resourceId: schoolId,
      metadata: body,
    });

    return updatedSchool;
  }

  // --- TEACHERS ---
  @Get("teachers")
  async getTeachers(@Request() req: any) {
    const schoolId = this.extractSchoolId(req);
    return this.prisma.teacher.findMany({
      where: { schoolId },
      include: {
        department: true,
        user: { select: { email: true, isActive: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post("teachers")
  async createTeacher(@Request() req: any, @Body() body: any) {
    const schoolId = this.extractSchoolId(req);
    const { firstName, lastName, email, phone, employeeId, specialization, departmentId } = body;

    let user = null;
    let createdUserEmail: string | null = null;
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        const temporaryPassword = `Aa1!${randomBytes(24).toString('base64url')}`;
        const passwordHash = await argon2.hash(temporaryPassword, {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        });
        user = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            firstName,
            lastName,
            phone: phone || null,
            passwordHash,
            accountState: AccountState.ACTIVE,
            emailVerified: new Date(),
          },
        });
        createdUserEmail = user.email;
      }

      await this.prisma.schoolMembership.upsert({
        where: { schoolId_userId: { schoolId, userId: user.id } },
        update: { status: "ACTIVE" },
        create: { schoolId, userId: user.id, status: "ACTIVE" },
      });

      const teacherRole = await this.prisma.role.findFirst({
        where: { name: "TEACHER", schoolId },
      });

      if (teacherRole) {
        await this.prisma.userRole.upsert({
          where: { userId_roleId_schoolId: { userId: user.id, roleId: teacherRole.id, schoolId } },
          update: {},
          create: { userId: user.id, roleId: teacherRole.id, schoolId },
        });
      }
    }

    const teacher = await this.prisma.teacher.create({
      data: {
        schoolId,
        userId: user?.id || null,
        firstName,
        lastName,
        employeeId: employeeId || `TCH${Date.now().toString().slice(-4)}`,
        specialization,
        departmentId,
        status: "ACTIVE",
      },
    });

    await this.audit.log({
      userId: req.user.id,
      schoolId,
      action: "TEACHER_REGISTERED",
      module: "TEACHERS",
      resourceId: teacher.id,
      metadata: { firstName, lastName, employeeId: teacher.employeeId },
    });

    if (createdUserEmail) {
      await this.sendAccountSetupEmail(createdUserEmail);
    }

    return teacher;
  }

  // --- STUDENTS ---
  @Get("students")
  async getStudents(@Request() req: any) {
    const schoolId = this.extractSchoolId(req);
    return this.prisma.student.findMany({
      where: { schoolId },
      include: {
        enrollments: { include: { class: true, section: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post("students")
  async createStudent(@Request() req: any, @Body() body: any) {
    const schoolId = this.extractSchoolId(req);
    const { firstName, lastName, studentNumber, admissionNumber, dateOfBirth, gender, classId, sectionId } = body;

    const generatedNumber = studentNumber || `STD${Date.now().toString().slice(-6)}`;
    const student = await this.prisma.student.create({
      data: {
        schoolId,
        firstName,
        lastName,
        studentNumber: generatedNumber,
        admissionNumber: admissionNumber || generatedNumber,
        admissionDate: new Date(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date("2012-01-01"),
        gender: gender || "OTHER",
        status: "ACTIVE",
      },
    });

    if (classId) {
      const activeYear = await this.prisma.academicYear.findFirst({
        where: { schoolId, isCurrent: true },
      });

      if (activeYear) {
        await this.prisma.enrollment.create({
          data: {
            schoolId,
            studentId: student.id,
            academicYearId: activeYear.id,
            classId,
            sectionId: sectionId || null,
            status: "ACTIVE",
          },
        });
      }
    }

    await this.audit.log({
      userId: req.user.id,
      schoolId,
      action: "STUDENT_REGISTERED",
      module: "STUDENTS",
      resourceId: student.id,
      metadata: { firstName, lastName, studentNumber: student.studentNumber },
    });

    return student;
  }

  // --- STAFF ---
  @Get("staff")
  async getStaff(@Request() req: any) {
    const schoolId = this.extractSchoolId(req);
    return this.prisma.staff.findMany({
      where: { schoolId },
      include: { department: true, position: true },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post("staff")
  async createStaff(@Request() req: any, @Body() body: any) {
    const schoolId = this.extractSchoolId(req);
    const { firstName, lastName, email, phone, designation, employeeId, departmentId } = body;

    let user = null;
    let createdUserEmail: string | null = null;
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        const temporaryPassword = `Aa1!${randomBytes(24).toString('base64url')}`;
        const passwordHash = await argon2.hash(temporaryPassword, {
          type: argon2.argon2id,
          memoryCost: 65536,
          timeCost: 3,
          parallelism: 4,
        });
        user = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            firstName,
            lastName,
            phone: phone || null,
            passwordHash,
            accountState: AccountState.ACTIVE,
            emailVerified: new Date(),
          },
        });
        createdUserEmail = user.email;
      }

      await this.prisma.schoolMembership.upsert({
        where: { schoolId_userId: { schoolId, userId: user.id } },
        update: { status: "ACTIVE" },
        create: { schoolId, userId: user.id, status: "ACTIVE" },
      });
    }

    const staffMember = await this.prisma.staff.create({
      data: {
        schoolId,
        userId: user?.id || null,
        firstName,
        lastName,
        employeeId: employeeId || `STF${Date.now().toString().slice(-4)}`,
        designation,
        departmentId,
        status: "ACTIVE",
      },
    });

    if (createdUserEmail) {
      await this.sendAccountSetupEmail(createdUserEmail);
    }

    return staffMember;
  }

  // --- CLASSES ---
  @Get("classes")
  async getClasses(@Request() req: any) {
    const schoolId = this.extractSchoolId(req);
    return this.prisma.class.findMany({
      where: { schoolId },
      include: { sections: true, _count: { select: { enrollments: true } } },
      orderBy: { level: "asc" },
    });
  }

  @Post("classes")
  async createClass(@Request() req: any, @Body() body: any) {
    const schoolId = this.extractSchoolId(req);
    const { name, code, level, sections } = body;

    const newClass = await this.prisma.class.create({
      data: {
        schoolId,
        name,
        code: code || name.replace(/\s+/g, "").toUpperCase(),
        level: level || 1,
      },
    });

    const sectionNames = Array.isArray(sections) && sections.length > 0 ? sections : ["A"];
    for (const secName of sectionNames) {
      await this.prisma.section.create({
        data: {
          classId: newClass.id,
          name: typeof secName === "string" ? secName : secName.name,
          code: (typeof secName === "string" ? secName : secName.code || secName.name).toUpperCase(),
        },
      });
    }

    return this.prisma.class.findUnique({
      where: { id: newClass.id },
      include: { sections: true },
    });
  }

  // --- SUBJECTS ---
  @Get("subjects")
  async getSubjects(@Request() req: any) {
    const schoolId = this.extractSchoolId(req);
    return this.prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });
  }

  @Post("subjects")
  async createSubject(@Request() req: any, @Body() body: any) {
    const schoolId = this.extractSchoolId(req);
    const { name, code, subjectType } = body;

    return this.prisma.subject.create({
      data: {
        schoolId,
        name,
        code: code || name.replace(/\s+/g, "").toUpperCase().slice(0, 6),
        subjectType: subjectType || "CORE",
      },
    });
  }

  // --- ATTENDANCE ---
  @Get("attendance")
  async getAttendance(@Request() req: any) {
    const schoolId = this.extractSchoolId(req);
    return this.prisma.attendanceSession.findMany({
      where: { schoolId },
      include: { class: true, section: true, _count: { select: { records: true } } },
      orderBy: { date: "desc" },
      take: 20,
    });
  }

  @Post("attendance")
  async createAttendanceSession(@Request() req: any, @Body() body: any) {
    const schoolId = this.extractSchoolId(req);
    const { classId, sectionId, date, sessionType } = body;
    const activeYear = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    }) || await this.prisma.academicYear.findFirst({ where: { schoolId } });

    if (!activeYear) {
      throw new BadRequestException("No academic year found for this school");
    }

    return this.prisma.attendanceSession.create({
      data: {
        schoolId,
        academicYearId: activeYear.id,
        classId,
        sectionId: sectionId || null,
        date: date ? new Date(date) : new Date(),
        sessionType: sessionType || "DAILY",
        status: "COMPLETED",
      },
    });
  }

  // --- NOTICES ---
  @Get("notices")
  async getNotices(@Request() req: any) {
    const schoolId = this.extractSchoolId(req);
    return this.prisma.announcement.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  @Post("notices")
  async createNotice(@Request() req: any, @Body() body: any) {
    const schoolId = this.extractSchoolId(req);
    const { title, content, priority } = body;
    return this.prisma.announcement.create({
      data: {
        schoolId,
        authorId: req.user.id,
        title,
        content: content || title,
        priority: priority || "NORMAL",
        status: "PUBLISHED",
      },
    });
  }

  // --- ACTIVITIES ---
  @Get("activities")
  async getActivities(@Request() req: any) {
    const schoolId = this.extractSchoolId(req);
    return this.prisma.academicCalendar.findMany({
      where: { schoolId },
      orderBy: { startDate: "asc" },
      take: 20,
    });
  }

  @Post("activities")
  async createActivity(@Request() req: any, @Body() body: any) {
    const schoolId = this.extractSchoolId(req);
    const { title, description, eventType, startDate, endDate, isHoliday } = body;
    const activeYear = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
    }) || await this.prisma.academicYear.findFirst({ where: { schoolId } });

    if (!activeYear) {
      throw new BadRequestException("No academic year found for this school");
    }

    return this.prisma.academicCalendar.create({
      data: {
        schoolId,
        academicYearId: activeYear.id,
        title,
        description: description || null,
        type: isHoliday ? "HOLIDAY" : (eventType || "OTHER"),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(),
      },
    });
  }
}
