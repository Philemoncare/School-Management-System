import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SchoolSearchService } from './school-search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('schools/search')
export class SchoolSearchController {
  constructor(private readonly searchService: SchoolSearchService) {}

  @Get()
  search(@ActiveSchool() schoolId: string, @Query('q') query: string) {
    return this.searchService.globalSearch(schoolId, query);
  }
}
