import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { TemplateService } from '../template.service';
import { EmailProvider } from '../providers/email.provider';
import { SmsProvider } from '../providers/sms.provider';
import { CommunicationChannel, DeliveryStatus } from '@prisma/client';
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
  }

  private async handleSendDelivery(data: any) {
    const { deliveryId, channel, recipientId, templateVersionId, data: variables } = data;

    const [delivery, recipient, templateVersion] = await Promise.all([
      this.prisma.notificationDelivery.findUnique({ where: { id: deliveryId } }),
      this.prisma.user.findUnique({ where: { id: recipientId } }),
      this.prisma.notificationTemplateVersion.findUnique({ where: { id: templateVersionId } }),
    ]);

    if (!delivery || !recipient || !templateVersion) {
      this.logger.error(`Missing data for delivery ${deliveryId}`);
      return;
    }

    try {
      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { attemptCount: { increment: 1 }, lastAttemptAt: new Date() },
      });

      let result = { success: false, reference: '', error: '' };

      const body = this.templateService.render(templateVersion.body, variables);
      const subject = templateVersion.subject ? this.templateService.render(templateVersion.subject, variables) : undefined;

      if (channel === CommunicationChannel.EMAIL) {
        result = await this.emailProvider.send({
          to: recipient.email,
          subject: subject || 'Notification',
          body,
        });
      } else if (channel === CommunicationChannel.SMS) {
        if (!recipient.phone) throw new Error('Recipient has no phone number');
        result = await this.smsProvider.send({
          to: recipient.phone,
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
