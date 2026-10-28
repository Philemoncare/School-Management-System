import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateSectionDto,
    @CurrentUser() user: any
  ) {
    return this.sectionsService.create(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'RECEPTIONIST', 'TIMETABLE_OFFICER', 'ACADEMIC_COORDINATOR')
  @Get('by-class/:classId')
  findByClass(
    @ActiveSchool() schoolId: string,
    @Param('classId') classId: string
  ) {
    return this.sectionsService.findByClass(schoolId, classId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id')
  update(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
    @CurrentUser() user: any
  ) {
    return this.sectionsService.update(schoolId, id, dto, user.id);
  }
}
