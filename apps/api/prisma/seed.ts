import {
  PrismaClient,
  SchoolStatus,
  MembershipStatus,
  StudentStatus,
  EnrollmentStatus,
  AcademicYearStatus,
  TermStatus,
  SubjectType,
  StaffStatus,
  AssessmentStatus,
  ScoreStatus,
  ResultStatus,
  AttendanceStatus,
  AttendanceSessionType,
  AttendanceSessionStatus,
  SubscriptionStatus,
  VehicleStatus,
  BillingInterval,
  PlanStatus,
  CommunicationChannel,
  NotificationPriority,
  AnnouncementStatus,
  AudienceType
} from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../../.env') });
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('password123');

  // 1. Platform Subscription Plans
  console.log('Seeding Subscription Plans...');
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'BASIC' },
    update: {},
    create: {
      name: 'Basic Plan',
      code: 'BASIC',
      description: 'Core school management features',
      status: PlanStatus.ACTIVE,
      features: { students: 100, staff: 10, storage: '1GB' }
    }
  });

  const basicPricing = await prisma.subscriptionPricing.upsert({
    where: { id: 'basic-pricing-id' }, // Using a fixed ID for simplicity in upsert if needed, but create is fine if we wipe
    update: {},
    create: {
      id: 'basic-pricing-id',
      planId: basicPlan.id,
      amount: 0,
      currency: 'USD',
      interval: BillingInterval.MONTHLY,
      isActive: true
    }
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { code: 'PREMIUM' },
    update: {},
    create: {
      name: 'Premium Plan',
      code: 'PREMIUM',
      description: 'Advanced academic and financial tools',
      status: PlanStatus.ACTIVE,
      features: { students: 1000, staff: 100, storage: '50GB', sms: true }
    }
  });

  const premiumPricing = await prisma.subscriptionPricing.upsert({
    where: { id: 'premium-pricing-id' },
    update: {},
    create: {
      id: 'premium-pricing-id',
      planId: premiumPlan.id,
      amount: 49.99,
      currency: 'USD',
      interval: BillingInterval.MONTHLY,
      isActive: true
    }
  });

  // 2. Super Admin
  console.log('Seeding Super Admin...');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@platform.com' },
    update: {},
    create: {
      email: 'superadmin@platform.com',
      passwordHash,
      firstName: 'Platform',
      lastName: 'Admin',
      isActive: true,
    },
  });

  const superAdminRole = await prisma.role.upsert({
    where: { name_schoolId: { name: 'SUPER_ADMIN', schoolId: null as any } },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Platform Super Administrator',
      isSystem: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId_schoolId: { userId: superAdmin.id, roleId: superAdminRole.id, schoolId: null as any } },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });

  // 3. Demo School 1
  console.log('Seeding Demo School 1...');
  const demoSchool = await prisma.school.upsert({
    where: { code: 'DEMO001' },
    update: {},
    create: {
      name: 'Greenwood Academy',
      code: 'DEMO001',
      slug: 'greenwood-academy',
      status: SchoolStatus.ACTIVE,
      timezone: 'UTC',
      currency: 'USD',
    },
  });

  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await prisma.schoolSubscription.upsert({
    where: { schoolId: demoSchool.id },
    update: {},
    create: {
      schoolId: demoSchool.id,
      planId: premiumPlan.id,
      pricingId: premiumPricing.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    }
  });

  // 4. Roles
  const roles = ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'LIBRARIAN'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name_schoolId: { name: roleName, schoolId: demoSchool.id } },
      update: {},
      create: { name: roleName, schoolId: demoSchool.id, isSystem: true }
    });
  }

  // 5. School Admin
  const adminRole = await prisma.role.findFirst({ where: { name: 'SCHOOL_ADMIN', schoolId: demoSchool.id } });
  const schoolAdminUser = await prisma.user.upsert({
    where: { email: 'admin@greenwood.com' },
    update: {},
    create: {
      email: 'admin@greenwood.com',
      passwordHash,
      firstName: 'Greenwood',
      lastName: 'Admin',
    },
  });

  await prisma.schoolMembership.upsert({
    where: { schoolId_userId: { schoolId: demoSchool.id, userId: schoolAdminUser.id } },
    update: {},
    create: {
      schoolId: demoSchool.id,
      userId: schoolAdminUser.id,
      status: MembershipStatus.ACTIVE,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId_schoolId: { userId: schoolAdminUser.id, roleId: adminRole!.id, schoolId: demoSchool.id } },
    update: {},
    create: {
      userId: schoolAdminUser.id,
      roleId: adminRole!.id,
      schoolId: demoSchool.id,
    },
  });

  // 6. Academic Data
  console.log('Seeding Academic Data...');
  const academicYear = await prisma.academicYear.create({
    data: {
      schoolId: demoSchool.id,
      name: '2026/2027',
      code: 'AY2627',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-06-30'),
      isCurrent: true,
      status: AcademicYearStatus.ACTIVE,
    },
  });

  const term1 = await prisma.term.create({
    data: {
      academicYearId: academicYear.id,
      name: 'Term 1',
      code: 'T1',
      sequence: 1,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-20'),
      status: TermStatus.ACTIVE,
    },
  });

  const class7 = await prisma.class.create({
    data: {
      schoolId: demoSchool.id,
      name: 'Basic 7',
      code: 'B7',
      level: 7,
    },
  });

  const sectionA = await prisma.section.create({
    data: {
      classId: class7.id,
      name: 'Section A',
      code: 'A',
      capacity: 40,
    },
  });

  const math = await prisma.subject.create({
    data: {
      schoolId: demoSchool.id,
      name: 'Mathematics',
      code: 'MATH101',
      subjectType: SubjectType.CORE,
    },
  });

  // 7. People (Teacher & Student)
  console.log('Seeding People...');
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@greenwood.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Smith',
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      schoolId: demoSchool.id,
      userId: teacherUser.id,
      employeeId: 'TCH001',
      firstName: 'John',
      lastName: 'Smith',
      status: StaffStatus.ACTIVE,
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@example.com',
      passwordHash,
      firstName: 'Bobby',
      lastName: 'Doe',
    },
  });

  const student = await prisma.student.create({
    data: {
      schoolId: demoSchool.id,
      userId: studentUser.id,
      firstName: 'Bobby',
      lastName: 'Doe',
      studentNumber: 'STU001',
      admissionNumber: 'ADM26001',
      admissionDate: new Date(),
      dateOfBirth: new Date('2015-05-15'),
      status: StudentStatus.ACTIVE,
    },
  });

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: student.id,
      academicYearId: academicYear.id,
      termId: term1.id,
      classId: class7.id,
      sectionId: sectionA.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  // 8. Transport
  console.log('Seeding Transport...');
  const bus = await prisma.vehicle.create({
    data: {
      schoolId: demoSchool.id,
      plateNumber: 'BUS-01-GH',
      model: 'Toyota Coaster',
      capacity: 30,
      status: VehicleStatus.ACTIVE
    }
  });

  const route = await prisma.route.create({
    data: {
      schoolId: demoSchool.id,
      name: 'North Ridge Route',
      description: 'Main residential area route'
    }
  });

  await prisma.transportAssignment.create({
    data: {
      studentId: student.id,
      vehicleId: bus.id,
      routeId: route.id,
      pickupPoint: 'North Ridge Mall'
    }
  });

  // 9. Library Data
  console.log('Seeding Library Data...');
  const sciCategory = await prisma.bookCategory.create({
    data: {
      schoolId: demoSchool.id,
      name: 'Science',
      code: 'SCI',
    }
  });

  const author = await prisma.author.create({
    data: {
      schoolId: demoSchool.id,
      name: 'Dr. Stephen Hawking',
    }
  });

  const book = await prisma.book.create({
    data: {
      schoolId: demoSchool.id,
      title: 'A Brief History of Time',
      isbn: '978-0553380163',
      publicationYear: 1988,
      categoryId: sciCategory.id,
      authors: {
        create: { authorId: author.id }
      }
    }
  });

  const location = await prisma.libraryLocation.create({
    data: {
      schoolId: demoSchool.id,
      name: 'Main Hall',
    }
  });

  await prisma.bookCopy.create({
    data: {
      schoolId: demoSchool.id,
      bookId: book.id,
      accessionNumber: 'ACC-BRI-001',
      locationId: location.id,
      status: 'AVAILABLE',
      condition: 'NEW'
    }
  });

  const studentMembership = await prisma.libraryMembership.create({
    data: {
      schoolId: demoSchool.id,
      userId: studentUser.id,
      membershipNumber: 'LIB-STU-001',
    }
  });

  // 10. Communication Templates
  console.log('Seeding Communication Templates...');
  const templates = [
    {
      notificationType: 'STUDENT_ABSENT',
      channel: CommunicationChannel.EMAIL,
      subject: 'Attendance Alert: {{student_name}} is Absent',
      body: 'Dear {{guardian_name}}, this is to inform you that {{student_name}} was marked absent today.',
    },
    {
      notificationType: 'INVOICE_ISSUED',
      channel: CommunicationChannel.EMAIL,
      subject: 'Invoice Issued: {{invoiceNumber}}',
      body: 'Dear {{studentName}}, a new invoice {{invoiceNumber}} for {{totalAmount}} has been issued.',
    },
    {
      notificationType: 'PAYMENT_RECEIVED',
      channel: CommunicationChannel.EMAIL,
      subject: 'Payment Received: {{paymentReference}}',
      body: 'Thank you for your payment of {{amount}} {{currency}}.',
    },
    {
      notificationType: 'BOOK_ISSUED',
      channel: CommunicationChannel.IN_APP,
      subject: 'Book Issued',
      body: 'You have checked out "{{bookTitle}}". Due date: {{dueDate}}.',
    }
  ];

  for (const t of templates) {
    const template = await prisma.notificationTemplate.upsert({
      where: {
        schoolId_notificationType_channel: {
          schoolId: null as any,
          notificationType: t.notificationType,
          channel: t.channel
        }
      },
      update: {},
      create: {
        schoolId: null as any,
        notificationType: t.notificationType,
        channel: t.channel,
      }
    });

    await prisma.notificationTemplateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        subject: t.subject || null,
        body: t.body,
        variables: {},
        createdBy: 'SYSTEM'
      }
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
