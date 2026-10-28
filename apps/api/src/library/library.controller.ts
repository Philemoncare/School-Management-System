import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateBookDto,
  CreateBookCopyDto,
  IssueBookDto,
  ReturnBookDto,
  CreateCategoryDto,
  CreateAuthorDto,
  CreatePublisherDto,
  CreateLocationDto,
  UpdateCategoryDto,
  UpdateAuthorDto,
  UpdatePublisherDto,
  UpdateLocationDto,
} from './dto/library.dto';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Get('dashboard')
  getDashboard(@ActiveSchool() schoolId: string) {
    return this.libraryService.getDashboardMetrics(schoolId);
  }

  // Catalog
  @Get('books')
  getBooks(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.libraryService.findAllBooks(schoolId, filters);
  }

  @Get('books/:id')
  getBook(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.libraryService.findOneBook(schoolId, id);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Post('books')
  createBook(@ActiveSchool() schoolId: string, @Body() dto: CreateBookDto, @CurrentUser() user: any) {
    return this.libraryService.createBook(schoolId, dto, user.id);
  }

  // Copies
  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Post('copies')
  createCopy(@ActiveSchool() schoolId: string, @Body() dto: CreateBookCopyDto, @CurrentUser() user: any) {
    return this.libraryService.createCopy(schoolId, dto, user.id);
  }

  // Circulation
  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Post('loans/issue')
  issueBook(@ActiveSchool() schoolId: string, @Body() dto: IssueBookDto, @CurrentUser() user: any) {
    return this.libraryService.issueBook(schoolId, dto, user.id);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Post('loans/:id/return')
  returnBook(@ActiveSchool() schoolId: string, @Param('id') id: string, @Body() dto: ReturnBookDto, @CurrentUser() user: any) {
    return this.libraryService.returnBook(schoolId, id, dto, user.id);
  }

  @Post('loans/:id/renew')
  renewBook(@ActiveSchool() schoolId: string, @Param('id') id: string, @CurrentUser() user: any) {
    // Both librarian and student can renew if eligible
    return this.libraryService.renewLoan(schoolId, id, user.id);
  }

  @Post('reservations')
  createReservation(@ActiveSchool() schoolId: string, @Body('bookId') bookId: string, @CurrentUser() user: any) {
    return this.libraryService.createReservation(schoolId, user.id, bookId);
  }

  @Get('reservations')
  getReservations(@ActiveSchool() schoolId: string, @Query() filters: any, @CurrentUser() user: any) {
    const userId = user.roles.some((r: string) => ['LIBRARIAN', 'SCHOOL_ADMIN'].includes(r))
      ? undefined
      : user.id;
    return this.libraryService.findAllReservations(schoolId, filters, userId);
  }

  @Post('reservations/:id/cancel')
  cancelReservation(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.libraryService.cancelReservation(schoolId, id);
  }

  @Get('fines')
  getFines(@ActiveSchool() schoolId: string, @Query() filters: any, @CurrentUser() user: any) {
    const userId = user.roles.some((r: string) => ['LIBRARIAN', 'SCHOOL_ADMIN'].includes(r))
      ? undefined
      : user.id;
    return this.libraryService.findAllFines(schoolId, filters, userId);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Post('members')
  registerMember(@ActiveSchool() schoolId: string, @Body('userId') userId: string, @CurrentUser() user: any) {
    return this.libraryService.registerMember(schoolId, userId, user.id);
  }

  @Get('loans')
  getLoans(@ActiveSchool() schoolId: string, @Query() filters: any, @CurrentUser() user: any) {
    // If not a librarian/admin, only show own loans
    const userId = user.roles.some((r: string) => ['LIBRARIAN', 'SCHOOL_ADMIN'].includes(r))
      ? undefined
      : user.id;
    return this.libraryService.findAllLoans(schoolId, filters, userId);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Get('members')
  getMembers(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.libraryService.findAllMembers(schoolId, filters);
  }

  // Lookups & Config
  @Get('categories')
  getCategories(@ActiveSchool() schoolId: string) {
    return this.libraryService.findCategories(schoolId);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Post('categories')
  createCategory(@ActiveSchool() schoolId: string, @Body() dto: CreateCategoryDto) {
    return this.libraryService.createCategory(schoolId, dto);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Patch('categories/:id')
  updateCategory(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.libraryService.updateCategory(schoolId, id, dto);
  }

  @Get('authors')
  getAuthors(@ActiveSchool() schoolId: string) {
    return this.libraryService.findAuthors(schoolId);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Post('authors')
  createAuthor(@ActiveSchool() schoolId: string, @Body() dto: CreateAuthorDto) {
    return this.libraryService.createAuthor(schoolId, dto);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Patch('authors/:id')
  updateAuthor(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAuthorDto,
  ) {
    return this.libraryService.updateAuthor(schoolId, id, dto);
  }

  @Get('publishers')
  getPublishers(@ActiveSchool() schoolId: string) {
    return this.libraryService.findPublishers(schoolId);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Post('publishers')
  createPublisher(@ActiveSchool() schoolId: string, @Body() dto: CreatePublisherDto) {
    return this.libraryService.createPublisher(schoolId, dto);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Patch('publishers/:id')
  updatePublisher(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePublisherDto,
  ) {
    return this.libraryService.updatePublisher(schoolId, id, dto);
  }

  @Get('locations')
  getLocations(@ActiveSchool() schoolId: string) {
    return this.libraryService.findLocations(schoolId);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Post('locations')
  createLocation(@ActiveSchool() schoolId: string, @Body() dto: CreateLocationDto) {
    return this.libraryService.createLocation(schoolId, dto);
  }

  @Roles('LIBRARIAN', 'SCHOOL_ADMIN')
  @Patch('locations/:id')
  updateLocation(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.libraryService.updateLocation(schoolId, id, dto);
  }
}
