import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TeacherDocumentService } from './teacher-document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('teachers/:teacherId/documents')
export class TeacherDocumentController {
  constructor(private readonly service: TeacherDocumentService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'TEACHER')
  @Get()
  findAll(
    @ActiveSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
    @Query('category') category?: string,
  ) {
    return this.service.findAll(schoolId, teacherId, category);
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
  upload(
    @ActiveSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.service.upload(schoolId, teacherId, dto, user.id);
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
