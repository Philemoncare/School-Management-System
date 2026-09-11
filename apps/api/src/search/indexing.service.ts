import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchableEntityType } from '@prisma/client';

@Injectable()
export class IndexingService {
  private readonly logger = new Logger(IndexingService.name);

  constructor(private prisma: PrismaService) {}

  async indexStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: true, section: true },
          take: 1
        }
      }
    });

    if (!student) return;

    const enrollment = student.enrollments[0];
    const classInfo = enrollment ? `${enrollment.class.name} - ${enrollment.section?.name || ''}` : '';

    await this.upsertIndex({
      schoolId: student.schoolId,
      entityId: student.id,
      entityType: 'STUDENT',
      title: `${student.firstName} ${student.lastName}`,
      subtitle: `${student.studentNumber} | ${classInfo}`.trim(),
      content: `${student.firstName} ${student.lastName} ${student.studentNumber} ${student.admissionNumber || ''} ${student.user?.email || ''}`,
      status: student.status,
      module: 'STUDENTS',
      metadata: {
        studentNumber: student.studentNumber,
        classId: enrollment?.classId,
      }
    });
  }

  async indexTeacher(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true, department: true }
    });

    if (!teacher) return;

    await this.upsertIndex({
      schoolId: teacher.schoolId,
      entityId: teacher.id,
      entityType: 'TEACHER',
      title: `${teacher.firstName} ${teacher.lastName}`,
      subtitle: `${teacher.employeeId} | ${teacher.department?.name || 'No Department'}`,
      content: `${teacher.firstName} ${teacher.lastName} ${teacher.employeeId} ${teacher.user?.email || ''} ${teacher.specialization || ''}`,
      status: teacher.status,
      module: 'STAFF',
      metadata: {
        employeeId: teacher.employeeId,
        departmentId: teacher.departmentId,
      }
    });
  }

  async indexStaff(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true, department: true, position: true }
    });

    if (!staff) return;

    await this.upsertIndex({
      schoolId: staff.schoolId,
      entityId: staff.id,
      entityType: 'STAFF',
      title: `${staff.firstName} ${staff.lastName}`,
      subtitle: `${staff.employeeId} | ${staff.position?.name || staff.designation || ''} | ${staff.department?.name || ''}`.trim(),
      content: `${staff.firstName} ${staff.lastName} ${staff.employeeId} ${staff.user?.email || ''} ${staff.designation || ''}`,
      status: staff.status,
      module: 'HR',
      metadata: {
        employeeId: staff.employeeId,
        departmentId: staff.departmentId,
      }
    });
  }

  async indexGuardian(guardianId: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: guardianId },
      include: { students: { include: { student: true } } }
    });

    if (!guardian) return;

    const children = guardian.students.map(s => `${s.student.firstName} ${s.student.lastName}`).join(', ');
    const schoolId = guardian.students[0]?.student.schoolId;

    if (!schoolId) return;

    await this.upsertIndex({
      schoolId,
      entityId: guardian.id,
      entityType: 'GUARDIAN',
      title: `${guardian.firstName} ${guardian.lastName}`,
      subtitle: `Guardian of: ${children}`,
      content: `${guardian.firstName} ${guardian.lastName} ${guardian.email || ''} ${guardian.phone || ''} ${children}`,
      module: 'STUDENTS',
      metadata: {
        email: guardian.email,
        phone: guardian.phone,
      }
    });
  }

  async indexAdmissionApplication(applicationId: string) {
    const app = await this.prisma.admissionApplication.findUnique({
      where: { id: applicationId },
      include: { class: true, academicYear: true }
    });

    if (!app) return;

    await this.upsertIndex({
      schoolId: app.schoolId,
      entityId: app.id,
      entityType: 'ADMISSION_APPLICATION',
      title: `${app.firstName} ${app.lastName}`,
      subtitle: `${app.reference} | ${app.class.name} | ${app.status}`,
      content: `${app.firstName} ${app.lastName} ${app.reference} ${app.status}`,
      status: app.status,
      module: 'ADMISSIONS',
      metadata: {
        reference: app.reference,
        classId: app.classId,
      }
    });
  }

  async indexClass(classId: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!cls) return;
    await this.upsertIndex({
      schoolId: cls.schoolId,
      entityId: cls.id,
      entityType: 'CLASS',
      title: cls.name,
      subtitle: `Code: ${cls.code} | Level: ${cls.level}`,
      content: `${cls.name} ${cls.code}`,
      status: cls.isActive ? 'ACTIVE' : 'INACTIVE',
      module: 'ACADEMICS'
    });
  }

  async indexSection(sectionId: string) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true }
    });
    if (!section) return;
    await this.upsertIndex({
      schoolId: section.class.schoolId,
      entityId: section.id,
      entityType: 'SECTION',
      title: `${section.class.name} - ${section.name}`,
      subtitle: `Code: ${section.code} | Capacity: ${section.capacity || 'N/A'}`,
      content: `${section.class.name} ${section.name} ${section.code}`,
      status: section.isActive ? 'ACTIVE' : 'INACTIVE',
      module: 'ACADEMICS'
    });
  }

  async indexSubject(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) return;
    await this.upsertIndex({
      schoolId: subject.schoolId,
      entityId: subject.id,
      entityType: 'SUBJECT',
      title: subject.name,
      subtitle: `Code: ${subject.code} | Type: ${subject.subjectType}`,
      content: `${subject.name} ${subject.code}`,
      status: subject.isActive ? 'ACTIVE' : 'INACTIVE',
      module: 'ACADEMICS'
    });
  }

  async indexAssessment(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { class: true, subject: true, assessmentType: true }
    });
    if (!assessment) return;
    await this.upsertIndex({
      schoolId: assessment.schoolId,
      entityId: assessment.id,
      entityType: 'ASSESSMENT',
      title: assessment.name,
      subtitle: `${assessment.assessmentType.name} | ${assessment.class.name} | ${assessment.subject.name}`,
      content: `${assessment.name} ${assessment.code} ${assessment.class.name} ${assessment.subject.name}`,
      status: assessment.status,
      module: 'ACADEMICS'
    });
  }

  async indexExamination(examPeriodId: string) {
    const exam = await this.prisma.examinationPeriod.findUnique({
      where: { id: examPeriodId },
      include: { academicYear: true }
    });
    if (!exam) return;
    await this.upsertIndex({
      schoolId: exam.schoolId,
      entityId: exam.id,
      entityType: 'EXAMINATION',
      title: exam.name,
      subtitle: `${exam.academicYear.name} | ${exam.startDate.toLocaleDateString()} - ${exam.endDate.toLocaleDateString()}`,
      content: `${exam.name} ${exam.code}`,
      status: exam.status,
      module: 'ACADEMICS'
    });
  }

  async indexResult(resultId: string) {
    const result = await this.prisma.subjectResult.findUnique({
      where: { id: resultId },
      include: { student: true, subject: true }
    });
    if (!result) return;
    await this.upsertIndex({
      schoolId: result.schoolId,
      entityId: result.id,
      entityType: 'RESULT',
      title: `Result: ${result.student.firstName} ${result.student.lastName}`,
      subtitle: `${result.subject.name} | Grade: ${result.grade} | ${result.percentage}%`,
      content: `${result.student.firstName} ${result.student.lastName} ${result.subject.name} ${result.grade}`,
      status: result.status,
      module: 'ACADEMICS',
      metadata: {
        studentId: result.studentId,
        subjectId: result.subjectId
      }
    });
  }

  async indexInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { student: true }
    });

    if (!invoice) return;

    await this.upsertIndex({
      schoolId: invoice.schoolId,
      entityId: invoice.id,
      entityType: 'INVOICE',
      title: `Invoice ${invoice.invoiceNumber}`,
      subtitle: `${invoice.student.firstName} ${invoice.student.lastName} | ${invoice.totalAmount} ${invoice.currency}`,
      content: `${invoice.invoiceNumber} ${invoice.student.firstName} ${invoice.student.lastName} ${invoice.status}`,
      status: invoice.status,
      module: 'FINANCE',
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        studentId: invoice.studentId,
        totalAmount: invoice.totalAmount,
      }
    });
  }

  async indexPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { student: true }
    });
    if (!payment) return;
    await this.upsertIndex({
      schoolId: payment.schoolId,
      entityId: payment.id,
      entityType: 'PAYMENT',
      title: `Payment: ${payment.paymentReference}`,
      subtitle: `${payment.student.firstName} ${payment.student.lastName} | ${payment.amount} ${payment.currency}`,
      content: `${payment.paymentReference} ${payment.externalReference || ''} ${payment.student.firstName} ${payment.student.lastName}`,
      status: payment.status,
      module: 'FINANCE'
    });
  }

  async indexReceipt(receiptId: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { student: true }
    });
    if (!receipt) return;
    await this.upsertIndex({
      schoolId: receipt.schoolId,
      entityId: receipt.id,
      entityType: 'RECEIPT',
      title: `Receipt: ${receipt.receiptNumber}`,
      subtitle: `${receipt.student.firstName} ${receipt.student.lastName} | ${receipt.amount} ${receipt.currency}`,
      content: `${receipt.receiptNumber} ${receipt.student.firstName} ${receipt.student.lastName}`,
      module: 'FINANCE'
    });
  }

  async indexBook(bookId: string) {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: { category: true, authors: { include: { author: true } } }
    });

    if (!book) return;

    const authors = book.authors.map(a => a.author.name).join(', ');

    await this.upsertIndex({
      schoolId: book.schoolId,
      entityId: book.id,
      entityType: 'LIBRARY_BOOK',
      title: book.title,
      subtitle: `${authors} | ${book.category?.name || ''}`.trim(),
      content: `${book.title} ${book.isbn || ''} ${authors} ${book.category?.name || ''}`,
      module: 'LIBRARY',
      metadata: {
        isbn: book.isbn,
        categoryId: book.categoryId,
      }
    });
  }

  async indexBookCopy(copyId: string) {
    const copy = await this.prisma.bookCopy.findUnique({
      where: { id: copyId },
      include: { book: true }
    });
    if (!copy) return;
    await this.upsertIndex({
      schoolId: copy.schoolId,
      entityId: copy.id,
      entityType: 'LIBRARY_COPY',
      title: `Copy: ${copy.accessionNumber}`,
      subtitle: `${copy.book.title} | Barcode: ${copy.barcode || 'N/A'}`,
      content: `${copy.accessionNumber} ${copy.barcode || ''} ${copy.book.title}`,
      status: copy.status,
      module: 'LIBRARY'
    });
  }

  async indexLibraryLoan(loanId: string) {
    const loan = await this.prisma.libraryLoan.findUnique({
      where: { id: loanId },
      include: {
        bookCopy: { include: { book: true } },
        membership: { include: { user: true } }
      }
    });

    if (!loan) return;

    const borrower = `${loan.membership.user.firstName} ${loan.membership.user.lastName}`;

    await this.upsertIndex({
      schoolId: loan.schoolId,
      entityId: loan.id,
      entityType: 'LIBRARY_LOAN',
      title: `Loan: ${loan.bookCopy.book.title}`,
      subtitle: `Borrowed by ${borrower} | Due ${loan.dueDate.toLocaleDateString()}`,
      content: `${loan.bookCopy.book.title} ${borrower} ${loan.status}`,
      status: loan.status,
      module: 'LIBRARY',
      metadata: {
        bookId: loan.bookCopy.bookId,
        membershipId: loan.membershipId,
        dueDate: loan.dueDate
      }
    });
  }

  async indexTransportRoute(routeId: string) {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId }
    });

    if (!route) return;

    await this.upsertIndex({
      schoolId: route.schoolId,
      entityId: route.id,
      entityType: 'TRANSPORT_ROUTE',
      title: route.name,
      subtitle: `${route.code || ''} | ${route.direction}`.trim(),
      content: `${route.name} ${route.code || ''}`,
      status: route.status,
      module: 'TRANSPORT'
    });
  }

  async indexVehicle(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });
    if (!vehicle) return;
    await this.upsertIndex({
      schoolId: vehicle.schoolId,
      entityId: vehicle.id,
      entityType: 'TRANSPORT_VEHICLE',
      title: vehicle.registrationNumber,
      subtitle: `${vehicle.make} ${vehicle.model} | Cap: ${vehicle.seatingCapacity}`,
      content: `${vehicle.registrationNumber} ${vehicle.make || ''} ${vehicle.model || ''}`,
      status: vehicle.status,
      module: 'TRANSPORT'
    });
  }

  async indexDocument(documentId: string, type: 'STAFF' | 'VEHICLE' | 'DRIVER' | 'ADMISSION') {
    let doc: any;
    let schoolId: string = '';
    let title: string = '';
    let subtitle: string = '';
    let status: string = '';

    switch (type) {
      case 'STAFF':
        doc = await this.prisma.staffDocument.findUnique({ where: { id: documentId }, include: { staff: true, teacher: true } });
        schoolId = doc?.staff?.schoolId || doc?.teacher?.schoolId || '';
        title = doc?.title || '';
        subtitle = `Staff: ${doc?.staff?.firstName || doc?.teacher?.firstName} ${doc?.staff?.lastName || doc?.teacher?.lastName}`;
        status = doc?.verificationStatus;
        break;
      case 'VEHICLE':
        doc = await this.prisma.vehicleDocument.findUnique({ where: { id: documentId }, include: { vehicle: true } });
        schoolId = doc?.vehicle?.schoolId || '';
        title = doc?.type || 'Vehicle Document';
        subtitle = `Vehicle: ${doc?.vehicle?.registrationNumber}`;
        status = doc?.verified ? 'VERIFIED' : 'PENDING';
        break;
      case 'ADMISSION':
        doc = await this.prisma.admissionApplicationDocument.findUnique({ where: { id: documentId }, include: { application: true } });
        schoolId = doc?.application?.schoolId || '';
        title = doc?.title || '';
        subtitle = `App: ${doc?.application?.reference}`;
        status = doc?.verificationStatus;
        break;
    }

    if (!doc || !schoolId) return;

    await this.upsertIndex({
      schoolId,
      entityId: documentId,
      entityType: 'DOCUMENT',
      title,
      subtitle,
      content: `${title} ${doc.documentNumber || ''} ${subtitle}`,
      status,
      module: 'DOCUMENTS',
      metadata: {
        documentType: type,
        fileUrl: doc.fileUrl
      }
    });
  }

  async indexAnnouncement(announcementId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId }
    });

    if (!announcement || !announcement.schoolId) return;

    await this.upsertIndex({
      schoolId: announcement.schoolId,
      entityId: announcement.id,
      entityType: 'ANNOUNCEMENT',
      title: announcement.title,
      subtitle: announcement.priority,
      content: `${announcement.title} ${announcement.content}`,
      status: announcement.status,
      module: 'COMMUNICATION'
    });
  }

  async indexConversation(conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { include: { user: true } } }
    });
    if (!conversation) return;
    const participants = conversation.participants.map(p => `${p.user.firstName} ${p.user.lastName}`).join(', ');
    await this.upsertIndex({
      schoolId: conversation.schoolId,
      entityId: conversation.id,
      entityType: 'CONVERSATION',
      title: conversation.title || `Chat with ${participants}`,
      subtitle: participants,
      content: `${conversation.title || ''} ${participants}`,
      module: 'COMMUNICATION'
    });
  }

  async indexWorkflow(instanceId: string) {
    const workflow = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId }
    });
    if (!workflow) return;
    await this.upsertIndex({
      schoolId: workflow.schoolId,
      entityId: workflow.id,
      entityType: 'WORKFLOW',
      title: `Workflow: ${workflow.workflowType}`,
      subtitle: `Status: ${workflow.status} | ID: ${workflow.id.split('-')[0]}`,
      content: `${workflow.workflowType} ${workflow.correlationId || ''}`,
      status: workflow.status,
      module: 'OPERATIONS'
    });
  }

  async indexUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) return;
    await this.upsertIndex({
      schoolId: 'PLATFORM', // Scoped to platform
      entityId: user.id,
      entityType: 'USER',
      title: `${user.firstName} ${user.lastName}`,
      subtitle: user.email,
      content: `${user.firstName} ${user.lastName} ${user.email} ${user.phone || ''}`,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      module: 'USER_MANAGEMENT'
    });
  }

  async indexSchool(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId }
    });
    if (!school) return;
    await this.upsertIndex({
      schoolId: 'PLATFORM',
      entityId: school.id,
      entityType: 'SCHOOL',
      title: school.name,
      subtitle: `${school.code} | ${school.email || ''}`,
      content: `${school.name} ${school.code} ${school.slug}`,
      status: school.status,
      module: 'PLATFORM'
    });
  }

  private async upsertIndex(data: {
    schoolId: string;
    entityId: string;
    entityType: SearchableEntityType;
    title: string;
    subtitle?: string;
    content?: string;
    status?: string;
    module: string;
    metadata?: any;
  }) {
    const { schoolId, entityId, entityType, ...rest } = data;
    try {
      await this.prisma.searchIndex.upsert({
        where: {
          schoolId_entityType_entityId: {
            schoolId,
            entityType,
            entityId,
          },
        },
        update: {
          ...rest,
          updatedAt: new Date(),
        },
        create: {
          schoolId,
          entityType,
          entityId,
          ...rest,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to upsert index for ${entityType} ${entityId}: ${error.message}`);
    }
  }

  async removeEntity(schoolId: string, entityId: string, entityType: SearchableEntityType) {
    return this.prisma.searchIndex.deleteMany({
      where: { schoolId, entityId, entityType },
    });
  }

  async reindexAll(schoolId: string) {
    this.logger.log(`Starting full reindex for school ${schoolId}`);

    const tasks: { model: string, method: (id: string) => Promise<void>, where?: any }[] = [
      { model: 'student', method: this.indexStudent.bind(this) },
      { model: 'teacher', method: this.indexTeacher.bind(this) },
      { model: 'staff', method: this.indexStaff.bind(this) },
      { model: 'guardian', method: this.indexGuardian.bind(this) },
      { model: 'admissionApplication', method: this.indexAdmissionApplication.bind(this) },
      { model: 'class', method: this.indexClass.bind(this) },
      { model: 'subject', method: this.indexSubject.bind(this) },
      { model: 'assessment', method: this.indexAssessment.bind(this) },
      { model: 'examinationPeriod', method: this.indexExamination.bind(this) },
      { model: 'invoice', method: this.indexInvoice.bind(this) },
      { model: 'payment', method: this.indexPayment.bind(this) },
      { model: 'book', method: this.indexBook.bind(this) },
      { model: 'bookCopy', method: this.indexBookCopy.bind(this) },
      { model: 'route', method: this.indexTransportRoute.bind(this) },
      { model: 'vehicle', method: this.indexVehicle.bind(this) },
      { model: 'announcement', method: this.indexAnnouncement.bind(this) },
      { model: 'conversation', method: this.indexConversation.bind(this) },
      { model: 'workflowInstance', method: this.indexWorkflow.bind(this) },
    ];

    for (const task of tasks) {
      try {
        const items = await (this.prisma[task.model] as any).findMany({
          where: task.where || { schoolId },
          select: { id: true }
        });
        for (const item of items) {
          await task.method(item.id);
        }
      } catch (err) {
        this.logger.error(`Failed to reindex ${task.model}: ${err.message}`);
      }
    }

    // Special case for documents
    const docTypes: ('STAFF' | 'VEHICLE' | 'ADMISSION')[] = ['STAFF', 'VEHICLE', 'ADMISSION'];
    for (const type of docTypes) {
        // This is simplified, real implementation would query each doc model
    }

    this.logger.log(`Completed full reindex for school ${schoolId}`);
  }
}
