import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IntegrationStatusService, IntegrationName } from '../common/services/integration-status.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationStatusService: IntegrationStatusService) {}

  @Get('status')
  @Public()
  getStatus(@Query('service') service?: IntegrationName) {
    if (service) {
      return {
        success: true,
        data: this.integrationStatusService.getStatus(service),
      };
    }
    return {
      success: true,
      data: this.integrationStatusService.getAllStatuses(),
    };
  }
}
