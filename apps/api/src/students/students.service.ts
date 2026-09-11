import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommunicationGateway } from '../communication/gateways/communication.gateway';
import { CreateStudentDto } from './dto/create-student.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { StudentStatus } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private gateway: CommunicationGateway,
    private settings: SettingsService,
  ) {}

  async create(schoolId: string, dto: CreateStudentDto, actorId: string) {
    const studentNumber = dto.studentNumber || await this.settings.generateNextNumber(schoolId, 'STUDENT');

    const existing = await this.prisma.student.findFirst({
      where: {
        schoolId,
        OR: [
          { studentNumber },
          dto.admissionNumber ? { admissionNumber: dto.admissionNumber } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (existing) {
      throw new ConflictException('Student with this number or admission number already exists in this school');
    }

    const student = await this.prisma.student.create({
      data: {
        ...dto,
        studentNumber,
        schoolId,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'STUDENT_CREATED',
      module: 'STUDENTS',
      resourceId: student.id,
      metadata: { studentNumber: student.studentNumber },
    });

    this.gateway.broadcastToSchool(schoolId, 'STUDENT_CREATED', student);

    return student;
  }

  async findAll(schoolId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, search } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      schoolId,
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { studentNumber: { contains: search, mode: 'insensitive' } },
          { admissionNumber: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastName: 'asc' },
        include: {
          user: {
            select: { email: true, isActive: true }
          }
        }
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(schoolId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
      include: {
        user: true,
        guardians: {
          include: {
            guardian: true
          }
        },
        enrollments: {
          include: {
            class: true,
            section: true,
            academicYear: true
          }
        }
      }
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(schoolId: string, id: string, dto: any, actorId: string) {
    const student = await this.findOne(schoolId, id);

    const updated = await this.prisma.student.update({
      where: { id: student.id },
      data: dto,
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'STUDENT_UPDATED',
      module: 'STUDENTS',
      resourceId: id,
      metadata: dto,
    });

    return updated;
  }
}
