import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SmsService } from '../../sms/sms.service';
import { TemplateService } from '../template.service';
import { EmailProvider } from '../providers/email.provider';
import { SmsProvider } from '../providers/sms.provider';
import { smsSegmentCount } from '../../common/utils/sms-segments';
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
    private smsService: SmsService,
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
        include: { notification: { select: { schoolId: true, communicationId: true } } },
      }),
      this.prisma.user.findUnique({ where: { id: recipientId } }),
      templateVersionId ? this.prisma.notificationTemplateVersion.findUnique({ where: { id: templateVersionId } }) : Promise.resolve(null),
    ]);

    if (!delivery || !recipient || (!templateVersion && !manualContent)) {
      this.logger.error(`Missing data for delivery ${deliveryId}`);
      return;
    }

    const schoolId = delivery.notification?.schoolId ?? null;
    const communicationId = delivery.notification?.communicationId ?? null;

    try {
      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: { attemptCount: { increment: 1 }, lastAttemptAt: new Date() },
      });

      let result: { success: boolean; reference?: string; error?: string; code?: string } = {
        success: false,
        reference: '',
        error: '',
      };

      const body = manualContent?.body || this.templateService.render(templateVersion!.body, variables);
      const subject = manualContent?.subject || (templateVersion?.subject ? this.templateService.render(templateVersion.subject, variables) : undefined);

      // For direct messages, the target address is stored in directTarget.
      // Otherwise, use the recipient user's contact details.
      const directTarget = (data as any)?.directTarget;

      let smsSegments = 0;
      let smsCreditsCost = 0;

      if (channel === CommunicationChannel.EMAIL) {
        result = await this.emailProvider.send({
          to: directTarget || recipient.email,
          subject: subject || 'Notification',
          body,
        });
      } else if (channel === CommunicationChannel.SMS) {
        const phone = directTarget || recipient.phone;
        if (!phone) throw new Error('Recipient has no phone number');
        const seg = smsSegmentCount(body);
        smsSegments = seg.segments;
        smsCreditsCost = seg.segments; // 1 credit per segment; refine per provider rate card
        result = await this.smsProvider.send({
          to: phone,
          message: body,
        });
      } else if (channel === CommunicationChannel.WEBSOCKET) {
        // A real socket push is a genuine delivery once acknowledged by the gateway.
        result = { success: true, reference: 'ws-broadcast' };
      } else if (channel === CommunicationChannel.IN_APP) {
        // In-app is "delivered" as soon as it's in the database.
        result = { success: true, reference: 'db-record' };
      }

      // A provider (SMS/email) handing a message to the network only proves
      // *acceptance*, not delivery. We therefore record SENT and reserve
      // DELIVERED for channels we can truly confirm (IN_APP/WEBSOCKET) or a
      // future provider delivery receipt.
      const isExternalChannel =
        channel === CommunicationChannel.SMS || channel === CommunicationChannel.EMAIL;
      const finalStatus: DeliveryStatus = !result.success
        ? 'FAILED'
        : isExternalChannel
          ? 'SENT'
          : 'DELIVERED';

      await this.prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
          status: finalStatus,
          providerRef: result.reference,
          errorCode: result.code ?? null,
          errorMessage: result.error,
          sentAt: result.success && isExternalChannel ? new Date() : null,
          deliveredAt: finalStatus === 'DELIVERED' ? new Date() : null,
          failedAt: !result.success ? new Date() : null,
          ...(channel === CommunicationChannel.SMS ? { smsSegments, smsCreditsCost } : {}),
        },
      });

      // Charge SMS credits only for a provider-accepted SMS, segment-aware,
      // once per delivery (guarded by smsChargedAt so a retry can never
      // double-charge) and through the audited ledger in SmsService.
      if (
        channel === CommunicationChannel.SMS &&
        result.success &&
        schoolId &&
        !delivery.smsChargedAt
      ) {
        try {
          const charge = await this.smsService.chargeSmsDelivery({
            schoolId,
            credits: smsCreditsCost,
            deliveryId,
            segments: smsSegments,
          });
          if (!charge.charged) {
            this.logger.warn(
              `Delivery ${deliveryId} accepted by provider but could not be charged: ${charge.reason}`,
            );
          }
        } catch (chargeErr: any) {
          this.logger.error(
            `Failed to record SMS charge for delivery ${deliveryId}: ${chargeErr?.message}`,
          );
        }
      }

      // Maintain truthful campaign-level progress when this delivery belongs to
      // a bulk communication.
      if (communicationId) {
        await this.prisma.communication.update({
          where: { id: communicationId },
          data: {
            processedJobs: { increment: 1 },
            succeededJobs: { increment: result.success ? 1 : 0 },
            failedJobs: { increment: result.success ? 0 : 1 },
          },
        });
        await this.maybeFinalizeCommunication(communicationId);
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
      if (communicationId) {
        await this.prisma.communication.update({
          where: { id: communicationId },
          data: { processedJobs: { increment: 1 }, failedJobs: { increment: 1 } },
        });
        await this.maybeFinalizeCommunication(communicationId);
      }
      throw error; // Let BullMQ handle retry
    }
  }

  /**
   * Flips a communication out of SENDING once every queued recipient/channel
   * job has settled, using an aggregate that reflects the real outcomes rather
   * than the moment the jobs were enqueued.
   */
  private async maybeFinalizeCommunication(communicationId: string) {
    const comm = await this.prisma.communication.findUnique({
      where: { id: communicationId },
      select: { status: true, totalJobs: true, processedJobs: true, succeededJobs: true, failedJobs: true },
    });
    if (!comm || comm.totalJobs <= 0) return;
    if (comm.processedJobs < comm.totalJobs) return;
    if (comm.status !== 'SENDING') return;

    let status: 'SENT' | 'PARTIALLY_SENT' | 'FAILED';
    if (comm.succeededJobs === 0) {
      status = 'FAILED';
    } else if (comm.failedJobs > 0) {
      status = 'PARTIALLY_SENT';
    } else {
      status = 'SENT';
    }

    await this.prisma.communication.update({
      where: { id: communicationId },
      data: { status, sentAt: new Date() },
    });
  }
}
