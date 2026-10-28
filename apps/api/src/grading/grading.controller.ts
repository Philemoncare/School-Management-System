import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { GradingService } from './grading.service';
import { CreateGradingScaleDto, UpdateGradingScaleDto } from '../results/dto/grading.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('grading')
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post('scales')
  createScale(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateGradingScaleDto,
    @CurrentUser() user: any,
  ) {
    return this.gradingService.createScale(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('scales')
  findAllScales(@ActiveSchool() schoolId: string) {
    return this.gradingService.findAllScales(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('scales/:id')
  findOne(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.gradingService.findOne(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch('scales/:id')
  updateScale(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGradingScaleDto,
    @CurrentUser() user: any,
  ) {
    return this.gradingService.updateScale(schoolId, id, dto, user.id);
  }
}
