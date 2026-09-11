import { Module } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SchoolDashboardService } from './school-dashboard.service';
import { SchoolSearchService } from './school-search.service';
import { SchoolsController } from './schools.controller';
import { SchoolProfileController } from './school-profile.controller';
import { SchoolDashboardController } from './school-dashboard.controller';
import { SchoolSearchController } from './school-search.controller';
import { MembershipsController } from './memberships.controller';
import { PublicSchoolsController } from './public-schools.controller';

@Module({
  controllers: [
    SchoolsController,
    SchoolProfileController,
    SchoolDashboardController,
    SchoolSearchController,
    MembershipsController,
    PublicSchoolsController
  ],
  providers: [SchoolsService, SchoolDashboardService, SchoolSearchService],
  exports: [SchoolsService, SchoolDashboardService, SchoolSearchService],
})
export class SchoolsModule {}
