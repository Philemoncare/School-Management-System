import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DataIntegrityService {
  private readonly logger = new Logger(DataIntegrityService.name);

  constructor(private prisma: PrismaService) {}

  async runFullIntegrityCheck() {
    const issues = [];

    // 1. Orphaned Enrollments (No Student or Class)
    const orphanedEnrollments = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT e.id
      FROM "enrollments" e
      LEFT JOIN "students" s ON s.id = e."student_id"
      LEFT JOIN "classes" c ON c.id = e."class_id"
      WHERE s.id IS NULL OR c.id IS NULL
    `;
    if (orphanedEnrollments.length > 0) issues.push({ type: 'ORPHANED_ENROLLMENT', count: orphanedEnrollments.length });

    // 2. Conflicting Active Enrollments (Same student in multiple classes in same term)
    // This is hard to do in one query with Prisma, but we can check for duplicates on unique constraint
    // @@unique([studentId, academicYearId, termId]) already exists, so this is covered at DB level.

    // 3. Negative Financial Balances (unless intended)
    const negativeInvoices = await this.prisma.invoice.findMany({
      where: { balance: { lt: 0 } }
    });
    if (negativeInvoices.length > 0) issues.push({ type: 'NEGATIVE_INVOICE_BALANCE', count: negativeInvoices.length });

    // 4. Over-allocated Payments
    // Sum of allocations > Payment amount
    const payments = await this.prisma.payment.findMany({
      include: { allocations: true }
    });
    const overAllocated = payments.filter(p => {
      const totalAllocated = p.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
      return totalAllocated > Number(p.amount);
    });
    if (overAllocated.length > 0) issues.push({ type: 'OVER_ALLOCATED_PAYMENTS', count: overAllocated.length });

    // 5. Library Copy Availability Conflicts
    // BookCopy status AVAILABLE but has active loan
    const conflictedCopies = await this.prisma.bookCopy.findMany({
      where: {
        status: 'AVAILABLE',
        loans: { some: { status: 'ACTIVE' } }
      }
    });
    if (conflictedCopies.length > 0) issues.push({ type: 'LIBRARY_STATUS_CONFLICT', count: conflictedCopies.length });

    // 6. Teacher Timetable Conflicts (Same teacher, same time, same day)
    const teacherConflicts = await this.prisma.$queryRaw`
      SELECT "teacher_id", "day_of_week", "start_time", COUNT(*)
      FROM "timetable_entries"
      WHERE "status" = 'PUBLISHED'
      GROUP BY "teacher_id", "day_of_week", "start_time"
      HAVING COUNT(*) > 1
    `;
    if ((teacherConflicts as any[]).length > 0) issues.push({ type: 'TEACHER_TIMETABLE_CONFLICT', count: (teacherConflicts as any[]).length });

    // 7. Room Timetable Conflicts
    const roomConflicts = await this.prisma.$queryRaw`
      SELECT "room_id", "day_of_week", "start_time", COUNT(*)
      FROM "timetable_entries"
      WHERE "status" = 'PUBLISHED'
      GROUP BY "room_id", "day_of_week", "start_time"
      HAVING COUNT(*) > 1
    `;
    if ((roomConflicts as any[]).length > 0) issues.push({ type: 'ROOM_TIMETABLE_CONFLICT', count: (roomConflicts as any[]).length });

    // 8. Vehicle Capacity Exceeded
    // This requires checking active assignments vs seating capacity
    const oversizedVehicles = await this.prisma.vehicle.findMany({
      where: {
        status: 'AVAILABLE', // or IN_SERVICE
      },
      include: {
        _count: {
          select: { assignments: { where: { status: 'ACTIVE' } } }
        }
      }
    });
    const vehiclesOverCapacity = oversizedVehicles.filter(v => v._count.assignments > v.seatingCapacity);
    if (vehiclesOverCapacity.length > 0) issues.push({ type: 'VEHICLE_OVER_CAPACITY', count: vehiclesOverCapacity.length });

    return {
      timestamp: new Date(),
      status: issues.length === 0 ? 'CLEAN' : 'ISSUES_FOUND',
      issues
    };
  }
}
