import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PurchaseSmsCreditsDto } from './dto/sms-package.dto';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('school/sms')
export class SchoolSmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get('packages')
  getAvailablePackages() {
    return this.smsService.getAvailableSmsPackages();
  }

  @Get('balance')
  getBalance(@ActiveSchool() schoolId: string) {
    return this.smsService.getSchoolSmsBalance(schoolId);
  }

  @Get('transactions')
  getTransactions(@ActiveSchool() schoolId: string) {
    return this.smsService.getRecentSmsTransactions(schoolId);
  }

  @Get('purchases')
  getPurchases(@ActiveSchool() schoolId: string) {
    return this.smsService.getSchoolSmsPurchases(schoolId);
  }

  @Post('purchase')
  @Roles('SCHOOL_ADMIN')
  purchase(
    @ActiveSchool() schoolId: string,
    @Body() dto: PurchaseSmsCreditsDto,
    @CurrentUser() user: any,
  ) {
    return this.smsService.purchaseSmsCredits(schoolId, dto, user.id);
  }

  @Post('purchases/:purchaseId/complete')
  @Roles('SCHOOL_ADMIN')
  completePurchase(
    @ActiveSchool() schoolId: string,
    @Param('purchaseId') purchaseId: string,
    @CurrentUser() user: any,
  ) {
    return this.smsService.completeSmsCreditPurchase(purchaseId, user.id);
  }

  @Post('purchases/:purchaseId/cancel')
  @Roles('SCHOOL_ADMIN')
  cancelPurchase(
    @ActiveSchool() schoolId: string,
    @Param('purchaseId') purchaseId: string,
    @CurrentUser() user: any,
  ) {
    return this.smsService.cancelSmsCreditPurchase(purchaseId, user.id);
  }
}
