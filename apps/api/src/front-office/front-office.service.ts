import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FrontOfficeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getDashboard(schoolId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [
      visitorsOnCampus,
      todayVisits,
      pendingAppointments,
      pendingEnquiries,
      pendingCheckouts,
      lateArrivals,
      expectedDeliveries,
    ] = await Promise.all([
      this.prisma.visitorVisit.count({
        where: { schoolId, status: 'CHECKED_IN' },
      }),
      this.prisma.visitorVisit.count({
        where: { schoolId, checkInAt: { gte: startOfDay, lt: endOfDay } },
      }),
      this.prisma.frontDeskAppointment.count({
        where: { schoolId, status: { in: ['REQUESTED', 'CONFIRMED'] } },
      }),
      this.prisma.frontDeskEnquiry.count({
        where: { schoolId, status: { in: ['NEW', 'IN_PROGRESS'] } },
      }),
      this.prisma.studentCheckout.count({
        where: {
          schoolId,
          status: { in: ['REQUESTED', 'UNDER_VERIFICATION'] },
        },
      }),
      this.prisma.lateArrival.count({
        where: { schoolId, arrivalTime: { gte: startOfDay, lt: endOfDay } },
      }),
      this.prisma.delivery.count({
        where: { schoolId, status: { in: ['EXPECTED', 'RECEIVED'] } },
      }),
    ]);

    return {
      visitorsOnCampus,
      todayVisitorCount: todayVisits,
      pendingAppointments,
      pendingEnquiries,
      studentPickupRequests: pendingCheckouts,
      lateArrivalsCount: lateArrivals,
      expectedDeliveries,
    };
  }

  // --- VISITORS ---
  async registerVisitor(schoolId: string, dto: any, userId: string) {
    const fullName = dto.fullName?.trim();
    if (!fullName) throw new BadRequestException('Visitor name is required.');

    const visitor = await this.prisma.visitor.create({
      data: {
        schoolId,
        fullName,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        organization: dto.organization?.trim() || null,
        visitorType: dto.visitorType?.trim() || 'General',
        identificationType: dto.identificationType?.trim() || null,
        identificationNumber: dto.identificationNumber?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'VISITOR_CREATED',
      module: 'FRONT_OFFICE',
      resourceId: visitor.id,
    });

    return visitor;
  }

  async getVisitors(schoolId: string) {
    return this.prisma.visitor.findMany({
      where: { schoolId },
      include: {
        _count: { select: { visits: true } },
        visits: {
          orderBy: { checkInAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkInVisitor(schoolId: string, dto: any, userId: string) {
    const visitorId = dto.visitorId;
    if (!visitorId) throw new BadRequestException('Select a visitor to check in.');

    const visitor = await this.prisma.visitor.findFirst({
      where: { id: visitorId, schoolId },
    });
    if (!visitor) throw new NotFoundException('Visitor record not found.');

    const active = await this.prisma.visitorVisit.findFirst({
      where: { schoolId, visitorId, status: 'CHECKED_IN' },
      select: { id: true },
    });
    if (active) {
      throw new ConflictException('This visitor is already checked in on campus.');
    }

    const visit = await this.prisma.visitorVisit.create({
      data: {
        schoolId,
        visitorId,
        purpose: dto.purpose?.trim() || null,
        hostName: dto.hostName?.trim() || null,
        hostStaffId: dto.hostStaffId || null,
        badgeNumber: dto.badgeNumber?.trim() || `PASS-${Date.now().toString().slice(-4)}`,
        status: 'CHECKED_IN',
        notes: dto.notes?.trim() || null,
        checkedInBy: userId,
      },
      include: { visitor: true },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'VISITOR_CHECKED_IN',
      module: 'FRONT_OFFICE',
      resourceId: visit.id,
    });

    return visit;
  }

  async checkOutVisitor(schoolId: string, visitId: string, userId: string) {
    const visit = await this.prisma.visitorVisit.findFirst({
      where: { id: visitId, schoolId },
    });
    if (!visit) throw new NotFoundException('Visit record not found.');
    if (visit.status !== 'CHECKED_IN') {
      throw new BadRequestException('This visit is not currently checked in.');
    }

    const updated = await this.prisma.visitorVisit.update({
      where: { id: visitId },
      data: {
        status: 'CHECKED_OUT',
        checkOutAt: new Date(),
        checkedOutBy: userId,
      },
      include: { visitor: true },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'VISITOR_CHECKED_OUT',
      module: 'FRONT_OFFICE',
      resourceId: updated.id,
    });

    return updated;
  }

  async getCurrentOnCampus(schoolId: string) {
    return this.prisma.visitorVisit.findMany({
      where: { schoolId, status: 'CHECKED_IN' },
      include: { visitor: true },
      orderBy: { checkInAt: 'desc' },
    });
  }

  // --- APPOINTMENTS ---
  async createAppointment(schoolId: string, dto: any, userId: string) {
    const visitorName = dto.visitorName?.trim();
    if (!visitorName) throw new BadRequestException('Visitor name is required.');

    const scheduledAt = dto.dateTime ? new Date(dto.dateTime) : null;
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Enter a valid appointment date and time.');
    }

    const appointment = await this.prisma.frontDeskAppointment.create({
      data: {
        schoolId,
        visitorName,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        hostName: dto.hostName?.trim() || 'Administration',
        purpose: dto.purpose?.trim() || null,
        scheduledAt,
        status: 'CONFIRMED',
        location: dto.location?.trim() || 'Reception',
        notes: dto.notes?.trim() || null,
        createdBy: userId,
      },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'APPOINTMENT_CREATED',
      module: 'FRONT_OFFICE',
      resourceId: appointment.id,
    });

    return appointment;
  }

  async getAppointments(schoolId: string, filters: any = {}) {
    const { status, from, to } = filters;
    return this.prisma.frontDeskAppointment.findMany({
      where: {
        schoolId,
        ...(status ? { status } : {}),
        ...(from || to
          ? {
              scheduledAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async updateAppointmentStatus(
    schoolId: string,
    id: string,
    status: string,
    userId: string,
  ) {
    const allowed = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!allowed.includes(status)) {
      throw new BadRequestException('Unknown appointment status.');
    }
    const appointment = await this.prisma.frontDeskAppointment.findFirst({
      where: { id, schoolId },
    });
    if (!appointment) throw new NotFoundException('Appointment not found.');

    const updated = await this.prisma.frontDeskAppointment.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'APPOINTMENT_STATUS_UPDATED',
      module: 'FRONT_OFFICE',
      resourceId: id,
      metadata: { status },
    });

    return updated;
  }

  // --- ENQUIRIES ---
  async createEnquiry(schoolId: string, dto: any, userId: string) {
    const visitorName = dto.visitorName?.trim();
    const subject = dto.subject?.trim();
    if (!visitorName || !subject) {
      throw new BadRequestException('Visitor name and subject are required.');
    }

    const count = await this.prisma.frontDeskEnquiry.count({ where: { schoolId } });
    const referenceNumber = `ENQ-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    const enquiry = await this.prisma.frontDeskEnquiry.create({
      data: {
        schoolId,
        referenceNumber,
        visitorName,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        category: dto.category?.trim() || 'General',
        subject,
        description: dto.description?.trim() || null,
        status: 'NEW',
        createdBy: userId,
      },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'ENQUIRY_CREATED',
      module: 'FRONT_OFFICE',
      resourceId: enquiry.id,
    });

    return enquiry;
  }

  async getEnquiries(schoolId: string, filters: any = {}) {
    return this.prisma.frontDeskEnquiry.findMany({
      where: { schoolId, ...(filters.status ? { status: filters.status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveEnquiry(
    schoolId: string,
    id: string,
    resolution: string,
    userId: string,
  ) {
    if (!resolution?.trim()) {
      throw new BadRequestException('Enter a resolution note before closing the enquiry.');
    }
    const enquiry = await this.prisma.frontDeskEnquiry.findFirst({
      where: { id, schoolId },
    });
    if (!enquiry) throw new NotFoundException('Enquiry not found.');
    if (enquiry.status === 'RESOLVED') {
      throw new BadRequestException('This enquiry is already resolved.');
    }

    const updated = await this.prisma.frontDeskEnquiry.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution: resolution.trim(),
        resolvedAt: new Date(),
        resolvedBy: userId,
      },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'ENQUIRY_RESOLVED',
      module: 'FRONT_OFFICE',
      resourceId: id,
    });

    return updated;
  }

  // --- STUDENT LOOKUP & GUARDIAN VERIFICATION ---
  async lookupStudent(schoolId: string, query: string) {
    const needle = query?.trim();
    if (!needle) return [];
    return this.prisma.student.findMany({
      where: {
        schoolId,
        OR: [
          { firstName: { contains: needle, mode: 'insensitive' } },
          { lastName: { contains: needle, mode: 'insensitive' } },
          { studentNumber: { contains: needle, mode: 'insensitive' } },
        ],
      },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: true, section: true },
        },
        guardians: { include: { guardian: true } },
      },
      take: 10,
    });
  }

  // --- STUDENT EARLY DEPARTURE / CHECK-OUT ---
  async requestStudentCheckout(schoolId: string, dto: any, userId: string) {
    if (!dto.studentId) throw new BadRequestException('Select a student.');
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student profile not found.');

    if (!dto.guardianName?.trim()) {
      throw new BadRequestException('Record who collected the student.');
    }
    if (!dto.reason?.trim()) {
      throw new BadRequestException('Enter the reason for early departure.');
    }

    const existing = await this.prisma.studentCheckout.findFirst({
      where: {
        schoolId,
        studentId: dto.studentId,
        checkedOutAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('This student has already been checked out today.');
    }

    const checkout = await this.prisma.studentCheckout.create({
      data: {
        schoolId,
        studentId: dto.studentId,
        guardianName: dto.guardianName.trim(),
        relationship: dto.relationship?.trim() || null,
        reason: dto.reason.trim(),
        status: 'COMPLETED',
        notes: dto.notes?.trim() || null,
        processedBy: userId,
      },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'STUDENT_CHECKOUT_COMPLETED',
      module: 'ATTENDANCE',
      resourceId: checkout.id,
    });

    return checkout;
  }

  async getStudentCheckouts(schoolId: string) {
    const rows = await this.prisma.studentCheckout.findMany({
      where: { schoolId },
      orderBy: { checkedOutAt: 'desc' },
    });
    return this.attachStudents(schoolId, rows);
  }

  // --- LATE ARRIVALS ---
  async recordLateArrival(schoolId: string, dto: any, userId: string) {
    if (!dto.studentId) throw new BadRequestException('Select a student.');
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found.');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const existing = await this.prisma.lateArrival.findFirst({
      where: {
        schoolId,
        studentId: dto.studentId,
        arrivalTime: { gte: startOfDay },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A late arrival is already recorded for this student today.');
    }

    const late = await this.prisma.lateArrival.create({
      data: {
        schoolId,
        studentId: dto.studentId,
        arrivalTime: dto.arrivalTime ? new Date(dto.arrivalTime) : new Date(),
        reason: dto.reason?.trim() || 'Delayed',
        notes: dto.notes?.trim() || null,
        recordedBy: userId,
      },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'LATE_ARRIVAL_RECORDED',
      module: 'FRONT_OFFICE',
      resourceId: late.id,
    });

    return late;
  }

  async getLateArrivals(schoolId: string) {
    const rows = await this.prisma.lateArrival.findMany({
      where: { schoolId },
      orderBy: { arrivalTime: 'desc' },
    });
    return this.attachStudents(schoolId, rows);
  }

  async updateLateArrival(schoolId: string, id: string, dto: any, userId: string) {
    const late = await this.prisma.lateArrival.findFirst({ where: { id, schoolId } });
    if (!late) throw new NotFoundException('Late arrival record not found.');

    const updated = await this.prisma.lateArrival.update({
      where: { id },
      data: {
        ...(dto.reason !== undefined ? { reason: dto.reason?.trim() || 'Delayed' } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
      },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'LATE_ARRIVAL_UPDATED',
      module: 'FRONT_OFFICE',
      resourceId: id,
    });

    return updated;
  }

  // --- DELIVERIES ---
  async recordDelivery(schoolId: string, dto: any, userId: string) {
    const recipientName = dto.recipientName?.trim();
    if (!recipientName) {
      throw new BadRequestException('Record who the delivery is for.');
    }

    const delivery = await this.prisma.delivery.create({
      data: {
        schoolId,
        courierCompany: dto.courierCompany?.trim() || null,
        recipientName,
        referenceNumber: dto.referenceNumber?.trim() || null,
        description: dto.description?.trim() || null,
        status: 'RECEIVED',
        notes: dto.notes?.trim() || null,
        receivedBy: userId,
      },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'DELIVERY_RECEIVED',
      module: 'FRONT_OFFICE',
      resourceId: delivery.id,
    });

    return delivery;
  }

  async getDeliveries(schoolId: string) {
    return this.prisma.delivery.findMany({
      where: { schoolId },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async markDeliveryCollected(schoolId: string, id: string, dto: any, userId: string) {
    const delivery = await this.prisma.delivery.findFirst({ where: { id, schoolId } });
    if (!delivery) throw new NotFoundException('Delivery not found.');
    if (delivery.status === 'COLLECTED') {
      throw new BadRequestException('This delivery has already been collected.');
    }

    const updated = await this.prisma.delivery.update({
      where: { id },
      data: {
        status: 'COLLECTED',
        collectedAt: new Date(),
        collectedBy: dto.collectedBy?.trim() || userId,
      },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'DELIVERY_COLLECTED',
      module: 'FRONT_OFFICE',
      resourceId: id,
    });

    return updated;
  }

  // --- LOST & FOUND ---
  async recordLostFoundItem(schoolId: string, dto: any, userId: string) {
    const itemName = dto.itemName?.trim();
    if (!itemName) throw new BadRequestException('Item name is required.');

    const item = await this.prisma.lostFoundItem.create({
      data: {
        schoolId,
        itemName,
        category: dto.category?.trim() || 'General',
        foundLocation: dto.foundLocation?.trim() || null,
        description: dto.description?.trim() || null,
        status: 'STORED',
        recordedBy: userId,
      },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'LOST_FOUND_RECORDED',
      module: 'FRONT_OFFICE',
      resourceId: item.id,
    });

    return item;
  }

  async getLostFoundItems(schoolId: string) {
    return this.prisma.lostFoundItem.findMany({
      where: { schoolId },
      orderBy: { foundAt: 'desc' },
    });
  }

  async claimLostFoundItem(
    schoolId: string,
    id: string,
    claimantName: string,
    userId: string,
  ) {
    if (!claimantName?.trim()) {
      throw new BadRequestException('Record who is collecting the item.');
    }
    const item = await this.prisma.lostFoundItem.findFirst({ where: { id, schoolId } });
    if (!item) throw new NotFoundException('Item not found.');
    if (item.status === 'CLAIMED') {
      throw new BadRequestException('This item has already been claimed.');
    }

    const updated = await this.prisma.lostFoundItem.update({
      where: { id },
      data: {
        status: 'CLAIMED',
        claimantName: claimantName.trim(),
        claimedAt: new Date(),
      },
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'LOST_FOUND_CLAIMED',
      module: 'FRONT_OFFICE',
      resourceId: id,
    });

    return updated;
  }

  /**
   * Checkouts and late arrivals store the student id; the reception desk needs
   * names and class. This resolves them in one query instead of trusting a
   * denormalised copy captured at write time.
   */
  private async attachStudents<T extends { studentId: string }>(
    schoolId: string,
    rows: T[],
  ) {
    if (rows.length === 0) return [];
    const students = await this.prisma.student.findMany({
      where: { schoolId, id: { in: rows.map((row) => row.studentId) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentNumber: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          select: {
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
          take: 1,
        },
      },
    });
    const byId = new Map(students.map((student) => [student.id, student]));
    return rows.map((row) => {
      const student = byId.get(row.studentId);
      return {
        ...row,
        student: student
          ? {
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              studentNumber: student.studentNumber,
              className: student.enrollments[0]?.class?.name ?? null,
              sectionName: student.enrollments[0]?.section?.name ?? null,
            }
          : null,
      };
    });
  }
}
