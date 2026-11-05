import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsProvider } from '../communication/providers/sms.provider';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  PLATFORM_SUPER_ROLES,
  PLATFORM_OPERATOR_ROLES,
  PLATFORM_READ_ROLES,
} from '../auth/platform-roles';
import {
  CreateSmsPackageDto,
  UpdateSmsPackageDto,
  GrantSmsCreditsDto,
  ConfirmSmsPurchaseDto,
} from './dto/sms-package.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('super-admin/sms-packages')
export class SmsController {
  constructor(
    private readonly smsService: SmsService,
    private readonly smsProvider: SmsProvider,
  ) {}

  @Get()
  @Roles(...PLATFORM_OPERATOR_ROLES)
  getPackages() {
    return this.smsService.getSmsPackages();
  }

  // Static segments must be declared before @Get(':id'); Nest matches routes
  // in declaration order, so a later "balances" would be captured as the
  // package id "balances" and answer 404.
  @Get('balances')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  getAllBalances() {
    return this.smsService.getAllSmsBalances();
  }

  /**
   * The platform's own credit wallet at the SMS gateway. This is not any
   * school's balance; schools are billed from their own credit balance.
   */
  @Get('provider-balance')
  @Roles(...PLATFORM_READ_ROLES)
  getProviderBalance() {
    return this.smsProvider.getBalance();
  }

  /**
   * Cross-school SMS credit ledger: platform grants and school purchases.
   * This is the "SMS transaction history" the module promises, and the queue
   * a platform admin works through to confirm that a school has paid.
   */
  @Get('purchases')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  getPurchases(
    @Query('status') status?: string,
    @Query('schoolId') schoolId?: string,
    @Query('take') take?: string,
  ) {
    return this.smsService.getSmsPurchaseLedger({
      status,
      schoolId,
      take: take ? Number(take) : undefined,
    });
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

  @Post('purchases/:purchaseId/confirm')
  @Roles(...PLATFORM_SUPER_ROLES)
  confirmPurchase(
    @Param('purchaseId') purchaseId: string,
    @Body() dto: ConfirmSmsPurchaseDto,
    @CurrentUser() user: any,
  ) {
    // Platform-side only. A school must not be able to confirm its own payment;
    // that was the previous behaviour and it handed out credits for free.
    return this.smsService.confirmSmsCreditPurchase(
      purchaseId,
      user.id,
      dto.reference,
      dto.note,
    );
  }

  @Post('topup')
  @Roles(...PLATFORM_SUPER_ROLES)
  topUp(
    @Body() dto: GrantSmsCreditsDto,
    @CurrentUser() user: any,
  ) {
    return this.smsService.grantSmsCredits(
      dto.schoolId,
      dto.packageId,
      dto.reason,
      user.id,
    );
  }
}
