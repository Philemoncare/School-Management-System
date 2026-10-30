import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto, LinkGuardianDto, UpdateLinkGuardianDto } from './dto/create-guardian.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST')
  @Post()
  create(@Body() dto: CreateGuardianDto, @CurrentUser() user: any) {
    return this.guardiansService.create(dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST')
  @Post('link/:studentId')
  linkToStudent(
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
    @Body() dto: LinkGuardianDto,
    @CurrentUser() user: any
  ) {
    return this.guardiansService.linkToStudent(schoolId, studentId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST')
  @Get()
  findAll(@ActiveSchool() schoolId: string) {
    return this.guardiansService.findAll(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT')
  @Get('student/:studentId')
  findByStudent(
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string
  ) {
    return this.guardiansService.findByStudent(schoolId, studentId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST')
  @Delete('unlink/:studentId/:guardianId')
  unlinkFromStudent(
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
    @Param('guardianId') guardianId: string,
    @CurrentUser() user: any
  ) {
    return this.guardiansService.unlinkFromStudent(schoolId, studentId, guardianId, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST')
  @Patch('link/:studentId/:guardianId')
  updateLink(
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
    @Param('guardianId') guardianId: string,
    @Body() dto: UpdateLinkGuardianDto,
    @CurrentUser() user: any
  ) {
    return this.guardiansService.updateLink(schoolId, studentId, guardianId, dto, user.id);
  }
}
