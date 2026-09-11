import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('school-profile')
export class SchoolProfileController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Get()
  getProfile(@ActiveSchool() schoolId: string) {
    return this.schoolsService.findOne(schoolId);
  }

  @Roles('SCHOOL_ADMIN')
  @Patch()
  updateProfile(
    @ActiveSchool() schoolId: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
    @CurrentUser() user: any
  ) {
    return this.schoolsService.update(schoolId, updateSchoolDto, user.id);
  }
}
