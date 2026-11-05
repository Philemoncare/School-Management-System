import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { TemplateService } from './template.service';
import { NotificationProcessor } from './processors/notification.processor';
import { EmailProvider, ConsoleEmailProvider, SmtpEmailProvider } from './providers/email.provider';
import { SmsProvider, ConsoleSmsProvider } from './providers/sms.provider';
import { ArkeselSmsProvider } from './providers/arkesel-sms.provider';
import { resolveArkeselConfig } from '../common/utils/sms-gateway';
import { CommunicationGateway } from './gateways/communication.gateway';
import { AudienceResolverService } from './audience-resolver.service';
import { JwtModule } from '@nestjs/jwt';
import { redisConnectionConfig } from '../redis/redis-connection';
import { SmsModule } from '../sms/sms.module';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
      connection: redisConnectionConfig(),
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
    }),
    SmsModule,
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
      // Selecting on the key alone lets the provider itself report precisely
      // what is still missing (e.g. a sender ID) instead of silently falling
      // back to a console preview that would never send.
      useClass: resolveArkeselConfig().apiKey ? ArkeselSmsProvider : ConsoleSmsProvider,
    },
  ],
  exports: [CommunicationService, CommunicationGateway, EmailProvider, SmsProvider],
})
export class CommunicationModule {}
