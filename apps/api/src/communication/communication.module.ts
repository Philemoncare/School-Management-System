import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { TemplateService } from './template.service';
import { NotificationProcessor } from './processors/notification.processor';
import { EmailProvider, ConsoleEmailProvider, SmtpEmailProvider } from './providers/email.provider';
import { SmsProvider, ConsoleSmsProvider } from './providers/sms.provider';
import { CommunicationGateway } from './gateways/communication.gateway';
import { AudienceResolverService } from './audience-resolver.service';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
    }),
  ],
  controllers: [CommunicationController],
  providers: [
    CommunicationService,
    TemplateService,
    AudienceResolverService,
    NotificationProcessor,
    CommunicationGateway,
    {
      provide: EmailProvider,
      useClass: process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
        ? SmtpEmailProvider
        : ConsoleEmailProvider,
    },
    {
      provide: SmsProvider,
      useClass: ConsoleSmsProvider,
    },
  ],
  exports: [CommunicationService, CommunicationGateway, EmailProvider, SmsProvider],
})
export class CommunicationModule {}
