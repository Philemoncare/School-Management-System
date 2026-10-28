import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('public/schools')
export class PublicSchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post('register')
  async register(@Body() dto: CreateSchoolDto, @CurrentUser() user: any) {
    return this.schoolsService.create(dto, user.id);
  }
}
