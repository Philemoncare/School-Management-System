import { Module, Global } from '@nestjs/common';
import { IntegrationStatusService } from '../common/services/integration-status.service';
import { IntegrationsController } from './integrations.controller';

@Global()
@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationStatusService],
  exports: [IntegrationStatusService],
})
export class IntegrationsModule {}
