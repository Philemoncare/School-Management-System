import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { TermsService } from './terms.service';
import { CreateTermDto, UpdateTermDto } from './dto/term.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('academic-terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateTermDto,
    @CurrentUser() user: any
  ) {
    return this.termsService.create(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('by-year/:academicYearId')
  findByYear(
    @ActiveSchool() schoolId: string,
    @Param('academicYearId') academicYearId: string
  ) {
    return this.termsService.findByYear(schoolId, academicYearId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id')
  update(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTermDto,
    @CurrentUser() user: any
  ) {
    return this.termsService.update(schoolId, id, dto, user.id);
  }
}
