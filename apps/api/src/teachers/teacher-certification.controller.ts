import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TeacherCertificationService } from './teacher-certification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTeacherCertificationDto } from './dto/teacher-certification.dto';
import { UpdateTeacherCertificationDto } from './dto/teacher-certification.dto';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('teachers/:teacherId/certifications')
export class TeacherCertificationController {
  constructor(private readonly service: TeacherCertificationService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'TEACHER')
  @Get()
  findAll(
    @ActiveSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
    @Query('verificationStatus') verificationStatus?: string,
  ) {
    return this.service.findAll(schoolId, teacherId, verificationStatus);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'TEACHER')
  @Get(':id')
  findOne(
    @ActiveSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(schoolId, teacherId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER')
  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
    @Body() dto: CreateTeacherCertificationDto,
    @CurrentUser() user: any,
  ) {
    return this.service.create(schoolId, teacherId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER')
  @Patch(':id')
  update(
    @ActiveSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeacherCertificationDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(schoolId, teacherId, id, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER')
  @Delete(':id')
  remove(
    @ActiveSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.remove(schoolId, teacherId, id, user.id);
  }
}
