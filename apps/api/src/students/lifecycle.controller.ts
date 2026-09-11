import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LifecycleService } from './lifecycle.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudentStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('students')
export class LifecycleController {
  constructor(private readonly lifecycleService: LifecycleService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post(':id/status')
  updateStatus(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body('status') status: StudentStatus,
    @Body('reason') reason: string,
    @CurrentUser() user: any
  ) {
    return this.lifecycleService.updateStatus(schoolId, id, status, reason, user.id);
  }
}
