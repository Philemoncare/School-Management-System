import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateCampaignDto,
  SubmitApplicationDto,
  UpdateApplicationStatusDto,
  CreateDecisionDto,
  CreateOfferDto,
  ScheduleInterviewDto
} from './dto/admissions.dto';
import { ApplicationStatus, DecisionType, OfferStatus, CampaignStatus } from '@prisma/client';
import { OutboxService } from '../workflow/events/outbox.service';
import { DomainEvent } from '../workflow/events/domain-event';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AdmissionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private outbox: OutboxService,
    private settings: SettingsService,
  ) {}

  async getDashboardMetrics(schoolId: string) {
    const [
      totalApplications,
      newApplications,
      underReview,
      offersIssued,
      offersAccepted,
      admitted,
      enrolled,
      campaigns
    ] = await Promise.all([
      this.prisma.admissionApplication.count({ where: { schoolId } }),
      this.prisma.admissionApplication.count({ where: { schoolId, status: ApplicationStatus.SUBMITTED } }),
      this.prisma.admissionApplication.count({ where: { schoolId, status: ApplicationStatus.UNDER_REVIEW } }),
      this.prisma.admissionOffer.count({ where: { schoolId, status: OfferStatus.ISSUED } }),
      this.prisma.admissionOffer.count({ where: { schoolId, status: OfferStatus.ACCEPTED } }),
      this.prisma.admissionApplication.count({ where: { schoolId, status: ApplicationStatus.ADMITTED } }),
      this.prisma.admissionApplication.count({ where: { schoolId, status: ApplicationStatus.ENROLLED } }),
      this.prisma.admissionCampaign.findMany({
        where: { schoolId, status: CampaignStatus.OPEN },
        include: { _count: { select: { applications: true } } }
      })
    ]);

    return {
      metrics: {
        totalApplications,
        newApplications,
        underReview,
        offersIssued,
        offersAccepted,
        admitted,
        enrolled
      },
      activeCampaigns: campaigns
    };
  }

  // Campaigns
  async createCampaign(schoolId: string, dto: CreateCampaignDto) {
    return this.prisma.admissionCampaign.create({
      data: { ...dto, schoolId }
    });
  }

  async findAllCampaigns(schoolId: string) {
    return this.prisma.admissionCampaign.findMany({
      where: { schoolId },
      include: { academicYear: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Applications
  async submitApplication(schoolId: string, dto: SubmitApplicationDto) {
    const { guardians, ...appData } = dto;

    const reference = await this.settings.generateNextNumber(schoolId, 'ADMISSION_APPLICATION');

    return this.prisma.$transaction(async (tx) => {
      const application = await tx.admissionApplication.create({
        data: {
          ...appData,
          schoolId,
          reference,
          status: ApplicationStatus.SUBMITTED,
          guardians: {
            create: guardians
          }
        }
      });

      await this.audit.log({
        schoolId,
        action: 'APPLICATION_SUBMITTED',
        module: 'ADMISSIONS',
        resourceId: application.id,
        metadata: { reference }
      });

      return application;
    });
  }

  async findAllApplications(schoolId: string, filters: any = {}) {
    return this.prisma.admissionApplication.findMany({
      where: { ...filters, schoolId },
      include: {
        campaign: true,
        academicYear: true,
        class: true,
        guardians: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOneApplication(schoolId: string, id: string) {
    const application = await this.prisma.admissionApplication.findFirst({
      where: { id, schoolId },
      include: {
        campaign: true,
        academicYear: true,
        class: true,
        guardians: true,
        documents: true,
        interviews: { include: { interviewer: true } },
        assessments: true,
        decisions: { include: { decisionMaker: true } },
        offers: true
      }
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async updateApplicationStatus(schoolId: string, id: string, dto: UpdateApplicationStatusDto, actorId: string) {
    const application = await this.prisma.admissionApplication.findFirst({ where: { id, schoolId } });
    if (!application) throw new NotFoundException('Application not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.admissionApplication.update({
        where: { id },
        data: { status: dto.status }
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'APPLICATION_STATUS_UPDATED',
        module: 'ADMISSIONS',
        resourceId: id,
        metadata: { from: application.status, to: dto.status, notes: dto.notes }
      });

      return updated;
    });
  }

  // Decisions & Offers
  async makeDecision(schoolId: string, applicationId: string, dto: CreateDecisionDto, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const decision = await tx.admissionDecision.create({
        data: {
          ...dto,
          applicationId,
          decisionMakerId: actorId
        }
      });

      let newStatus: ApplicationStatus = ApplicationStatus.DECISION_PENDING;
      if (dto.decision === DecisionType.ADMIT) newStatus = ApplicationStatus.DECISION_PENDING; // Still need to issue offer
      else if (dto.decision === DecisionType.REJECT) newStatus = ApplicationStatus.REJECTED;
      else if (dto.decision === DecisionType.WAITLIST) newStatus = ApplicationStatus.WAITLISTED;

      await tx.admissionApplication.update({
        where: { id: applicationId },
        data: { status: newStatus }
      });

      return decision;
    });
  }

  async issueOffer(schoolId: string, applicationId: string, dto: CreateOfferDto, actorId: string) {
    const application = await this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, schoolId },
      include: { class: true, academicYear: true }
    });
    if (!application) throw new NotFoundException('Application not found');

    const reference = await this.settings.generateNextNumber(schoolId, 'ADMISSION_OFFER');

    return this.prisma.$transaction(async (tx) => {
      const offer = await tx.admissionOffer.create({
        data: {
          ...dto,
          applicationId,
          schoolId,
          reference,
          classId: application.classId,
          academicYearId: application.academicYearId,
          status: OfferStatus.ISSUED
        }
      });

      await tx.admissionApplication.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.OFFERED }
      });

      return offer;
    });
  }

  private async generateOfferReference(schoolId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.admissionOffer.count({
      where: { schoolId, createdAt: { gte: new Date(year, 0, 1) } }
    });
    return `OFF-${year}-${(count + 1).toString().padStart(6, '0')}`;
  }

  async acceptOffer(offerId: string) {
    const offer = await this.prisma.admissionOffer.findUnique({
      where: { id: offerId },
      include: { application: true }
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.status !== OfferStatus.ISSUED) throw new BadRequestException('Offer is not in ISSUED status');

    return this.prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.admissionOffer.update({
        where: { id: offerId },
        data: {
          status: OfferStatus.ACCEPTED,
          acceptanceDate: new Date()
        }
      });

      await tx.admissionApplication.update({
        where: { id: offer.applicationId },
        data: { status: ApplicationStatus.ACCEPTED }
      });

      return updatedOffer;
    });
  }

  // Finalization: Create Student & Enrollment
  async confirmAdmission(schoolId: string, applicationId: string, actorId: string) {
    const application = await this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, schoolId, status: ApplicationStatus.ACCEPTED },
      include: { guardians: true, class: true }
    });
    if (!application) throw new BadRequestException('Application must be in ACCEPTED status to confirm admission');

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Student
      const studentNumber = await this.settings.generateNextNumber(schoolId, 'STUDENT');
      const admissionNumber = await this.settings.generateNextNumber(schoolId, 'ADMISSION');

      const student = await tx.student.create({
        data: {
          schoolId,
          firstName: application.firstName,
          middleName: application.middleName,
          lastName: application.lastName,
          studentNumber,
          admissionNumber,
          admissionDate: new Date(),
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          status: 'ACTIVE'
        }
      });

      // 2. Link Guardians
      for (const appGuardian of application.guardians) {
        // Find or create guardian
        let guardian = await tx.guardian.findFirst({
          where: { email: appGuardian.email }
        });

        if (!guardian) {
          guardian = await tx.guardian.create({
            data: {
              firstName: appGuardian.firstName,
              lastName: appGuardian.lastName,
              email: appGuardian.email,
              phone: appGuardian.phone,
              address: appGuardian.address
            }
          });
        }

        await tx.studentGuardian.create({
          data: {
            studentId: student.id,
            guardianId: guardian.id,
            relation: appGuardian.relationship,
            isPrimary: appGuardian.isPrimary
          }
        });
      }

      // 3. Create Enrollment
      await tx.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: application.academicYearId,
          classId: application.classId,
          status: 'ACTIVE'
        }
      });

      // 4. Update Application
      await tx.admissionApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.ENROLLED,
          studentId: student.id
        }
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'ADMISSION_CONFIRMED',
        module: 'ADMISSIONS',
        resourceId: student.id,
        metadata: { applicationId, studentNumber, admissionNumber }
      });

      // Dispatch integration event
      await this.outbox.dispatch(
        new DomainEvent(
          'ADMISSION_CONFIRMED',
          'STUDENT',
          student.id,
          {
            applicationId,
            studentId: student.id,
            academicYearId: application.academicYearId,
            classId: application.classId,
          },
          schoolId,
          actorId,
          { applicationId },
          applicationId, // Use applicationId as correlationId
        ),
        tx,
      );

      return student;
    });
  }
}
