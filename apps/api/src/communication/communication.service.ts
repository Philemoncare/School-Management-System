import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateService } from './template.service';
import { CommunicationGateway } from './gateways/communication.gateway';
import { AudienceResolverService, AudienceConfig } from './audience-resolver.service';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  CommunicationChannel,
  NotificationPriority,
  NotificationStatus,
  CommunicationStatus,
  AudienceType,
  AnnouncementStatus
} from '@prisma/client';

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private prisma: PrismaService,
    private templateService: TemplateService,
    private audienceResolver: AudienceResolverService,
    private gateway: CommunicationGateway,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async getDashboardStats(schoolId: string) {
    const [sentToday, failedToday, scheduledCount, activeAnnouncements] = await Promise.all([
      this.prisma.notification.count({
        where: { schoolId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: 'SENT' }
      }),
      this.prisma.notificationDelivery.count({
        where: { notification: { schoolId }, failedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: 'FAILED' }
      }),
      this.prisma.scheduledCommunication.count({
        where: { communication: { schoolId }, status: 'PENDING' }
      }),
      this.prisma.announcement.count({
        where: { schoolId, status: 'PUBLISHED' }
      })
    ]);

    const usage = await this.prisma.communicationUsage.findMany({
      where: { schoolId }
    });

    return {
      sentToday,
      failedToday,
      scheduledCount,
      activeAnnouncements,
      usage
    };
  }

  async createCommunication(schoolId: string, authorId: string, dto: any) {
    return this.prisma.communication.create({
      data: {
        schoolId,
        authorId,
        title: dto.title,
        subject: dto.subject,
        content: dto.content,
        priority: dto.priority || NotificationPriority.NORMAL,
        channels: dto.channels,
        audienceConfig: dto.audienceConfig,
        templateId: dto.templateId,
        templateVersionId: dto.templateVersionId,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        status: dto.scheduledFor ? CommunicationStatus.SCHEDULED : CommunicationStatus.DRAFT,
      }
    });
  }

  async triggerSend(schoolId: string, communicationId: string) {
    const comm = await this.prisma.communication.findUnique({
      where: { id: communicationId },
    });

    if (!comm || comm.schoolId !== schoolId) {
      throw new NotFoundException('Communication not found');
    }

    if (comm.status === CommunicationStatus.SENDING || comm.status === CommunicationStatus.SENT) {
      throw new BadRequestException('Communication already processed or in progress');
    }

    // Update status to sending
    await this.prisma.communication.update({
      where: { id: communicationId },
      data: { status: CommunicationStatus.SENDING }
    });

    // 1. Resolve audience
    const userIds = await this.audienceResolver.resolve(schoolId, comm.audienceConfig as any);

    // 2. Create recipient records
    await this.prisma.communicationRecipient.createMany({
      data: userIds.map(userId => ({
        communicationId,
        userId,
        status: 'PENDING'
      })),
      skipDuplicates: true,
    });

    // 3. Queue jobs for each recipient and channel
    // In a production app, we would use a bulk job processor
    for (const userId of userIds) {
      for (const channel of comm.channels) {
        await this.notificationQueue.add('process-communication', {
          communicationId,
          userId,
          channel,
          data: {
            title: comm.title,
            subject: comm.subject,
            content: comm.content
          }
        });
      }
    }

    await this.prisma.communication.update({
      where: { id: communicationId },
      data: { status: CommunicationStatus.SENT, sentAt: new Date() }
    });

    return { recipientCount: userIds.length };
  }

  async getCommunications(schoolId: string, options: any) {
    const { status, page, limit } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.communication.findMany({
        where: { schoolId, status },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { author: { select: { firstName: true, lastName: true } } }
      }),
      this.prisma.communication.count({ where: { schoolId, status } })
    ]);

    return { items, total, page, limit };
  }

  async getCommunication(schoolId: string, id: string) {
    const item = await this.prisma.communication.findUnique({
      where: { id },
      include: {
        author: { select: { firstName: true, lastName: true } },
        recipients: { take: 10, include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        _count: { select: { recipients: true, notifications: true } }
      }
    });

    if (!item || item.schoolId !== schoolId) throw new NotFoundException();
    return item;
  }

  async createAnnouncement(schoolId: string, authorId: string, dto: any) {
    const announcement = await this.prisma.announcement.create({
      data: {
        schoolId,
        authorId,
        title: dto.title,
        content: dto.content,
        priority: dto.priority || NotificationPriority.NORMAL,
        status: dto.publishImmediately ? AnnouncementStatus.PUBLISHED : AnnouncementStatus.DRAFT,
        publishAt: dto.publishAt ? new Date(dto.publishAt) : (dto.publishImmediately ? new Date() : null),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        audiences: {
          create: dto.audiences.map((aud: any) => ({
            audienceType: aud.type,
            classId: aud.classId,
            sectionId: aud.sectionId,
            roleId: aud.roleId
          }))
        }
      }
    });

    if (dto.publishImmediately) {
      this.gateway.broadcastToSchool(schoolId, 'announcement', {
        id: announcement.id,
        title: announcement.title,
        priority: announcement.priority,
        createdAt: announcement.createdAt
      });
    }

    return announcement;
  }

  async getAnnouncements(schoolId: string, user: any, category?: string) {
    const isAdmin = user.roles?.some((r: string) => ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL'].includes(r));

    const where: any = {
      schoolId,
      status: AnnouncementStatus.PUBLISHED,
      publishAt: { lte: new Date() },
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    };

    if (!isAdmin) {
      // Filter by audience
      where.audiences = {
        some: {
          OR: [
            { audienceType: 'ALL' },
            { userId: user.id },
            { role: { name: { in: user.roles } } },
            // Add class/section logic here if user is a student
          ]
        }
      };
    }

    return this.prisma.announcement.findMany({
      where,
      orderBy: { publishAt: 'desc' },
      include: {
        author: { select: { firstName: true, lastName: true } },
        audiences: true
      }
    });
  }

  async getDeliveryLogs(schoolId: string, options: any) {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    return this.prisma.notificationDelivery.findMany({
      where: {
        notification: { schoolId },
        status: status as any
      },
      include: { notification: { select: { title: true, userId: true } } },
      orderBy: { lastAttemptAt: 'desc' },
      skip,
      take: limit
    });
  }

  async retryDelivery(schoolId: string, deliveryId: string) {
    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
      include: { notification: true }
    });

    if (!delivery || delivery.notification.schoolId !== schoolId) {
      throw new NotFoundException();
    }

    // Reset status to PENDING and re-add to queue
    await this.prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: { status: 'PENDING', errorMessage: null }
    });

    await this.notificationQueue.add('send-delivery', {
      deliveryId: delivery.id,
      channel: delivery.channel,
      recipientId: delivery.notification.userId,
      templateVersionId: delivery.notification.templateVersionId,
      data: {} // In a real app we'd need to re-fetch the original data payload
    });

    return { status: 'retry_queued' };
  }

  /**
   * Reuses the single notification logic for general system triggers.
   */
  async sendNotification(params: {
    schoolId: string;
    userId: string;
    type: string;
    data: Record<string, any>;
    priority?: NotificationPriority;
  }) {
    const { schoolId, userId, type, data, priority = NotificationPriority.NORMAL } = params;

    const preferences = await this.prisma.notificationPreference.findMany({
      where: { userId, notificationType: type, isEnabled: true },
    });

    const channels = preferences.length > 0
      ? preferences.map(p => p.channel)
      : [CommunicationChannel.IN_APP, CommunicationChannel.WEBSOCKET];

    const templates = await this.prisma.notificationTemplate.findMany({
      where: {
        schoolId: { in: [schoolId, null] },
        notificationType: type,
        channel: { in: channels },
        isActive: true,
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
      orderBy: { schoolId: 'desc' },
    });

    const uniqueTemplates = new Map<CommunicationChannel, any>();
    for (const t of templates) {
      if (!uniqueTemplates.has(t.channel) && t.versions.length > 0) {
        uniqueTemplates.set(t.channel, t);
      }
    }

    if (uniqueTemplates.size === 0) {
      this.logger.warn(`No active templates found for: ${type}`);
      return;
    }

    const baseTemplate = uniqueTemplates.get(CommunicationChannel.IN_APP) || Array.from(uniqueTemplates.values())[0];
    const latestVersion = baseTemplate.versions[0];

    const title = this.templateService.render(latestVersion.subject || 'Notification', data);
    const content = this.templateService.render(latestVersion.body, data);

    const notification = await this.prisma.notification.create({
      data: {
        schoolId,
        userId,
        notificationType: type,
        templateId: baseTemplate.id,
        templateVersionId: latestVersion.id,
        title,
        content,
        priority,
        status: NotificationStatus.PENDING,
      },
    });

    if (channels.includes(CommunicationChannel.WEBSOCKET)) {
      this.gateway.sendToUser(userId, 'notification', {
        id: notification.id,
        title,
        content,
        type,
        createdAt: notification.createdAt,
      });
    }

    for (const [channel, template] of uniqueTemplates.entries()) {
      const version = template.versions[0];
      const delivery = await this.prisma.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          channel,
          status: 'PENDING',
        },
      });

      await this.notificationQueue.add('send-delivery', {
        deliveryId: delivery.id,
        channel,
        recipientId: userId,
        templateVersionId: version.id,
        data,
      }, {
        priority: this.getQueuePriority(priority),
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }

    return { notification };
  }

  private getQueuePriority(priority: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.CRITICAL: return 1;
      case NotificationPriority.HIGH: return 2;
      case NotificationPriority.NORMAL: return 3;
      case NotificationPriority.LOW: return 4;
      default: return 3;
    }
  }
}
