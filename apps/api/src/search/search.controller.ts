import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { GlobalSearchDto, AdvancedSearchDto, SaveSearchDto } from './dto/search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SearchableEntityType } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  globalSearch(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query() dto: GlobalSearchDto,
  ) {
    return this.searchService.globalSearch(schoolId, user.id, user.roles || [], dto);
  }

  @Get('suggestions')
  suggest(
    @ActiveSchool() schoolId: string,
    @Query('q') q: string,
  ) {
    return this.searchService.suggest(schoolId, q);
  }

  @Get('recent')
  getRecent(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
  ) {
    return this.searchService.getRecentSearches(schoolId, user.id);
  }

  @Roles('SUPER_ADMIN')
  @Get('platform')
  platformSearch(
    @CurrentUser() user: any,
    @Query() dto: GlobalSearchDto,
  ) {
    return this.searchService.platformSearch(user.roles || [], dto);
  }

  @Get('advanced')
  advancedSearch(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query() dto: AdvancedSearchDto,
  ) {
    return this.searchService.advancedSearch(schoolId, user.id, user.roles || [], dto);
  }

  @Post('saved')
  saveSearch(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: SaveSearchDto,
  ) {
    return this.searchService.saveSearch(schoolId, user.id, dto);
  }

  @Get('saved')
  getSaved(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
  ) {
    return this.searchService.getSavedSearches(schoolId, user.id);
  }

  @Get('commands')
  getCommands(@CurrentUser() user: any) {
    return this.searchService.getCommands(user.id, user.roles || []);
  }

  @Get('actions/:type/:id')
  getQuickActions(
    @Param('type') type: SearchableEntityType,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.searchService.getQuickActions(type, id, user.roles || []);
  }

  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Post('reindex')
  async reindex(@ActiveSchool() schoolId: string) {
    this.searchService.reindexSchool(schoolId);
    return { message: 'Reindexing triggered' };
  }
}
