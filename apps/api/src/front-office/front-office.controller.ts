import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch } from '@nestjs/common';
import { FrontOfficeService } from './front-office.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';

@Controller('front-office')
@UseGuards(JwtAuthGuard, TenantGuard)
export class FrontOfficeController {
  constructor(private readonly frontOfficeService: FrontOfficeService) {}

  @Get('dashboard')
  getDashboard(@ActiveSchool() schoolId: string) {
    return this.frontOfficeService.getDashboard(schoolId);
  }

  // --- VISITORS ---
  @Post('visitors')
  registerVisitor(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.frontOfficeService.registerVisitor(schoolId, dto, user.id);
  }

  @Get('visitors')
  getVisitors(@ActiveSchool() schoolId: string) {
    return this.frontOfficeService.getVisitors(schoolId);
  }

  @Post('visitors/check-in')
  checkInVisitor(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.frontOfficeService.checkInVisitor(schoolId, dto, user.id);
  }

  @Patch('visitors/check-out/:id')
  checkOutVisitor(@ActiveSchool() schoolId: string, @Param('id') visitId: string, @CurrentUser() user: any) {
    return this.frontOfficeService.checkOutVisitor(schoolId, visitId, user.id);
  }

  @Get('visitors/current')
  getCurrentOnCampus(@ActiveSchool() schoolId: string) {
    return this.frontOfficeService.getCurrentOnCampus(schoolId);
  }

  // --- APPOINTMENTS ---
  @Post('appointments')
  createAppointment(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.frontOfficeService.createAppointment(schoolId, dto, user.id);
  }

  @Get('appointments')
  getAppointments(@ActiveSchool() schoolId: string) {
    return this.frontOfficeService.getAppointments(schoolId);
  }

  // --- ENQUIRIES ---
  @Post('enquiries')
  createEnquiry(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.frontOfficeService.createEnquiry(schoolId, dto, user.id);
  }

  @Get('enquiries')
  getEnquiries(@ActiveSchool() schoolId: string) {
    return this.frontOfficeService.getEnquiries(schoolId);
  }

  @Patch('enquiries/:id/resolve')
  resolveEnquiry(@ActiveSchool() schoolId: string, @Param('id') id: string, @Body('resolution') resolution: string, @CurrentUser() user: any) {
    return this.frontOfficeService.resolveEnquiry(schoolId, id, resolution, user.id);
  }

  // --- STUDENT LOOKUP & CHECKOUT ---
  @Get('students/search')
  lookupStudent(@ActiveSchool() schoolId: string, @Query('q') query: string) {
    return this.frontOfficeService.lookupStudent(schoolId, query || '');
  }

  @Post('students/checkout')
  requestStudentCheckout(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.frontOfficeService.requestStudentCheckout(schoolId, dto, user.id);
  }

  @Get('students/checkouts')
  getStudentCheckouts(@ActiveSchool() schoolId: string) {
    return this.frontOfficeService.getStudentCheckouts(schoolId);
  }

  // --- LATE ARRIVALS ---
  @Post('students/late-arrival')
  recordLateArrival(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.frontOfficeService.recordLateArrival(schoolId, dto, user.id);
  }

  @Get('students/late-arrivals')
  getLateArrivals(@ActiveSchool() schoolId: string) {
    return this.frontOfficeService.getLateArrivals(schoolId);
  }

  // --- DELIVERIES ---
  @Post('deliveries')
  recordDelivery(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.frontOfficeService.recordDelivery(schoolId, dto, user.id);
  }

  @Get('deliveries')
  getDeliveries(@ActiveSchool() schoolId: string) {
    return this.frontOfficeService.getDeliveries(schoolId);
  }

  // --- LOST & FOUND ---
  @Post('lost-found')
  recordLostFoundItem(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.frontOfficeService.recordLostFoundItem(schoolId, dto, user.id);
  }

  @Get('lost-found')
  getLostFoundItems(@ActiveSchool() schoolId: string) {
    return this.frontOfficeService.getLostFoundItems(schoolId);
  }

  @Patch('lost-found/:id/claim')
  claimLostFoundItem(@ActiveSchool() schoolId: string, @Param('id') id: string, @Body('claimantName') claimantName: string, @CurrentUser() user: any) {
    return this.frontOfficeService.claimLostFoundItem(schoolId, id, claimantName, user.id);
  }
}
