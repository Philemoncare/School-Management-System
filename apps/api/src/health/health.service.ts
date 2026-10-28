import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommunicationService } from '../communication/communication.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  HealthSeverity,
  StudentHealthProfile,
  ClinicVisit,
  HealthIncident,
  StockMovementType,
  ClinicAppointmentStatus,
  NotificationPriority,
} from '@prisma/client';
import {
  UpdateHealthProfileDto,
  CreateClinicVisitDto,
  CreateHealthIncidentDto,
  AdministerMedicationDto,
  CreateFirstAidRecordDto,
  CreateClinicAppointmentDto,
  CreateHealthFollowUpDto,
  CreateHealthConsentDto,
  CreateHealthReferralDto,
  CreateCarePlanDto,
  UpdateCarePlanDto,
  CreateVitalSignDto,
  CreateHealthDocumentDto
} from './dto/health.dto';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private communication: CommunicationService,
    private inventory: InventoryService,
  ) {}

  // --- DASHBOARD ---
  async getDashboard(schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [visitsToday, waitingInQueue, recentIncidents, lowMedicalSupplies, upcomingAppointments] = await Promise.all([
      this.prisma.clinicVisit.count({
        where: { schoolId, checkInAt: { gte: today } }
      }),
      this.prisma.clinicVisit.count({
        where: { schoolId, status: 'CHECKED_IN' }
      }),
      this.prisma.healthIncident.findMany({
        where: { schoolId, status: 'OPEN' },
        include: { profile: { include: { student: true } } },
        orderBy: { incidentDate: 'desc' },
        take: 5
      }),
      this.prisma.inventoryBalance.findMany({
        where: {
          schoolId,
          item: { category: { name: { in: ['Medical', 'Health', 'First Aid'] } } },
          onHand: { lte: 10 }
        },
        include: { item: true, location: true },
        take: 5
      }),
      this.prisma.clinicAppointment.findMany({
        where: { schoolId, startTime: { gte: new Date() }, status: ClinicAppointmentStatus.SCHEDULED },
        include: { profile: { include: { student: true } } },
        orderBy: { startTime: 'asc' },
        take: 5
      })
    ]);

    return {
      visitsToday,
      waitingInQueue,
      recentIncidents,
      lowMedicalSupplies,
      upcomingAppointments
    };
  }

  // --- STUDENT HEALTH PROFILE ---
  private async getOrCreateProfile(schoolId: string, studentId: string): Promise<StudentHealthProfile> {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    });
    if (!student) {
      throw new NotFoundException('Student not found in this school.');
    }

    let profile = await this.prisma.studentHealthProfile.findUnique({
      where: { studentId }
    });

    if (!profile) {
      profile = await this.prisma.studentHealthProfile.create({
        data: { studentId, schoolId }
      });
    } else if (!profile.schoolId) {
      profile = await this.prisma.studentHealthProfile.update({
        where: { id: profile.id },
        data: { schoolId },
      });
    }
    return profile;
  }

  async findIncidents(schoolId: string, filters: any = {}) {
    const { status, severity, search } = filters;
    return this.prisma.healthIncident.findMany({
      where: {
        schoolId,
        status: status || undefined,
        severity: severity || undefined,
        profile: search
          ? {
              student: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { studentNumber: { contains: search, mode: 'insensitive' } },
                ],
              },
            }
          : undefined,
      },
      include: {
        profile: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
          },
        },
        reportedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { incidentDate: 'desc' },
      take: 200,
    });
  }

  async getStudentProfile(schoolId: string, studentId: string, requesterId: string) {
    const profile = await this.prisma.studentHealthProfile.findUnique({
      where: { studentId },
      include: {
        student: true,
        allergies: true,
        conditions: true,
        medications: {
          include: { administrations: { take: 10, orderBy: { administeredAt: 'desc' } } }
        },
        carePlans: { where: { status: 'ACTIVE' }, include: { versions: { take: 1, orderBy: { version: 'desc' } } } },
        immunizations: true,
        consents: true,
        firstAidRecords: { take: 5, orderBy: { incidentDate: 'desc' } },
        appointments: { where: { startTime: { gte: new Date() } }, orderBy: { startTime: 'asc' } },
        followUps: { where: { status: 'PENDING' }, orderBy: { dueDate: 'asc' } }
      }
    });

    if (!profile || profile.student.schoolId !== schoolId) {
      throw new NotFoundException('Health profile not found');
    }

    await this.audit.log({
      userId: requesterId,
      schoolId,
      action: 'HEALTH_RECORD_VIEWED',
      module: 'HEALTH',
      resourceId: profile.id,
      metadata: { studentId }
    });

    return profile;
  }

  async updateStudentProfile(schoolId: string, studentId: string, dto: UpdateHealthProfileDto, requesterId: string) {
    const profile = await this.prisma.studentHealthProfile.upsert({
      where: { studentId },
      update: dto,
      create: { ...dto, studentId }
    });

    await this.audit.log({
      userId: requesterId,
      schoolId,
      action: 'HEALTH_RECORD_UPDATED',
      module: 'HEALTH',
      resourceId: profile.id
    });

    return profile;
  }

  // --- CLINIC VISITS ---
  async createVisit(schoolId: string, nurseId: string, dto: CreateClinicVisitDto) {
    const { studentId, suppliesUsed, ...visitData } = dto;
    const profile = await this.getOrCreateProfile(schoolId, studentId);

    return this.prisma.$transaction(async (tx) => {
      const visit = await tx.clinicVisit.create({
        data: {
          ...visitData,
          schoolId,
          nurseId,
          profileId: profile.id,
        },
        include: { profile: { include: { student: true } } }
      });

      // Handle inventory integration
      if (suppliesUsed && suppliesUsed.length > 0) {
        for (const supply of suppliesUsed) {
          await this.inventory.adjustStock(schoolId, nurseId, {
            itemId: supply.itemId,
            locationId: supply.locationId,
            quantity: supply.quantity,
            type: StockMovementType.ISSUE,
            reason: `Clinic visit: ${visit.id}`
          });
        }
      }

      await this.audit.log({
        userId: nurseId,
        schoolId,
        action: 'CLINIC_VISIT_CREATED',
        module: 'HEALTH',
        resourceId: visit.id
      });

      return visit;
    });
  }

  async updateVisit(schoolId: string, visitId: string, dto: any, nurseId: string) {
    const visit = await this.prisma.clinicVisit.findUnique({ where: { id: visitId }, include: { profile: { include: { student: true } } } });
    if (!visit || visit.schoolId !== schoolId) throw new NotFoundException();

    const updatedVisit = await this.prisma.clinicVisit.update({
      where: { id: visitId },
      data: dto,
      include: { profile: { include: { student: true } } }
    });

    // Notify guardian if treated or referred
    if ((updatedVisit.status === 'TREATED' || updatedVisit.status === 'REFERRED') && visit.status !== updatedVisit.status) {
        const student = updatedVisit.profile.student;
        const primaryGuardian = await this.prisma.studentGuardian.findFirst({
            where: { studentId: student.id, isPrimary: true },
            include: { guardian: { include: { user: true } } }
        });

        if (primaryGuardian?.guardian.user) {
            await this.communication.sendNotification({
                schoolId,
                userId: primaryGuardian.guardian.user.id,
                type: 'HEALTH_VISIT_NOTIFICATION',
                data: {
                    studentName: `${student.firstName} ${student.lastName}`,
                    status: updatedVisit.status,
                    outcome: updatedVisit.outcome || 'Treated'
                },
                priority: NotificationPriority.NORMAL
            });
        }
    }

    return updatedVisit;
  }

  async getQueue(schoolId: string) {
    return this.prisma.clinicVisit.findMany({
      where: {
        schoolId,
        status: { in: ['CHECKED_IN', 'ASSESSMENT', 'OBSERVATION'] }
      },
      include: { profile: { include: { student: true } } },
      orderBy: { checkInAt: 'asc' }
    });
  }

  // --- FIRST AID ---
  async createFirstAidRecord(schoolId: string, actorId: string, dto: CreateFirstAidRecordDto) {
    const { studentId, ...data } = dto;
    const profile = await this.getOrCreateProfile(schoolId, studentId);

    const record = await this.prisma.firstAidRecord.create({
        data: {
            ...data,
            schoolId,
            profileId: profile.id
        }
    });

    await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'FIRST_AID_RECORD_CREATED',
        module: 'HEALTH',
        resourceId: record.id
    });

    return record;
  }

  // --- INCIDENTS ---
  async createIncident(schoolId: string, userId: string, dto: CreateHealthIncidentDto) {
    const { studentId, ...incidentData } = dto;
    const profile = await this.getOrCreateProfile(schoolId, studentId);

    const incident = await this.prisma.healthIncident.create({
      data: {
        ...incidentData,
        schoolId,
        reportedById: userId,
        profileId: profile.id,
      },
      include: { profile: { include: { student: true } } }
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'HEALTH_INCIDENT_CREATED',
      module: 'HEALTH',
      resourceId: incident.id
    });

    // Notify administrators if severity is HIGH or CRITICAL
    if (incident.severity === HealthSeverity.SEVERE || incident.severity === HealthSeverity.LIFE_THREATENING) {
        // Trigger emergency notification to health staff and admins
        const admins = await this.prisma.userRole.findMany({
            where: { schoolId, role: { name: { in: ['SCHOOL_ADMIN', 'NURSE', 'MEDICAL_OFFICER'] } } },
            include: { user: true }
        });

        for (const admin of admins) {
            await this.communication.sendNotification({
                schoolId,
                userId: admin.user.id,
                type: 'EMERGENCY_HEALTH_INCIDENT',
                data: {
                    incidentId: incident.id,
                    severity: incident.severity,
                    studentName: `${incident.profile.student.firstName} ${incident.profile.student.lastName}`
                },
                priority: NotificationPriority.CRITICAL
            });
        }
    }

    return incident;
  }

  // --- MEDICATIONS ---
  async administerMedication(schoolId: string, nurseId: string, medicationId: string, dto: AdministerMedicationDto) {
    const medication = await this.prisma.medication.findUnique({
      where: { id: medicationId },
      include: { profile: true }
    });

    if (!medication) throw new NotFoundException('Medication not found');

    const administration = await this.prisma.medicationAdministration.create({
      data: {
        medicationId,
        administeredById: nurseId,
        status: dto.status || 'GIVEN',
        notes: dto.notes
      }
    });

    await this.audit.log({
      userId: nurseId,
      schoolId,
      action: 'MEDICATION_ADMINISTERED',
      module: 'HEALTH',
      resourceId: administration.id
    });

    return administration;
  }

  // --- APPOINTMENTS ---
  async createAppointment(schoolId: string, actorId: string, dto: CreateClinicAppointmentDto) {
    const profile = await this.getOrCreateProfile(schoolId, dto.studentId);

    const appointment = await this.prisma.clinicAppointment.create({
        data: {
            schoolId,
            profileId: profile.id,
            title: dto.title,
            description: dto.description,
            startTime: dto.startTime,
            endTime: dto.endTime,
            appointmentType: dto.appointmentType,
            bookedById: actorId
        }
    });

    await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'CLINIC_APPOINTMENT_CREATED',
        module: 'HEALTH',
        resourceId: appointment.id
    });

    return appointment;
  }

  // --- CARE PLANS ---
  async createCarePlan(schoolId: string, actorId: string, dto: CreateCarePlanDto) {
    const profile = await this.getOrCreateProfile(schoolId, dto.studentId);

    return this.prisma.$transaction(async (tx) => {
        const carePlan = await tx.healthCarePlan.create({
            data: {
                profileId: profile.id,
                title: dto.title,
                instructions: dto.instructions,
                emergencyActions: dto.emergencyActions,
                effectiveDate: dto.effectiveDate,
                reviewDate: dto.reviewDate,
                status: 'ACTIVE'
            }
        });

        await tx.healthCarePlanVersion.create({
            data: {
                carePlanId: carePlan.id,
                version: 1,
                title: dto.title,
                instructions: dto.instructions,
                emergencyActions: dto.emergencyActions,
                changeReason: 'Initial creation',
                createdById: actorId
            }
        });

        return carePlan;
    });
  }

  async updateCarePlan(schoolId: string, carePlanId: string, actorId: string, dto: UpdateCarePlanDto) {
    const current = await this.prisma.healthCarePlan.findUnique({
        where: { id: carePlanId },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
    });

    if (!current) throw new NotFoundException('Care plan not found');

    const nextVersion = current.versions[0] ? current.versions[0].version + 1 : 1;

    return this.prisma.$transaction(async (tx) => {
        const updated = await tx.healthCarePlan.update({
            where: { id: carePlanId },
            data: {
                title: dto.title ?? current.title,
                instructions: dto.instructions ?? current.instructions,
                emergencyActions: dto.emergencyActions ?? current.emergencyActions,
                status: dto.status ?? current.status,
                reviewDate: dto.reviewDate ?? current.reviewDate
            }
        });

        await tx.healthCarePlanVersion.create({
            data: {
                carePlanId,
                version: nextVersion,
                title: updated.title,
                instructions: updated.instructions,
                emergencyActions: updated.emergencyActions,
                changeReason: dto.changeReason,
                createdById: actorId
            }
        });

        return updated;
    });
  }

  // --- VITAL SIGNS ---
  async recordVitalSign(schoolId: string, actorId: string, dto: CreateVitalSignDto) {
    let profileId = dto.profileId;
    if (!profileId && dto.studentId) {
        const profile = await this.getOrCreateProfile(schoolId, dto.studentId);
        profileId = profile.id;
    }

    const vital = await this.prisma.vitalSign.create({
        data: {
            visitId: dto.visitId,
            profileId,
            type: dto.type,
            value: dto.value,
            unit: dto.unit,
            recordedById: actorId
        }
    });

    return vital;
  }

  // --- DOCUMENTS ---
  async uploadDocument(schoolId: string, actorId: string, dto: CreateHealthDocumentDto) {
    const profile = await this.getOrCreateProfile(schoolId, dto.studentId);

    const doc = await this.prisma.healthDocument.create({
        data: {
            schoolId,
            profileId: profile.id,
            documentType: dto.documentType,
            title: dto.title,
            fileUrl: dto.fileUrl,
            storageKey: dto.storageKey,
            issueDate: dto.issueDate,
            expiryDate: dto.expiryDate,
            uploadedById: actorId
        }
    });

    await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'HEALTH_DOCUMENT_UPLOADED',
        module: 'HEALTH',
        resourceId: doc.id
    });

    return doc;
  }

  // --- SCREENINGS ---
  async createScreening(schoolId: string, actorId: string, dto: any) {
    const screening = await this.prisma.healthScreening.create({
        data: {
            ...dto,
            schoolId,
            status: 'PLANNED'
        }
    });

    await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'HEALTH_SCREENING_CREATED',
        module: 'HEALTH',
        resourceId: screening.id
    });

    return screening;
  }

  async recordScreeningResult(schoolId: string, actorId: string, dto: any) {
    const profile = await this.getOrCreateProfile(schoolId, dto.studentId);

    const result = await this.prisma.healthScreeningResult.create({
        data: {
            screeningId: dto.screeningId,
            profileId: profile.id,
            result: dto.result,
            recommendation: dto.recommendation,
            status: 'COMPLETED'
        }
    });

    return result;
  }

  // --- IMMUNIZATIONS ---
  async updateImmunizationRecord(schoolId: string, actorId: string, dto: any) {
    const profile = await this.getOrCreateProfile(schoolId, dto.studentId);

    const record = await this.prisma.immunizationRecord.upsert({
        where: { id: dto.id || 'new-id' },
        update: { ...dto, studentId: undefined },
        create: { ...dto, profileId: profile.id, studentId: undefined }
    });

    await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'IMMUNIZATION_RECORD_UPDATED',
        module: 'HEALTH',
        resourceId: record.id
    });

    return record;
  }

  // --- CONSENT ---
  async recordConsent(schoolId: string, actorId: string, dto: CreateHealthConsentDto) {
    const profile = await this.getOrCreateProfile(schoolId, dto.studentId);

    const consent = await this.prisma.healthConsent.create({
        data: {
            profileId: profile.id,
            type: dto.type,
            status: dto.status,
            guardianId: dto.guardianId,
            validUntil: dto.validUntil
        }
    });

    await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'HEALTH_CONSENT_RECORDED',
        module: 'HEALTH',
        resourceId: consent.id
    });

    return consent;
  }

  // --- REFERRALS ---
  async createReferral(schoolId: string, actorId: string, dto: CreateHealthReferralDto) {
    const referral = await this.prisma.healthReferral.create({
        data: dto
    });

    await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'HEALTH_REFERRAL_CREATED',
        module: 'HEALTH',
        resourceId: referral.id
    });

    return referral;
  }

  // --- BREAK GLASS ---
  async logBreakGlass(schoolId: string, userId: string, studentId: string, reason: string) {
    const log = await this.prisma.emergencyBreakGlass.create({
      data: {
        schoolId,
        userId,
        studentId,
        reason
      }
    });

    await this.audit.log({
      userId,
      schoolId,
      action: 'BREAK_GLASS_ACCESS',
      module: 'SECURITY',
      resourceId: log.id,
      metadata: { studentId, reason }
    });

    // Notify security admins
    const securityAdmins = await this.prisma.userRole.findMany({
        where: { schoolId, role: { name: 'SCHOOL_ADMIN' } },
        include: { user: true }
    });

    for (const admin of securityAdmins) {
        await this.communication.sendNotification({
            schoolId,
            userId: admin.user.id,
            type: 'SECURITY_BREAK_GLASS_ALERT',
            data: {
                actorId: userId,
                studentId,
                reason
            },
            priority: NotificationPriority.HIGH
        });
    }

    return log;
  }
}

