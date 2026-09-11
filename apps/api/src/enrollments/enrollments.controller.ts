import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto, MoveStudentDto } from './dto/enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post()
  enroll(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateEnrollmentDto,
    @CurrentUser() user: any
  ) {
    return this.enrollmentsService.enroll(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get()
  findAll(@ActiveSchool() schoolId: string) {
    return this.enrollmentsService.findBySchool(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('student/:studentId')
  findStudentHistory(
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string
  ) {
    return this.enrollmentsService.findStudentHistory(schoolId, studentId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id/move')
  move(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: MoveStudentDto,
    @CurrentUser() user: any
  ) {
    return this.enrollmentsService.move(schoolId, id, dto, user.id);
  }
}
