import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '../event-dispatcher.service';
import { OutboxEvent } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class StaffLifecycleHandler implements EventHandler {
  private readonly logger = new Logger(StaffLifecycleHandler.name);

  constructor(private prisma: PrismaService) {}

  async handle(event: OutboxEvent): Promise<void> {
    const { schoolId, eventType, payload } = event as any;
    const { staffId, teacherId } = payload;

    this.logger.log(`Handling ${eventType} for staff/teacher ${staffId || teacherId}`);

    if (eventType === 'STAFF_TERMINATED' || eventType === 'STAFF_OFFBOARDED') {
      await this.handleAccessRevocation(schoolId, staffId, teacherId);
      await this.handleAcademicCleanup(schoolId, teacherId);
    }
  }

  private async handleAccessRevocation(schoolId: string, staffId?: string, teacherId?: string) {
    let userId: string | null = null;

    if (staffId) {
      const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
      userId = staff?.userId || null;
    } else if (teacherId) {
      const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
      userId = teacher?.userId || null;
    }

    if (userId) {
      await this.prisma.schoolMembership.update({
        where: { schoolId_userId: { schoolId, userId } },
        data: { status: 'INACTIVE' }
      });
    }
  }

  private async handleAcademicCleanup(schoolId: string, teacherId?: string) {
    if (!teacherId) return;

    // Remove future teaching assignments or mark for substitution
    // We could automatically create substitution alerts here
    const activeAssignments = await this.prisma.teacherAssignment.findMany({
      where: { teacherId, status: 'ACTIVE' }
    });

    for (const assignment of activeAssignments) {
        // Logic to notify HOD and request substitution
    }
  }
}
