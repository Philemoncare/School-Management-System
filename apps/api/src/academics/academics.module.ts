import { Module } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { AcademicYearsController } from './academic-years.controller';
import { TermsService } from './terms.service';
import { TermsController } from './terms.controller';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { SectionsService } from './sections.service';
import { SectionsController } from './sections.controller';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { ClassSubjectsService } from './class-subjects.service';
import { ClassSubjectsController } from './class-subjects.controller';
import { PromotionService } from './promotion.service';

@Module({
  controllers: [
    AcademicYearsController,
    TermsController,
    ClassesController,
    SectionsController,
    SubjectsController,
    ClassSubjectsController,
  ],
  providers: [
    AcademicYearsService,
    TermsService,
    ClassesService,
    SectionsService,
    SubjectsService,
    ClassSubjectsService,
    PromotionService,
  ],
  exports: [
    AcademicYearsService,
    TermsService,
    ClassesService,
    SectionsService,
    SubjectsService,
    ClassSubjectsService,
    PromotionService,
  ],
})
export class AcademicsModule {}
