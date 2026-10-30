import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PLATFORM_SUPER_ROLES } from '../../auth/platform-roles';
import { TopUpSmsCreditDto } from '../dto/super-admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_SUPER_ROLES)
@Controller('super-admin/sms-credits')
export class SuperAdminSmsCreditsController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  getSmsCredits() {
    return this.superAdminService.getSmsCredits();
  }

  @Get(':schoolId')
  getSmsCreditDetail(@Param('schoolId') schoolId: string) {
    return this.superAdminService.getSmsCreditDetail(schoolId);
  }

  @Post('topup')
  topUpSmsCredit(
    @Body() dto: TopUpSmsCreditDto,
    @CurrentUser() user: any,
  ) {
    return this.superAdminService.topUpSmsCredit(dto, user.id);
  }
}
