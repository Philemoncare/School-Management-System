import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TemplateService } from './template.service';
import { CommunicationGateway } from './gateways/communication.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CommunicationChannel, NotificationPriority, NotificationStatus } from '@prisma/client';

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private prisma: PrismaService,
    private templateService: TemplateService,
    private gateway: CommunicationGateway,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  /**
   * Sends a notification to a specific user.
   */
  async sendNotification(params: {
    schoolId: string;
    userId: string;
    type: string;
    data: Record<string, any>;
    priority?: NotificationPriority;
  }) {
    const { schoolId, userId, type, data, priority = NotificationPriority.NORMAL } = params;

    // 1. Get enabled channels for this user and type (NotificationPreferences)
    const preferences = await this.prisma.notificationPreference.findMany({
      where: { userId, notificationType: type, isEnabled: true },
    });

    // If no preferences found, default to IN_APP and WEBSOCKET for safety
    const channels = preferences.length > 0
      ? preferences.map(p => p.channel)
      : [CommunicationChannel.IN_APP, CommunicationChannel.WEBSOCKET];

    // 2. Resolve templates for each channel
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

    // Group templates by channel, keeping only the best match (school-specific)
    const uniqueTemplates = new Map<CommunicationChannel, any>();
    for (const t of templates) {
      if (!uniqueTemplates.has(t.channel) && t.versions.length > 0) {
        uniqueTemplates.set(t.channel, t);
      }
    }

    if (uniqueTemplates.size === 0) {
      this.logger.warn(`No active templates with versions found for notification type: ${type}`);
      return;
    }

    // 3. Create the notification record
    // We use the IN_APP template for the base title/content if available
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

    // 3.5. Trigger Realtime notification via WebSocket
    if (channels.includes(CommunicationChannel.WEBSOCKET)) {
      this.gateway.sendToUser(userId, 'notification', {
        id: notification.id,
        title,
        content,
        type,
        createdAt: notification.createdAt,
      });
    }

    // 4. Create delivery records and add to queue
    const deliveries = [];
    for (const [channel, template] of uniqueTemplates.entries()) {
      const version = template.versions[0];
      const delivery = await this.prisma.notificationDelivery.create({
        data: {
          notificationId: notification.id,
          channel,
          status: 'PENDING',
        },
      });

      // Add to BullMQ
      await this.notificationQueue.add('send-delivery', {
        deliveryId: delivery.id,
        channel,
        recipientId: userId,
        templateVersionId: version.id, // Use explicit version for delivery
        data,
      }, {
        priority: this.getQueuePriority(priority),
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });

      deliveries.push(delivery);
    }

    return { notification, deliveries };
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
