import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrivacyRequestType, PrivacyRequestStatus } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class PrivacyService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createRequest(params: {
    userId: string;
    schoolId: string;
    type: PrivacyRequestType;
    reason?: string;
  }) {
    const request = await this.prisma.privacyRequest.create({
      data: {
        userId: params.userId,
        schoolId: params.schoolId,
        type: params.type,
        reason: params.reason,
        status: PrivacyRequestStatus.REQUESTED,
      },
    });

    await this.audit.log({
      userId: params.userId,
      schoolId: params.schoolId,
      action: 'PRIVACY_REQUEST_CREATED',
      module: 'SECURITY',
      resourceId: request.id,
      metadata: { type: params.type },
    });

    return request;
  }

  async updateRequestStatus(id: string, status: PrivacyRequestStatus, adminNotes?: string, adminId?: string) {
    const request = await this.prisma.privacyRequest.update({
      where: { id },
      data: {
        status,
        adminNotes,
      },
    });

    await this.audit.log({
      userId: adminId,
      schoolId: request.schoolId,
      action: 'PRIVACY_REQUEST_STATUS_UPDATED',
      module: 'SECURITY',
      resourceId: request.id,
      metadata: { status, adminNotes },
    });

    return request;
  }

  async getUserRequests(userId: string) {
    return this.prisma.privacyRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSchoolRequests(schoolId: string) {
    return this.prisma.privacyRequest.findMany({
      where: { schoolId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRetentionPolicies(schoolId?: string) {
    return this.prisma.retentionPolicy.findMany({
      where: {
        OR: [{ schoolId }, { schoolId: null }],
      },
    });
  }

  async updateRetentionPolicy(params: {
    schoolId?: string;
    entityType: string;
    retentionDays: number;
  }) {
    return this.prisma.retentionPolicy.upsert({
      where: {
        schoolId_entityType: {
          schoolId: params.schoolId || null as any, // Prisma quirk with null in unique
          entityType: params.entityType,
        },
      },
      update: { retentionDays: params.retentionDays },
      create: {
        schoolId: params.schoolId,
        entityType: params.entityType,
        retentionDays: params.retentionDays,
      },
    });
  }
}
