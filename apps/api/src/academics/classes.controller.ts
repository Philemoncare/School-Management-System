import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PromotionService } from './promotion.service';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('classes')
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly promotionService: PromotionService,
  ) {}

  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR')
  @Post(':id/promote')
  promote(
    @ActiveSchool() schoolId: string,
    @Body() dto: any,
    @CurrentUser() user: any
  ) {
    return this.promotionService.promoteStudent(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateClassDto,
    @CurrentUser() user: any
  ) {
    return this.classesService.create(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'RECEPTIONIST')
  @Get()
  findAll(@ActiveSchool() schoolId: string) {
    return this.classesService.findAll(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get(':id')
  findOne(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.classesService.findOne(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id')
  update(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
    @CurrentUser() user: any
  ) {
    return this.classesService.update(schoolId, id, dto, user.id);
  }
}
