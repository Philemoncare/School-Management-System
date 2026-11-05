import { Injectable, Logger, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateService } from './template.service';
import { CommunicationGateway } from './gateways/communication.gateway';
import { AudienceResolverService, AudienceConfig } from './audience-resolver.service';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { isRedisUnavailableError } from '../redis/redis-connection';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { SmsService } from '../sms/sms.service';
import { smsSegmentCount } from '../common/utils/sms-segments';
import {
  CommunicationChannel,
  NotificationPriority,
  NotificationStatus,
  CommunicationStatus,
  AudienceType,
  AnnouncementStatus,
  Prisma,
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
    private emailProvider: EmailProvider,
    private smsProvider: SmsProvider,
    private smsService: SmsService,
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

  async previewAudience(
    schoolId: string,
    input: { type?: string; classId?: string; sectionId?: string },
  ) {
    const allowed = ['ALL', 'STUDENTS', 'PARENTS', 'TEACHERS', 'STAFF', 'CLASS'];
    const type = String(input.type ?? '').toUpperCase();
    if (!allowed.includes(type)) {
      throw new BadRequestException('Select a supported audience type.');
    }
    if (type === 'CLASS') {
      if (!input.classId) {
        throw new BadRequestException('Select a class to preview the audience.');
      }
      const clazz = await this.prisma.class.findFirst({
        where: { id: input.classId, schoolId },
        select: { id: true },
      });
      if (!clazz) throw new BadRequestException('Select a class from this school.');
      if (input.sectionId) {
        const section = await this.prisma.section.findFirst({
          where: { id: input.sectionId, classId: input.classId },
          select: { id: true },
        });
        if (!section) throw new BadRequestException('Select a section that belongs to the class.');
      }
    }

    const config: AudienceConfig = {
      type: type as AudienceType,
      ...(input.classId ? { classId: input.classId } : {}),
      ...(input.sectionId ? { sectionId: input.sectionId } : {}),
    } as AudienceConfig;

    const userIds = await this.audienceResolver.resolve(schoolId, config);
    return { count: userIds.length };
  }

  async createCommunication(schoolId: string, authorId: string, dto: any) {
    const title = typeof dto?.title === 'string' ? dto.title.trim() : '';
    const content = typeof dto?.content === 'string' ? dto.content.trim() : '';
    if (!title) throw new BadRequestException('A communication title is required.');
    if (!content) throw new BadRequestException('Message content is required.');

    const validChannels = Object.values(CommunicationChannel) as string[];
    const channels = Array.isArray(dto?.channels)
      ? Array.from(new Set(dto.channels.filter((channel: any) => validChannels.includes(String(channel)))))
      : [];
    if (channels.length === 0) {
      throw new BadRequestException('Select at least one delivery channel.');
    }

    const audienceType = String(dto?.audienceConfig?.type ?? '').toUpperCase();
    const validAudiences = ['ALL', 'STUDENTS', 'PARENTS', 'TEACHERS', 'STAFF', 'CLASS'];
    if (!validAudiences.includes(audienceType)) {
      throw new BadRequestException('Select a valid audience.');
    }
    if (audienceType === 'CLASS') {
      if (!dto?.audienceConfig?.classId) {
        throw new BadRequestException('Select the class that should receive this message.');
      }
      const clazz = await this.prisma.class.findFirst({
        where: { id: dto.audienceConfig.classId, schoolId },
        select: { id: true },
      });
      if (!clazz) throw new BadRequestException('Select a class from this school.');
      if (dto.audienceConfig.sectionId) {
        const section = await this.prisma.section.findFirst({
          where: { id: dto.audienceConfig.sectionId, classId: dto.audienceConfig.classId },
          select: { id: true },
        });
        if (!section) throw new BadRequestException('Select a section that belongs to the class.');
      }
    }

    let scheduledFor: Date | null = null;
    if (dto?.scheduledFor) {
      const parsed = new Date(dto.scheduledFor);
      if (Number.isNaN(parsed.getTime())) {
        throw new BadRequestException('Enter a valid schedule date.');
      }
      if (parsed.getTime() <= Date.now()) {
        throw new BadRequestException('The schedule date must be in the future.');
      }
      scheduledFor = parsed;
    }

    return this.prisma.communication.create({
      data: {
        schoolId,
        authorId,
        title,
        subject: typeof dto?.subject === 'string' && dto.subject.trim() ? dto.subject.trim() : null,
        content,
        priority: dto?.priority || NotificationPriority.NORMAL,
        channels: channels as CommunicationChannel[],
        audienceConfig: {
          ...dto.audienceConfig,
          type: audienceType,
        },
        templateId: dto?.templateId,
        templateVersionId: dto?.templateVersionId,
        scheduledFor,
        status: scheduledFor ? CommunicationStatus.SCHEDULED : CommunicationStatus.DRAFT,
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

    // 3. Queue jobs for each recipient and channel.
    // The communication must NOT be reported as SENT here: at this point the
    // messages are only enqueued. We publish the total job count and move to
    // SENDING; the NotificationProcessor advances it to SENT / PARTIALLY_SENT /
    // FAILED once every job has actually settled with a provider.
    const totalJobs = userIds.length * comm.channels.length;
    try {
      await this.prisma.communication.update({
        where: { id: communicationId },
        data: { totalJobs, status: CommunicationStatus.SENDING },
      });

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
    } catch (error) {
      this.logger.warn(
        `Unable to queue communication ${communicationId}: ${(error as Error).message}`,
      );
      await this.prisma.communication.update({
        where: { id: communicationId },
        data: { status: CommunicationStatus.FAILED },
      });
      if (isRedisUnavailableError(error)) {
        throw new ServiceUnavailableException(
          'Notification delivery is temporarily unavailable because the background queue is offline. The communication was not sent.',
        );
      }
      throw error;
    }

    // Edge case: nothing to send. Finalize as SENT immediately (zero jobs).
    if (totalJobs === 0) {
      await this.prisma.communication.update({
        where: { id: communicationId },
        data: { status: CommunicationStatus.SENT, sentAt: new Date() },
      });
    }

    return { recipientCount: userIds.length, totalJobs };
  }

  async getCommunications(schoolId: string, options: any) {
    const { status } = options;
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.communication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { author: { select: { firstName: true, lastName: true } } }
      }),
      this.prisma.communication.count({ where })
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
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;
    const allowedStatuses = ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED'];
    const status = allowedStatuses.includes(String(options.status))
      ? String(options.status)
      : undefined;
    const search = typeof options.search === 'string' ? options.search.trim() : '';

    return this.prisma.notificationDelivery.findMany({
      where: {
        notification: {
          schoolId,
          ...(search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { user: { firstName: { contains: search, mode: 'insensitive' } } },
                  { user: { lastName: { contains: search, mode: 'insensitive' } } },
                  { user: { email: { contains: search, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
        status: status as any,
      },
      include: {
        notification: {
          select: {
            title: true,
            userId: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { lastAttemptAt: 'desc' },
      skip,
      take: limit,
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

    try {
      await this.notificationQueue.add('send-delivery', {
        deliveryId: delivery.id,
        channel: delivery.channel,
        recipientId: delivery.notification.userId,
        templateVersionId: delivery.notification.templateVersionId,
        data: {} // In a real app we'd need to re-fetch the original data payload
      });
    } catch (error) {
      this.logger.warn(
        `Unable to queue delivery retry ${deliveryId}: ${(error as Error).message}`,
      );
      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'FAILED',
          errorMessage: 'Background queue unavailable; retry was not queued.',
          failedAt: new Date(),
        },
      });
      if (isRedisUnavailableError(error)) {
        throw new ServiceUnavailableException(
          'Notification delivery is temporarily unavailable because the background queue is offline.',
        );
      }
      throw error;
    }

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

      try {
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
      } catch (error) {
        // The in-app notification is already persisted, so the caller still
        // succeeds; the outbound delivery is recorded as failed for retry.
        this.logger.warn(
          `Unable to queue delivery ${delivery.id}: ${(error as Error).message}`,
        );
        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            errorMessage: 'Background queue unavailable; delivery was not queued.',
            failedAt: new Date(),
          },
        });
      }
    }

    return { notification };
  }

  /**
   * Sends a direct SMS or Email message to a specific phone number or email
   * address (e.g. from a student's guardian contact). Records the delivery
   * attempt and routes through the configured provider.
   */
  async sendDirectMessage(schoolId: string, authorId: string, dto: any) {
    const { to, channel, content, subject, recipientName, studentId } = dto;

    const validChannels = ['SMS', 'EMAIL'] as const;
    const ch = String(channel ?? '').toUpperCase();
    if (!validChannels.includes(ch as any)) {
      throw new BadRequestException('Channel must be SMS or EMAIL.');
    }
    if (!to || !to.trim()) {
      throw new BadRequestException('A recipient address is required.');
    }
    if (!content || !content.trim()) {
      throw new BadRequestException('Message content is required.');
    }

    // Basic recipient validation
    if (ch === 'SMS') {
      const phoneRegex = /^\+?[\d\s\-()]{7,}$/;
      if (!phoneRegex.test(to.trim())) {
        throw new BadRequestException('Enter a valid phone number.');
      }

      // Check SMS credit balance before sending
      const school = await this.prisma.school.findUnique({
        where: { id: schoolId },
        select: { smsCreditBalance: true },
      });
      if (!school) {
        throw new NotFoundException('School not found');
      }
      const currentBalance = Number(school.smsCreditBalance);
      if (currentBalance < 1) {
        throw new BadRequestException(
          'Insufficient SMS credits. Please contact your platform administrator to purchase SMS tokens.'
        );
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to.trim())) {
        throw new BadRequestException('Enter a valid email address.');
      }
    }

    // Create a notification record for the direct message
    const notification = await this.prisma.notification.create({
      data: {
        schoolId,
        userId: authorId,
        notificationType: 'DIRECT_MESSAGE',
        title: ch === 'EMAIL' ? (subject?.trim() || 'Message from SchooMA') : 'SMS Message',
        content: content.trim(),
        priority: NotificationPriority.NORMAL,
        status: NotificationStatus.PENDING,
      },
    });

    // Create the delivery record
    const delivery = await this.prisma.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel: ch === 'SMS' ? CommunicationChannel.SMS : CommunicationChannel.EMAIL,
        status: 'PENDING',
      },
    });

    // Queue the delivery job for the notification processor to send
    // If the queue (Redis) is unavailable, send directly via the provider
    try {
      await this.notificationQueue.add('send-delivery', {
        deliveryId: delivery.id,
        channel: ch,
        recipientId: authorId, // The sender is recorded as the "recipient" for tracking; actual delivery target is `to`
        templateVersionId: null,
        data: {},
        manualContent: {
          subject: ch === 'EMAIL' ? (subject?.trim() || 'Message from SchooMA') : undefined,
          body: content.trim(),
        },
        // Store the actual target address for direct sends
        directTarget: to.trim(),
        directRecipientName: recipientName?.trim() || undefined,
        directStudentId: studentId?.trim() || undefined,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SENT },
      });

      return { notificationId: notification.id, deliveryId: delivery.id, status: 'queued' };
    } catch (queueError) {
      this.logger.warn(`Unable to queue direct message ${delivery.id}: ${(queueError as Error).message}`);

      // Fallback: send directly without the queue when Redis is unavailable
      if (isRedisUnavailableError(queueError)) {
        this.logger.log(`Falling back to direct send for delivery ${delivery.id} (Redis unavailable)`);

        let result: { success: boolean; reference?: string; error?: string; code?: string } = {
          success: false,
          reference: '',
          error: '',
        };
        let smsSegments = 0;

        if (ch === CommunicationChannel.EMAIL) {
          result = await this.emailProvider.send({
            to: to.trim(),
            subject: subject?.trim() || 'Message from SchooMA',
            body: content.trim(),
          });
        } else if (ch === CommunicationChannel.SMS) {
          smsSegments = smsSegmentCount(content.trim()).segments;
          result = await this.smsProvider.send({
            to: to.trim(),
            message: content.trim(),
          });
        }

        // Provider success is acceptance, not confirmed delivery. SMS/EMAIL are
        // recorded as SENT; DELIVERED is reserved for a provider receipt.
        const finalStatus = !result.success
          ? 'FAILED'
          : 'SENT';

        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: finalStatus as any,
            providerRef: result.reference,
            errorCode: result.code ?? null,
            errorMessage: result.error,
            sentAt: result.success ? new Date() : null,
            failedAt: !result.success ? new Date() : null,
            ...(ch === CommunicationChannel.SMS ? { smsSegments, smsCreditsCost: smsSegments } : {}),
          },
        });

        // Charge segment credits only for a provider-accepted SMS, through the
        // audited, idempotent ledger.
        if (ch === CommunicationChannel.SMS && result.success) {
          await this.smsService.chargeSmsDelivery({
            schoolId,
            credits: smsSegments,
            deliveryId: delivery.id,
            segments: smsSegments,
          });
        }

        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED },
        });

        return {
          notificationId: notification.id,
          deliveryId: delivery.id,
          status: result.success ? 'sent' : 'failed',
          warning: result.success
            ? 'Message sent directly (background queue was unavailable).'
            : 'Message failed to send. Background queue is unavailable.',
        };
      }

      // Non-Redis queue error - update delivery and rethrow
      await this.prisma.notificationDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          errorMessage: 'Background queue unavailable; message was not queued.',
          failedAt: new Date(),
        },
      });
      throw new ServiceUnavailableException('Messaging queue is temporarily unavailable. Your message was not sent.');
    }
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
