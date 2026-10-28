import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { BackupService } from '../services/backup.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_SUPER_ADMIN', 'SUPER_ADMIN')
@Controller('super-admin/backups')
export class SuperAdminBackupsController {
  constructor(private readonly backups: BackupService) {}

  @Get()
  list() {
    return this.backups.list();
  }

  @Post()
  start(@CurrentUser() user: any) {
    return this.backups.start(user.id);
  }

  @Post(':id/verify')
  verify(@Param('id') id: string, @CurrentUser() user: any) {
    return this.backups.verify(id, user.id);
  }
}
