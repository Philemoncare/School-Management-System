import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto, UpdateSchoolStatusDto } from './dto/update-school.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Roles('SUPER_ADMIN')
  @Post()
  create(@Body() createSchoolDto: CreateSchoolDto, @CurrentUser() user: any) {
    return this.schoolsService.create(createSchoolDto, user.id);
  }

  @Roles('SUPER_ADMIN')
  @Get()
  findAll() {
    return this.schoolsService.findAll();
  }

  @Roles('SUPER_ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Roles('SUPER_ADMIN')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolStatusDto,
    @CurrentUser() user: any
  ) {
    return this.schoolsService.updateStatus(id, dto, user.id);
  }
}
