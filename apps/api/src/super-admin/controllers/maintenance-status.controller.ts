import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';
import { SuperAdminService } from '../super-admin.service';

@Public()
@Controller('maintenance')
export class MaintenanceStatusController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('status')
  getStatus(@Query('schoolId') schoolId?: string) {
    return this.superAdminService.getMaintenanceStatus(schoolId);
  }
}
