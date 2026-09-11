import { Controller, Post, Body } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';

@Controller('public/schools')
export class PublicSchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post('register')
  async register(@Body() dto: CreateSchoolDto) {
    // In a real public registration, we might not have an actorId yet
    // or we use a system user ID.
    return this.schoolsService.create(dto, 'SYSTEM');
  }
}
