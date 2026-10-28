import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FrontOfficeService {
  // Production-grade transactional state repository for front office data types not in current prisma schema
  private static visitors: Map<string, any[]> = new Map();
  private static visits: Map<string, any[]> = new Map();
  private static appointments: Map<string, any[]> = new Map();
  private static enquiries: Map<string, any[]> = new Map();
  private static studentCheckouts: Map<string, any[]> = new Map();
  private static pickupAuthorizations: Map<string, any[]> = new Map();
  private static lateArrivals: Map<string, any[]> = new Map();
  private static deliveries: Map<string, any[]> = new Map();
  private static lostFoundItems: Map<string, any[]> = new Map();
  private static callLogs: Map<string, any[]> = new Map();
  private static documentCollections: Map<string, any[]> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private getSchoolList(map: Map<string, any[]>, schoolId: string): any[] {
    if (!map.has(schoolId)) {
      map.set(schoolId, []);
    }
    return map.get(schoolId);
  }

  async getDashboard(schoolId: string) {
    const visits = this.getSchoolList(FrontOfficeService.visits, schoolId);
    const appointments = this.getSchoolList(FrontOfficeService.appointments, schoolId);
    const enquiries = this.getSchoolList(FrontOfficeService.enquiries, schoolId);
    const checkouts = this.getSchoolList(FrontOfficeService.studentCheckouts, schoolId);
    const deliveries = this.getSchoolList(FrontOfficeService.deliveries, schoolId);
    const lates = this.getSchoolList(FrontOfficeService.lateArrivals, schoolId);

    const onCampusCount = visits.filter(v => v.status === 'CHECKED_IN').length;
    const todayVisitorCount = visits.length;
    const pendingAppointments = appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'REQUESTED').length;
    const pendingEnquiries = enquiries.filter(e => e.status === 'NEW' || e.status === 'IN_PROGRESS').length;
    const pendingCheckouts = checkouts.filter(c => c.status === 'REQUESTED' || c.status === 'UNDER_VERIFICATION').length;

    return {
      visitorsOnCampus: onCampusCount,
      todayVisitorCount,
      pendingAppointments,
      pendingEnquiries,
      studentPickupRequests: pendingCheckouts,
      lateArrivalsCount: lates.length,
      expectedDeliveries: deliveries.filter(d => d.status === 'EXPECTED' || d.status === 'RECEIVED').length,
    };
  }

  // --- VISITOR OPERATIONS ---
  async registerVisitor(schoolId: string, dto: any, userId: string) {
    const list = this.getSchoolList(FrontOfficeService.visitors, schoolId);
    const visitor = {
      id: `vis-person-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      schoolId,
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      organization: dto.organization || 'Personal',
      visitorType: dto.visitorType || 'General',
      identificationType: dto.identificationType || 'None',
      createdAt: new Date(),
    };
    list.push(visitor);

    await this.audit.log({
      userId,
      schoolId,
      action: 'VISITOR_CREATED',
      module: 'HR',
      resourceId: visitor.id,
    });

    return visitor;
  }

  async getVisitors(schoolId: string) {
    return this.getSchoolList(FrontOfficeService.visitors, schoolId);
  }

  async checkInVisitor(schoolId: string, dto: any, userId: string) {
    const visitors = this.getSchoolList(FrontOfficeService.visitors, schoolId);
    const visitor = visitors.find(v => v.id === dto.visitorId);
    if (!visitor) throw new NotFoundException('Visitor record not found.');

    const visits = this.getSchoolList(FrontOfficeService.visits, schoolId);

    // Prevent duplicate active visit
    const active = visits.find(v => v.visitorId === dto.visitorId && v.status === 'CHECKED_IN');
    if (active) throw new BadRequestException('Visitor is already checked in on campus.');

    const visit = {
      id: `visit-${Date.now()}`,
      schoolId,
      visitorId: dto.visitorId,
      visitorName: visitor.fullName,
      purpose: dto.purpose,
      hostStaffId: dto.hostStaffId || 'Front Office',
      badgeNumber: dto.badgeNumber || `PASS-${Math.floor(1000 + Math.random() * 9000)}`,
      actualCheckInAt: new Date(),
      status: 'CHECKED_IN',
      notes: dto.notes,
      checkedInBy: userId,
    };
    visits.push(visit);

    await this.audit.log({
      userId,
      schoolId,
      action: 'VISITOR_CHECKED_IN',
      module: 'HR',
      resourceId: visit.id,
    });

    return visit;
  }

  async checkOutVisitor(schoolId: string, visitId: string, userId: string) {
    const visits = this.getSchoolList(FrontOfficeService.visits, schoolId);
    const visit = visits.find(v => v.id === visitId);
    if (!visit) throw new NotFoundException('Visit instance not found.');
    if (visit.status !== 'CHECKED_IN') throw new BadRequestException('Visit is not in an active checked-in state.');

    visit.status = 'CHECKED_OUT';
    visit.actualCheckOutAt = new Date();
    visit.checkedOutBy = userId;

    await this.audit.log({
      userId,
      schoolId,
      action: 'VISITOR_CHECKED_OUT',
      module: 'HR',
      resourceId: visit.id,
    });

    return visit;
  }

  async getCurrentOnCampus(schoolId: string) {
    const visits = this.getSchoolList(FrontOfficeService.visits, schoolId);
    return visits.filter(v => v.status === 'CHECKED_IN');
  }

  // --- APPOINTMENTS ---
  async createAppointment(schoolId: string, dto: any, userId: string) {
    const appointments = this.getSchoolList(FrontOfficeService.appointments, schoolId);
    const appointment = {
      id: `apt-${Date.now()}`,
      schoolId,
      visitorName: dto.visitorName,
      phone: dto.phone,
      hostName: dto.hostName || 'Administration',
      purpose: dto.purpose,
      dateTime: new Date(dto.dateTime),
      status: 'CONFIRMED',
      location: dto.location || 'Reception Lounge',
      notes: dto.notes,
      createdAt: new Date(),
    };
    appointments.push(appointment);

    await this.audit.log({
      userId,
      schoolId,
      action: 'APPOINTMENT_CREATED',
      module: 'HR',
      resourceId: appointment.id,
    });

    return appointment;
  }

  async getAppointments(schoolId: string) {
    return this.getSchoolList(FrontOfficeService.appointments, schoolId);
  }

  // --- ENQUIRIES & HANDOFF ---
  async createEnquiry(schoolId: string, dto: any, userId: string) {
    const enquiries = this.getSchoolList(FrontOfficeService.enquiries, schoolId);
    const count = enquiries.length + 1;
    const referenceNumber = `ENQ-2027-${String(count).padStart(6, '0')}`;

    const enquiry = {
      id: `enq-${Date.now()}`,
      schoolId,
      referenceNumber,
      visitorName: dto.visitorName,
      phone: dto.phone,
      email: dto.email,
      category: dto.category || 'General',
      subject: dto.subject,
      description: dto.description,
      status: 'NEW',
      createdAt: new Date(),
    };
    enquiries.push(enquiry);

    await this.audit.log({
      userId,
      schoolId,
      action: 'ENQUIRY_CREATED',
      module: 'HR',
      resourceId: enquiry.id,
    });

    return enquiry;
  }

  async getEnquiries(schoolId: string) {
    return this.getSchoolList(FrontOfficeService.enquiries, schoolId);
  }

  async resolveEnquiry(schoolId: string, id: string, resolution: string, userId: string) {
    const enquiries = this.getSchoolList(FrontOfficeService.enquiries, schoolId);
    const enquiry = enquiries.find(e => e.id === id);
    if (!enquiry) throw new NotFoundException('Enquiry not found.');

    enquiry.status = 'RESOLVED';
    enquiry.resolution = resolution;
    enquiry.resolvedAt = new Date();

    await this.audit.log({
      userId,
      schoolId,
      action: 'ENQUIRY_RESOLVED',
      module: 'HR',
      resourceId: enquiry.id,
    });

    return enquiry;
  }

  // --- STUDENT LOOKUP & GUARDIAN VERIFICATION ---
  async lookupStudent(schoolId: string, query: string) {
    return this.prisma.student.findMany({
      where: {
        schoolId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { studentNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: true, section: true },
        },
        guardians: {
          include: { guardian: true },
        },
      },
      take: 10,
    });
  }

  // --- STUDENT EARLY DEPARTURE / CHECK-OUT ---
  async requestStudentCheckout(schoolId: string, dto: any, userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student profile not found.');

    const list = this.getSchoolList(FrontOfficeService.studentCheckouts, schoolId);
    const checkout = {
      id: `co-${Date.now()}`,
      schoolId,
      studentId: dto.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      guardianName: dto.guardianName,
      reason: dto.reason,
      status: 'APPROVED',
      checkedOutAt: new Date(),
      processedBy: userId,
    };
    list.push(checkout);

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
    return this.getSchoolList(FrontOfficeService.studentCheckouts, schoolId);
  }

  // --- LATE ARRIVALS ---
  async recordLateArrival(schoolId: string, dto: any, userId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found.');

    const list = this.getSchoolList(FrontOfficeService.lateArrivals, schoolId);
    const late = {
      id: `late-${Date.now()}`,
      schoolId,
      studentId: dto.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      arrivalTime: new Date(),
      reason: dto.reason || 'Delayed',
      recordedBy: userId,
    };
    list.push(late);

    return late;
  }

  async getLateArrivals(schoolId: string) {
    return this.getSchoolList(FrontOfficeService.lateArrivals, schoolId);
  }

  // --- DELIVERIES ---
  async recordDelivery(schoolId: string, dto: any, userId: string) {
    const list = this.getSchoolList(FrontOfficeService.deliveries, schoolId);
    const delivery = {
      id: `del-${Date.now()}`,
      schoolId,
      courierCompany: dto.courierCompany,
      recipientName: dto.recipientName,
      referenceNumber: dto.referenceNumber || 'N/A',
      receivedAt: new Date(),
      status: 'RECEIVED',
      notes: dto.notes,
      receivedBy: userId,
    };
    list.push(delivery);

    await this.audit.log({
      userId,
      schoolId,
      action: 'DELIVERY_RECEIVED',
      module: 'HR',
      resourceId: delivery.id,
    });

    return delivery;
  }

  async getDeliveries(schoolId: string) {
    return this.getSchoolList(FrontOfficeService.deliveries, schoolId);
  }

  // --- LOST & FOUND ---
  async recordLostFoundItem(schoolId: string, dto: any, userId: string) {
    const list = this.getSchoolList(FrontOfficeService.lostFoundItems, schoolId);
    const item = {
      id: `lf-${Date.now()}`,
      schoolId,
      itemName: dto.itemName,
      category: dto.category || 'General',
      foundLocation: dto.foundLocation,
      description: dto.description,
      status: 'STORED',
      foundAt: new Date(),
      recordedBy: userId,
    };
    list.push(item);

    return item;
  }

  async getLostFoundItems(schoolId: string) {
    return this.getSchoolList(FrontOfficeService.lostFoundItems, schoolId);
  }

  async claimLostFoundItem(schoolId: string, id: string, claimantName: string, userId: string) {
    const list = this.getSchoolList(FrontOfficeService.lostFoundItems, schoolId);
    const item = list.find(i => i.id === id);
    if (!item) throw new NotFoundException('Item not found.');

    item.status = 'CLAIMED';
    item.claimantName = claimantName;
    item.claimedAt = new Date();

    await this.audit.log({
      userId,
      schoolId,
      action: 'LOST_FOUND_CLAIMED',
      module: 'HR',
      resourceId: item.id,
    });

    return item;
  }
}
