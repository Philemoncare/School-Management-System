import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PLATFORM_SUPER_ROLES } from '../../auth/platform-roles';
import { GrantSmsCreditsDto } from '../../sms/dto/sms-package.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_SUPER_ROLES)
@Controller('super-admin/sms-credits')
export class SuperAdminSmsCreditsController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  getSmsCredits() {
    return this.superAdminService.getSmsCredits();
  }

  /**
   * Credit transaction history for every school. Read-only view over the same
   * ledger that /super-admin/sms-packages/purchases serves, kept here because
   * this is the URL the credit dashboard already uses.
   */
  @Get('transactions')
  getTransactions(
    @Query('status') status?: string,
    @Query('schoolId') schoolId?: string,
    @Query('take') take?: string,
  ) {
    return this.superAdminService.getSmsPurchaseLedger({
      status,
      schoolId,
      take: take ? Number(take) : undefined,
    });
  }

  // Declared after the static segment above: Nest matches declaration order, so
  // ':schoolId' first would swallow "transactions" as a school id.
  @Get(':schoolId')
  getSmsCreditDetail(@Param('schoolId') schoolId: string) {
    return this.superAdminService.getSmsCreditDetail(schoolId);
  }

  @Post('topup')
  topUpSmsCredit(
    @Body() dto: GrantSmsCreditsDto,
    @CurrentUser() user: any,
  ) {
    return this.superAdminService.topUpSmsCredit(dto, user.id);
  }
}
