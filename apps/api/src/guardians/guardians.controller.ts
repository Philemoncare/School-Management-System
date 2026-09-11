import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GuardiansService } from './guardians.service';
import { CreateGuardianDto, LinkGuardianDto } from './dto/create-guardian.dto';
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

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT')
  @Get('student/:studentId')
  findByStudent(
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string
  ) {
    return this.guardiansService.findByStudent(schoolId, studentId);
  }
}
