import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateDepartmentDto,
  CreatePositionDto,
  CreateEmploymentRecordDto,
  CreateLeaveTypeDto,
  CreateLeaveRequestDto,
  MarkStaffAttendanceDto,
  CreateStaffDocumentDto
} from './dto/hr.dto';
import { StaffStatus, LeaveRequestStatus, StaffAttendanceStatus } from '@prisma/client';

@Injectable()
export class HRService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getDashboardMetrics(schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStaff,
      totalTeachers,
      onLeave,
      pendingLeave,
      absentToday,
      departments,
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
      })
    ]);

    return {
      metrics: {
        totalEmployees: totalStaff + totalTeachers,
        activeTeachers: totalTeachers,
        activeStaff: totalStaff,
        employeesOnLeave: onLeave,
        pendingLeaveRequests: pendingLeave,
        absentToday,
      },
      departments: departments.map(d => ({
        name: d.name,
        count: d._count.staff + d._count.teachers
      }))
    };
  }

  // Departments & Positions
  async createDepartment(schoolId: string, dto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: { ...dto, schoolId }
    });
  }

  async findAllDepartments(schoolId: string) {
    return this.prisma.department.findMany({
      where: { schoolId },
      include: { headStaff: true, headTeacher: true }
    });
  }

  async createPosition(schoolId: string, dto: CreatePositionDto) {
    return this.prisma.position.create({
      data: { ...dto, schoolId }
    });
  }

  async findAllPositions(schoolId: string) {
    return this.prisma.position.findMany({
      where: { schoolId },
      include: { department: true }
    });
  }

  // Staff Directory (Combined Staff & Teachers)
  async getStaffDirectory(schoolId: string, filters: any = {}) {
    const { departmentId, status, search } = filters;

    const staffWhere: any = {
      schoolId,
      departmentId,
      status,
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
        ]
      } : {})
    };

    const [staff, teachers] = await Promise.all([
      this.prisma.staff.findMany({
        where: staffWhere,
        include: { department: true, position: true }
      }),
      this.prisma.teacher.findMany({
        where: staffWhere,
        include: { department: true, position: true }
      })
    ]);

    return [
      ...staff.map(s => ({ ...s, type: 'STAFF' })),
      ...teachers.map(t => ({ ...t, type: 'TEACHER' }))
    ].sort((a, b) => a.lastName.localeCompare(b.lastName));
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

  async requestLeave(schoolId: string, dto: CreateLeaveRequestDto, actorId: string) {
    const { startDate, endDate, leaveTypeId, staffId, teacherId } = dto;

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

  async findAllLeaveRequests(schoolId: string, filters: any = {}) {
    return this.prisma.leaveRequest.findMany({
      where: { ...filters, schoolId },
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
    return this.prisma.staffDocument.create({
      data: { ...dto, uploadedById: actorId }
    });
  }

  async getStaffDocuments(staffId?: string, teacherId?: string) {
    return this.prisma.staffDocument.findMany({
      where: { staffId, teacherId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
