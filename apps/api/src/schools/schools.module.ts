import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SchoolsService } from './schools.service';
import { SchoolDashboardService } from './school-dashboard.service';
import { SchoolSearchService } from './school-search.service';
import { SchoolsController } from './schools.controller';
import { SchoolsMeController } from './schools-me.controller';
import { SchoolProfileController } from './school-profile.controller';
import { SchoolDashboardController } from './school-dashboard.controller';
import { SchoolSearchController } from './school-search.controller';
import { MembershipsController } from './memberships.controller';
import { PublicSchoolsController } from './public-schools.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    // Register the literal /schools/me route before the /schools/:id route.
    SchoolsMeController,
    SchoolProfileController,
    SchoolDashboardController,
    SchoolSearchController,
    MembershipsController,
    PublicSchoolsController,
    SchoolsController
  ],
  providers: [SchoolsService, SchoolDashboardService, SchoolSearchService],
  exports: [SchoolsService, SchoolDashboardService, SchoolSearchService],
})
export class SchoolsModule {}
