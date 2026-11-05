import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminDashboardController } from './controllers/super-admin-dashboard.controller';
import { SuperAdminSchoolsController } from './controllers/super-admin-schools.controller';
import { SuperAdminUsersController } from './controllers/super-admin-users.controller';
import { SuperAdminPlansController } from './controllers/super-admin-plans.controller';
import { SuperAdminBillingController } from './controllers/super-admin-billing.controller';
import { SuperAdminMaintenanceController } from './controllers/super-admin-maintenance.controller';
import { SuperAdminMonitoringController } from './controllers/super-admin-monitoring.controller';
import { SuperAdminAuditController } from './controllers/super-admin-audit.controller';
import { SuperAdminSettingsController } from './controllers/super-admin-settings.controller';
import { SuperAdminSecurityController } from './controllers/super-admin-security.controller';
import { SuperAdminAnnouncementsController } from './controllers/super-admin-announcements.controller';
import { LaunchReadinessController } from './controllers/launch-readiness.controller';
import { SuperAdminSupportAccessController } from './controllers/super-admin-support-access.controller';
import { SuperAdminBackupsController } from './controllers/super-admin-backups.controller';
import { MaintenanceStatusController } from './controllers/maintenance-status.controller';
import { SuperAdminSmsCreditsController } from './controllers/super-admin-sms-credits.controller';
import { SupportAccessService } from './services/support-access.service';
import { BackupService } from './services/backup.service';
import { DataIntegrityService } from '../common/services/data-integrity.service';
import { SchoolMaintenanceController } from '../dev-mode/school-maintenance.controller';
import { SmsModule } from '../sms/sms.module';
import { redisConnectionConfig } from '../redis/redis-connection';

@Module({
  imports: [
    AuthModule,
    SmsModule,
    BullModule.registerQueue({
      name: 'notifications',
      connection: redisConnectionConfig(),
    }),
  ],
  providers: [
    SuperAdminService,
    SupportAccessService,
    BackupService,
    DataIntegrityService,
  ],
  controllers: [
    SuperAdminDashboardController,
    SuperAdminSchoolsController,
    SuperAdminUsersController,
    SuperAdminPlansController,
    SuperAdminBillingController,
    SuperAdminMaintenanceController,
    SuperAdminMonitoringController,
    SuperAdminAuditController,
    SuperAdminSettingsController,
    SuperAdminSecurityController,
    SuperAdminAnnouncementsController,
    SuperAdminSupportAccessController,
    SuperAdminBackupsController,
    MaintenanceStatusController,
    LaunchReadinessController,
    SuperAdminSmsCreditsController,
    SchoolMaintenanceController,
  ],
})
export class SuperAdminModule {}
