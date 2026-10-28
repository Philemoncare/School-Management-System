import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupportAccessStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateSupportAccessDto } from '../dto/super-admin.dto';
import { SupportAccessService } from '../services/support-access.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  'PLATFORM_SUPER_ADMIN',
  'PLATFORM_OPERATIONS_ADMIN',
  'PLATFORM_SUPPORT_ADMIN',
  'SUPER_ADMIN',
)
@Controller('super-admin/support-access')
export class SuperAdminSupportAccessController {
  constructor(private readonly supportAccess: SupportAccessService) {}

  @Get()
  list(
    @Query('status') status?: SupportAccessStatus,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.supportAccess.list({ status, schoolId });
  }

  @Post()
  request(@Body() dto: CreateSupportAccessDto, @CurrentUser() user: any) {
    return this.supportAccess.request(dto, user.id);
  }

  @Roles('PLATFORM_SUPER_ADMIN', 'SUPER_ADMIN')
  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.supportAccess.approve(id, user.id);
  }

  @Post(':id/revoke')
  revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.supportAccess.revoke(id, user.id);
  }
}
