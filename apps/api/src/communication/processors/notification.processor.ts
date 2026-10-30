import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { TemplateService } from '../template.service';
import { EmailProvider } from '../providers/email.provider';
import { SmsProvider } from '../providers/sms.provider';
import { CommunicationChannel, DeliveryStatus, Prisma } from '@prisma/client';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private templateService: TemplateService,
    private emailProvider: EmailProvider,
    private smsProvider: SmsProvider,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'send-delivery') {
      return this.handleSendDelivery(job.data);
    }
    if (job.name === 'process-communication') {
      return this.handleProcessCommunication(job.data);
    }
  }

  private async handleProcessCommunication(data: any) {
    const { communicationId, userId, channel, data: variables } = data;

    const comm = await this.prisma.communication.findUnique({
      where: { id: communicationId }
    });

    if (!comm) return;

    // Create a notification record linked to the communication intent
    const notification = await this.prisma.notification.create({
      data: {
        schoolId: comm.schoolId,
        userId,
        communicationId,
        notificationType: 'OPERATIONAL_COMMUNICATION',
        title: this.templateService.render(comm.title, variables),
        content: this.templateService.render(comm.content, variables),
        priority: comm.priority,
        status: 'PENDING'
      }
    });

    const delivery = await this.prisma.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel,
        status: 'PENDING'
      }
    });

    // Reuse delivery logic
    return this.handleSendDelivery({
      deliveryId: delivery.id,
      channel,
      recipientId: userId,
      templateVersionId: comm.templateVersionId, // Might be null if manual content
      data: variables,
      manualContent: {
        subject: comm.subject ? this.templateService.render(comm.subject, variables) : undefined,
        body: this.templateService.render(comm.content, variables)
      }
    });
  }

  private async handleSendDelivery(data: any) {
    const { deliveryId, channel, recipientId, templateVersionId, data: variables, manualContent } = data;

    const [delivery, recipient, templateVersion] = await Promise.all([
      this.prisma.notificationDelivery.findUnique({
        where: { id: deliveryId },
        include: { notification: { select: { schoolId: true } } },
      }),
      this.prisma.user.findUnique({ where: { id: recipientId } }),
      templateVersionId ? this.prisma.notificationTemplateVersion.findUnique({ where: { id: templateVersionId } }) : Promise.resolve(null),
    ]);

    if (!delivery || !recipient || (!templateVersion && !manualContent)) {
      this.logger.error(`Missing data for delivery ${deliveryId}`);
      return;
    }

    try {
      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { attemptCount: { increment: 1 }, lastAttemptAt: new Date() },
      });

      let result: { success: boolean; reference?: string; error?: string } = { success: false, reference: '', error: '' };

      const body = manualContent?.body || this.templateService.render(templateVersion!.body, variables);
      const subject = manualContent?.subject || (templateVersion?.subject ? this.templateService.render(templateVersion.subject, variables) : undefined);

      // For direct messages, the target address is stored in directTarget.
      // Otherwise, use the recipient user's contact details.
      const directTarget = (data as any)?.directTarget;

      if (channel === CommunicationChannel.EMAIL) {
        result = await this.emailProvider.send({
          to: directTarget || recipient.email,
          subject: subject || 'Notification',
          body,
        });
      } else if (channel === CommunicationChannel.SMS) {
        const phone = directTarget || recipient.phone;
        if (!phone) throw new Error('Recipient has no phone number');
        result = await this.smsProvider.send({
          to: phone,
          message: body,
        });
      } else if (channel === CommunicationChannel.WEBSOCKET) {
        // Realtime logic handled via separate gateway/event emitter
        result = { success: true, reference: 'ws-broadcast' };
      } else if (channel === CommunicationChannel.IN_APP) {
        // In-app is "delivered" as soon as it's in the database
        result = { success: true, reference: 'db-record' };
      }

      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: result.success ? 'DELIVERED' : 'FAILED',
          providerRef: result.reference,
          errorMessage: result.error,
          deliveredAt: result.success ? new Date() : null,
          failedAt: !result.success ? new Date() : null,
        },
      });

      // Deduct SMS credit on successful delivery
      if (channel === CommunicationChannel.SMS && result.success && delivery.notification?.schoolId) {
        await this.prisma.school.update({
          where: { id: delivery.notification.schoolId },
          data: {
            smsCreditBalance: {
              decrement: new Prisma.Decimal(1),
            },
          },
        });
      }

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to process delivery ${deliveryId}: ${error.message}`);
      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          failedAt: new Date(),
        },
      });
      throw error; // Let BullMQ handle retry
    }
  }
}
