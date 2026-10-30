import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PLATFORM_SUPER_ROLES, PLATFORM_OPERATOR_ROLES } from '../auth/platform-roles';
import {
  CreateSmsPackageDto,
  UpdateSmsPackageDto,
} from './dto/sms-package.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('super-admin/sms-packages')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get()
  @Roles(...PLATFORM_OPERATOR_ROLES)
  getPackages() {
    return this.smsService.getSmsPackages();
  }

  @Get(':id')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  getPackage(@Param('id') id: string) {
    return this.smsService.getSmsPackage(id);
  }

  @Post()
  @Roles(...PLATFORM_SUPER_ROLES)
  createPackage(
    @Body() dto: CreateSmsPackageDto,
    @CurrentUser() user: any,
  ) {
    return this.smsService.createSmsPackage(dto, user.id);
  }

  @Patch(':id')
  @Roles(...PLATFORM_SUPER_ROLES)
  updatePackage(
    @Param('id') id: string,
    @Body() dto: UpdateSmsPackageDto,
    @CurrentUser() user: any,
  ) {
    return this.smsService.updateSmsPackage(id, dto, user.id);
  }

  @Post(':id/archive')
  @Roles(...PLATFORM_SUPER_ROLES)
  archivePackage(@Param('id') id: string, @CurrentUser() user: any) {
    return this.smsService.archiveSmsPackage(id, user.id);
  }

  @Get('balances')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  getAllBalances() {
    return this.smsService.getAllSmsBalances();
  }

  @Post('topup')
  @Roles(...PLATFORM_SUPER_ROLES)
  topUp(
    @Body() dto: { schoolId: string; credits: number; reason: string },
    @CurrentUser() user: any,
  ) {
    return this.smsService.topUpSmsCredits(
      dto.schoolId,
      dto.credits,
      dto.reason,
      user.id,
    );
  }
}
