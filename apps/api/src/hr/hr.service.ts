import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreatePositionDto,
  UpdatePositionDto,
  CreateEmploymentRecordDto,
  CreateLeaveTypeDto,
  CreateLeaveRequestDto,
  MarkStaffAttendanceDto,
  CreateStaffDocumentDto
} from './dto/hr.dto';
import { StaffStatus, LeaveRequestStatus, StaffAttendanceStatus } from '@prisma/client';
import { computeStaffCompletion, deriveAccountStatus } from '../staff/staff-profile.util';

@Injectable()
export class HRService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getDashboardMetrics(schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const certificationWindowEnd = new Date();
    certificationWindowEnd.setDate(certificationWindowEnd.getDate() + 30);

    const [
      totalStaff,
      totalTeachers,
      onLeave,
      pendingLeave,
      absentToday,
      departments,
      expiringCertifications,
      pendingDocuments,
      recentLeaveRequests,
    ] = await Promise.all([
      this.prisma.staff.count({ where: { schoolId, status: StaffStatus.ACTIVE } }),
      this.prisma.teacher.count({ where: { schoolId, status: StaffStatus.ACTIVE } }),
      this.prisma.leaveRequest.count({
        where: {
          schoolId,
          status: LeaveRequestStatus.APPROVED,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      }),
      this.prisma.leaveRequest.count({ where: { schoolId, status: LeaveRequestStatus.PENDING_APPROVAL } }),
      this.prisma.staffAttendance.count({
        where: {
          schoolId,
          date: today,
          status: StaffAttendanceStatus.ABSENT
        }
      }),
      this.prisma.department.findMany({
        where: { schoolId },
        include: { _count: { select: { staff: true, teachers: true } } }
      }),
      this.prisma.staffCertification.count({
        where: {
          expiryDate: { not: null, gte: new Date(), lte: certificationWindowEnd },
          OR: [{ staff: { schoolId } }, { teacher: { schoolId } }],
        },
      }),
      this.prisma.staffDocument.count({
        where: {
          verificationStatus: 'PENDING',
          OR: [{ staff: { schoolId } }, { teacher: { schoolId } }],
        },
      }),
      this.prisma.leaveRequest.findMany({
        where: { schoolId, status: LeaveRequestStatus.PENDING_APPROVAL },
        include: {
          leaveType: true,
          staff: { select: { id: true, firstName: true, lastName: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      metrics: {
        totalEmployees: totalStaff + totalTeachers,
        activeTeachers: totalTeachers,
        activeStaff: totalStaff,
        employeesOnLeave: onLeave,
        pendingLeaveRequests: pendingLeave,
        absentToday,
        expiringCertifications,
        pendingDocuments,
      },
      departments: departments.map(d => ({
        name: d.name,
        count: d._count.staff + d._count.teachers
      })),
      recentLeaveRequests: recentLeaveRequests.map((request) => ({
        id: request.id,
        leaveType: request.leaveType?.name ?? 'Leave',
        startDate: request.startDate,
        endDate: request.endDate,
        totalDays: request.totalDays,
        createdAt: request.createdAt,
        employeeName: request.staff
          ? `${request.staff.firstName} ${request.staff.lastName}`.trim()
          : request.teacher
            ? `${request.teacher.firstName} ${request.teacher.lastName}`.trim()
            : 'Unknown employee',
      })),
    };
  }

  // Departments & Positions
  async createDepartment(schoolId: string, dto: CreateDepartmentDto) {
    const name = dto.name?.trim();
    const code = dto.code?.trim().toUpperCase();
    if (!name || !code) {
      throw new BadRequestException('Department name and code are required.');
    }
    if (!/^[A-Z0-9-]{2,12}$/.test(code)) {
      throw new BadRequestException(
        'Department code must be 2–12 characters using letters, numbers or hyphens.',
      );
    }

    const duplicate = await this.prisma.department.findFirst({
      where: { schoolId, code },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('A department with this code already exists.');
    }

    await this.assertDepartmentHeads(schoolId, dto.headStaffId, dto.headTeacherId);

    return this.prisma.department.create({
      data: {
        schoolId,
        name,
        code,
        description: dto.description?.trim() || null,
        headStaffId: dto.headStaffId || null,
        headTeacherId: dto.headTeacherId || null,
      },
      include: {
        headStaff: { select: { firstName: true, lastName: true } },
        headTeacher: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAllDepartments(schoolId: string) {
    return this.prisma.department.findMany({
      where: { schoolId },
      include: {
        headStaff: { select: { id: true, firstName: true, lastName: true } },
        headTeacher: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { staff: true, teachers: true, positions: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateDepartment(schoolId: string, id: string, dto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findFirst({ where: { id, schoolId } });
    if (!department) throw new NotFoundException('Department not found.');

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('Department name cannot be empty.');
    }

    const code = dto.code === undefined ? undefined : dto.code.trim().toUpperCase();
    if (code && !/^[A-Z0-9-]{2,12}$/.test(code)) {
      throw new BadRequestException(
        'Department code must be 2–12 characters using letters, numbers or hyphens.',
      );
    }
    if (code && code !== department.code) {
      const duplicate = await this.prisma.department.findFirst({
        where: { schoolId, code, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException('A department with this code already exists.');
      }
    }

    await this.assertDepartmentHeads(
      schoolId,
      dto.headStaffId ?? undefined,
      dto.headTeacherId ?? undefined,
    );

    return this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(code ? { code } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.headStaffId !== undefined ? { headStaffId: dto.headStaffId || null } : {}),
        ...(dto.headTeacherId !== undefined ? { headTeacherId: dto.headTeacherId || null } : {}),
      },
      include: {
        headStaff: { select: { firstName: true, lastName: true } },
        headTeacher: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async createPosition(schoolId: string, dto: CreatePositionDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Position name is required.');

    const duplicate = await this.prisma.position.findFirst({
      where: { schoolId, name },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('A position with this name already exists.');

    if (dto.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, schoolId },
        select: { id: true },
      });
      if (!department) {
        throw new NotFoundException('Department not found in this school.');
      }
    }

    return this.prisma.position.create({
      data: {
        schoolId,
        name,
        description: dto.description?.trim() || null,
        departmentId: dto.departmentId || null,
      },
      include: { department: true },
    });
  }

  async findAllPositions(schoolId: string) {
    return this.prisma.position.findMany({
      where: { schoolId },
      include: {
        department: true,
        _count: { select: { staff: true, teachers: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updatePosition(schoolId: string, id: string, dto: UpdatePositionDto) {
    const position = await this.prisma.position.findFirst({ where: { id, schoolId } });
    if (!position) throw new NotFoundException('Position not found.');

    const name = dto.name === undefined ? undefined : dto.name.trim();
    if (name !== undefined && !name) {
      throw new BadRequestException('Position name cannot be empty.');
    }
    if (name && name !== position.name) {
      const duplicate = await this.prisma.position.findFirst({
        where: { schoolId, name, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('A position with this name already exists.');
    }

    if (dto.departmentId) {
      const department = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, schoolId },
        select: { id: true },
      });
      if (!department) {
        throw new NotFoundException('Department not found in this school.');
      }
    }

    return this.prisma.position.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.departmentId !== undefined
          ? { departmentId: dto.departmentId || null }
          : {}),
      },
      include: { department: true },
    });
  }

  private async assertDepartmentHeads(
    schoolId: string,
    headStaffId?: string,
    headTeacherId?: string,
  ) {
    if (headStaffId) {
      const staff = await this.prisma.staff.findFirst({
        where: { id: headStaffId, schoolId },
        select: { id: true },
      });
      if (!staff) throw new NotFoundException('Head of department staff record not found.');
    }
    if (headTeacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { id: headTeacherId, schoolId },
        select: { id: true },
      });
      if (!teacher) throw new NotFoundException('Head of department teacher record not found.');
    }
  }

  // Staff Directory (Combined Staff & Teachers)
  async getStaffDirectory(schoolId: string, filters: any = {}) {
    const departmentId =
      typeof filters.departmentId === 'string' && filters.departmentId.trim()
        ? filters.departmentId.trim()
        : undefined;
    const status =
      typeof filters.status === 'string' && filters.status.trim() ? filters.status.trim() : undefined;
    const search = typeof filters.search === 'string' ? filters.search.trim() : '';
    const type = ['STAFF', 'TEACHER'].includes(String(filters.type))
      ? String(filters.type)
      : undefined;

    const staffWhere: any = {
      schoolId,
      ...(departmentId ? { departmentId } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { employeeId: { contains: search, mode: 'insensitive' } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [staff, teachers] = await Promise.all([
      type === 'TEACHER'
        ? Promise.resolve([])
        : this.prisma.staff.findMany({
            where: staffWhere,
            include: {
              department: true,
              position: true,
              user: { select: { email: true, isActive: true } },
            },
          }),
      type === 'STAFF'
        ? Promise.resolve([])
        : this.prisma.teacher.findMany({
            where: staffWhere,
            include: {
              department: true,
              position: true,
              user: { select: { email: true, isActive: true } },
            },
          }),
    ]);

    return [
      ...staff.map((s) => ({ ...s, type: 'STAFF' })),
      ...teachers.map((t) => ({ ...t, type: 'TEACHER' })),
    ].sort((a, b) => String(a.lastName).localeCompare(String(b.lastName)));
  }

  // Leave Management
  async createLeaveType(schoolId: string, dto: CreateLeaveTypeDto) {
    return this.prisma.leaveType.create({
      data: { ...dto, schoolId }
    });
  }

  async getLeaveTypes(schoolId: string) {
    return this.prisma.leaveType.findMany({
      where: { schoolId, isActive: true }
    });
  }

  private async resolveStaffIdentity(schoolId: string, userId: string) {
    const [staff, teacher] = await Promise.all([
      this.prisma.staff.findFirst({ where: { schoolId, userId } }),
      this.prisma.teacher.findFirst({ where: { schoolId, userId } }),
    ]);
    return { staffId: staff?.id || null, teacherId: teacher?.id || null };
  }

  async getMyLeaveRequests(schoolId: string, userId: string) {
    const { staffId, teacherId } = await this.resolveStaffIdentity(schoolId, userId);
    if (!staffId && !teacherId) return [];

    return this.prisma.leaveRequest.findMany({
      where: {
        schoolId,
        OR: [
          ...(staffId ? [{ staffId }] : []),
          ...(teacherId ? [{ teacherId }] : []),
        ],
      },
      include: { leaveType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyLeaveBalances(schoolId: string, userId: string) {
    const { staffId, teacherId } = await this.resolveStaffIdentity(schoolId, userId);
    if (!staffId && !teacherId) return [];

    return this.prisma.leaveBalance.findMany({
      where: {
        OR: [
          ...(staffId ? [{ staffId }] : []),
          ...(teacherId ? [{ teacherId }] : []),
        ],
      },
      include: { leaveType: true },
      orderBy: { period: 'desc' },
    });
  }

  async getMySchedule(schoolId: string, userId: string) {
    const { staffId, teacherId } = await this.resolveStaffIdentity(schoolId, userId);
    if (!staffId && !teacherId) return [];

    return this.prisma.staffSchedule.findMany({
      where: {
        OR: [
          ...(staffId ? [{ staffId }] : []),
          ...(teacherId ? [{ teacherId }] : []),
        ],
      },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async requestLeave(schoolId: string, dto: CreateLeaveRequestDto, actorId: string) {
    const { startDate, endDate, leaveTypeId } = dto;
    const { staffId, teacherId } = await this.resolveStaffIdentity(schoolId, actorId);

    if (!staffId && !teacherId) {
      throw new BadRequestException('No employee profile is linked to this account.');
    }
    if (startDate > endDate) {
      throw new BadRequestException('The leave end date must be on or after the start date.');
    }

    const leaveType = await this.prisma.leaveType.findFirst({
      where: { id: leaveTypeId, schoolId, isActive: true },
    });
    if (!leaveType) {
      throw new BadRequestException('Select a valid leave type for this school.');
    }

    // Calculate total days (simple diff for now)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const period = new Date().getFullYear().toString();
    const balance = await this.prisma.leaveBalance.findFirst({
      where: { staffId, teacherId, leaveTypeId, period }
    });

    if (balance && (balance.entitledDays - balance.usedDays - balance.pendingDays) < totalDays) {
      throw new BadRequestException('Insufficient leave balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.create({
        data: {
          ...dto,
          staffId,
          teacherId,
          schoolId,
          totalDays,
          status: LeaveRequestStatus.PENDING_APPROVAL
        }
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: { increment: totalDays } }
        });
      }

      return request;
    });
  }

  async approveLeave(schoolId: string, requestId: string, actorId: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { leaveType: true }
    });

    if (!request || request.schoolId !== schoolId) throw new NotFoundException('Leave request not found');
    if (request.status !== LeaveRequestStatus.PENDING_APPROVAL) throw new BadRequestException('Request is already processed');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: LeaveRequestStatus.APPROVED,
          approvedById: actorId,
          approvedAt: new Date()
        }
      });

      const period = new Date(request.startDate).getFullYear().toString();
      const balance = await tx.leaveBalance.findFirst({
        where: { staffId: request.staffId, teacherId: request.teacherId, leaveTypeId: request.leaveTypeId, period }
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: { decrement: request.totalDays },
            usedDays: { increment: request.totalDays }
          }
        });
      }

      return updated;
    });
  }

  async rejectLeave(schoolId: string, requestId: string, actorId: string, comments?: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { leaveType: true }
    });

    if (!request || request.schoolId !== schoolId) throw new NotFoundException('Leave request not found');
    if (request.status !== LeaveRequestStatus.PENDING_APPROVAL)
      throw new BadRequestException('Request is already processed');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: LeaveRequestStatus.REJECTED,
          approvedById: actorId,
          approvedAt: new Date(),
          comments: comments || request.comments
        }
      });

      // Release the days that were reserved while the request was pending.
      const period = new Date(request.startDate).getFullYear().toString();
      const balance = await tx.leaveBalance.findFirst({
        where: {
          staffId: request.staffId,
          teacherId: request.teacherId,
          leaveTypeId: request.leaveTypeId,
          period
        }
      });

      if (balance && balance.pendingDays >= request.totalDays) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: { decrement: request.totalDays } }
        });
      }

      return updated;
    });
  }

  async findAllLeaveRequests(schoolId: string, filters: any = {}) {
    const where: any = { schoolId };
    if (filters.status) where.status = filters.status;
    if (filters.staffId) where.staffId = filters.staffId;
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.leaveTypeId) where.leaveTypeId = filters.leaveTypeId;

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        staff: true,
        teacher: true,
        leaveType: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Attendance
  async markAttendance(schoolId: string, dto: MarkStaffAttendanceDto, actorId: string) {
    return this.prisma.staffAttendance.upsert({
      where: {
        schoolId_staffId_teacherId_date: {
          schoolId,
          staffId: dto.staffId || null,
          teacherId: dto.teacherId || null,
          date: dto.date
        }
      },
      update: { ...dto, recordedById: actorId },
      create: { ...dto, schoolId, recordedById: actorId }
    });
  }

  async getAttendance(schoolId: string, date: Date) {
    return this.prisma.staffAttendance.findMany({
      where: { schoolId, date },
      include: { staff: true, teacher: true }
    });
  }

  // Documents
  async uploadDocument(schoolId: string, dto: CreateStaffDocumentDto, actorId: string) {
    if (!dto.staffId && !dto.teacherId) {
      throw new BadRequestException('Select the staff member this document belongs to.');
    }
    if (dto.staffId) {
      const staff = await this.prisma.staff.findFirst({
        where: { id: dto.staffId, schoolId },
        select: { id: true },
      });
      if (!staff) throw new BadRequestException('Staff member not found in this school.');
    }
    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { id: dto.teacherId, schoolId },
        select: { id: true },
      });
      if (!teacher) throw new BadRequestException('Teacher not found in this school.');
    }

    return this.prisma.staffDocument.create({
      data: {
        staffId: dto.staffId ?? null,
        teacherId: dto.teacherId ?? null,
        documentType: dto.documentType.trim(),
        title: dto.title.trim(),
        fileUrl: dto.fileUrl.trim(),
        storageKey: dto.storageKey.trim(),
        expiryDate: dto.expiryDate ?? null,
        uploadedById: actorId,
      },
    });
  }

  async getStaffDocuments(schoolId: string, staffId?: string, teacherId?: string) {
    if (!staffId && !teacherId) {
      throw new BadRequestException('A staff or teacher id is required.');
    }
    if (staffId) {
      const staff = await this.prisma.staff.findFirst({
        where: { id: staffId, schoolId },
        select: { id: true },
      });
      if (!staff) throw new NotFoundException('Staff member not found.');
    }
    if (teacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { id: teacherId, schoolId },
        select: { id: true },
      });
      if (!teacher) throw new NotFoundException('Teacher not found.');
    }

    return this.prisma.staffDocument.findMany({
      where: {
        ...(staffId ? { staffId } : {}),
        ...(teacherId ? { teacherId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStaffProfile(schoolId: string, id: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, schoolId },
      include: {
        department: true,
        position: true,
        supervisorStaff: { select: { id: true, firstName: true, lastName: true } },
        user: { select: { id: true, email: true, phone: true, isActive: true } },
      },
    });
    const teacher = staff
      ? null
      : await this.prisma.teacher.findFirst({
          where: { id, schoolId },
          include: {
            department: true,
            position: true,
            user: { select: { id: true, email: true, phone: true, isActive: true } },
          },
        });

    if (!staff && !teacher) {
      throw new NotFoundException('Staff member not found.');
    }

    const entityType = staff ? 'STAFF' : 'TEACHER';
    const scope = staff ? { staffId: staff.id } : { teacherId: teacher!.id };

    const [qualifications, documents, attendance, leaveRequests, leaveBalances] = await Promise.all([
      this.prisma.staffQualification.findMany({
        where: scope,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.staffDocument.findMany({
        where: scope,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.staffAttendance.findMany({
        where: { schoolId, ...scope },
        orderBy: { date: 'desc' },
        take: 60,
      }),
      this.prisma.leaveRequest.findMany({
        where: { schoolId, ...scope },
        include: { leaveType: true },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.leaveBalance.findMany({
        where: scope,
        include: { leaveType: true },
        orderBy: { period: 'desc' },
      }),
    ]);

    const presentDays = attendance.filter((record) =>
      ['PRESENT', 'LATE', 'REMOTE', 'HALF_DAY'].includes(String(record.status)),
    ).length;
    const attendanceRate = attendance.length
      ? Math.round((presentDays / attendance.length) * 1000) / 10
      : null;

    return {
      entityType,
      profile: staff ?? teacher,
      completion: computeStaffCompletion(staff ?? teacher),
      accountStatus: deriveAccountStatus(staff ?? teacher),
      qualifications,
      documents,
      attendance,
      leaveRequests,
      leaveBalances,
      summary: {
        attendanceRate,
        attendanceRecords: attendance.length,
        entitledDays: leaveBalances.reduce((total, balance) => total + Number(balance.entitledDays ?? 0), 0),
        usedDays: leaveBalances.reduce((total, balance) => total + Number(balance.usedDays ?? 0), 0),
        pendingLeaveRequests: leaveRequests.filter((request) => request.status === 'PENDING_APPROVAL').length,
      },
    };
  }
}
