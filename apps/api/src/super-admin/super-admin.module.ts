import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminDashboardController } from './controllers/super-admin-dashboard.controller';
import { SuperAdminSchoolsController } from './controllers/super-admin-schools.controller';
import { SuperAdminUsersController } from './controllers/super-admin-users.controller';
import { SuperAdminPlansController } from './controllers/super-admin-plans.controller';
import { SuperAdminMaintenanceController } from './controllers/super-admin-maintenance.controller';
import { SuperAdminMonitoringController } from './controllers/super-admin-monitoring.controller';
import { SuperAdminAuditController } from './controllers/super-admin-audit.controller';
import { SuperAdminSettingsController } from './controllers/super-admin-settings.controller';
import { LaunchReadinessController } from './controllers/launch-readiness.controller';
import { DataIntegrityService } from '../common/services/data-integrity.service';

@Module({
  providers: [SuperAdminService, DataIntegrityService],
  controllers: [
    SuperAdminDashboardController,
    SuperAdminSchoolsController,
    SuperAdminUsersController,
    SuperAdminPlansController,
    SuperAdminMaintenanceController,
    SuperAdminMonitoringController,
    SuperAdminAuditController,
    SuperAdminSettingsController,
    LaunchReadinessController,
  ],
})
export class SuperAdminModule {}
