import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResourceAuthorizationService {
  constructor(private prisma: PrismaService) {}

  async authorizeStudent(studentId: string, context: { userId: string; schoolId: string; roles: string[] }) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId: context.schoolId },
    });

    if (!student) throw new NotFoundException('Student not found');

    // Super Admin / School Admin / Principal bypass
    if (context.roles.some(r => ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'].includes(r))) {
      return student;
    }

    // Teacher check: Must be assigned to student's class/section
    if (context.roles.includes('TEACHER')) {
      const isAssigned = await this.prisma.teacherAssignment.count({
        where: {
          teacher: { userId: context.userId },
          section: { enrollments: { some: { studentId } } },
        },
      });
      if (isAssigned > 0) return student;
    }

    // Guardian check: Must be linked
    if (context.roles.includes('GUARDIAN')) {
      const isLinked = await this.prisma.studentGuardian.count({
        where: { studentId, guardian: { userId: context.userId } },
      });
      if (isLinked > 0) return student;
    }

    // Student check: Own profile
    if (student.userId === context.userId) return student;

    throw new ForbiddenException('Not authorized to access this student record');
  }

  async authorizeReport(reportId: string, context: { userId: string; schoolId: string; roles: string[] }) {
    const definition = await this.prisma.reportDefinition.findFirst({
      where: {
        id: reportId,
        OR: [
          { schoolId: context.schoolId },
          { schoolId: null }
        ]
      },
    });

    if (!definition) throw new NotFoundException('Report not found');

    // Super Admin can see all platform reports
    if (context.roles.includes('SUPER_ADMIN')) return definition;

    // Check specific permission if required
    if (definition.requiredPermission) {
        // This assumes context.permissions exists or we fetch them
    }

    return definition;
  }

  async authorizeFinanceRecord(invoiceId: string, context: { userId: string; schoolId: string; roles: string[] }) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, schoolId: context.schoolId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    if (context.roles.some(r => ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'].includes(r))) {
      return invoice;
    }

    // Student/Guardian can only see own invoices
    if (context.roles.includes('STUDENT') || context.roles.includes('GUARDIAN')) {
        const student = await this.prisma.student.findFirst({
            where: {
                id: invoice.studentId,
                OR: [
                    { userId: context.userId },
                    { guardians: { some: { guardian: { userId: context.userId } } } }
                ]
            }
        });
        if (student) return invoice;
    }

    throw new ForbiddenException('Not authorized to access this financial record');
  }
}
