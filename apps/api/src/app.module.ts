import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { AuditModule } from "./audit/audit.module";
import { SchoolsModule } from "./schools/schools.module";
import { StudentsModule } from "./students/students.module";
import { TeachersModule } from "./teachers/teachers.module";
import { GuardiansModule } from "./guardians/guardians.module";
import { StaffModule } from "./staff/staff.module";
import { AcademicsModule } from "./academics/academics.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { AssessmentsModule } from "./assessments/assessments.module";
import { GradingModule } from "./grading/grading.module";
import { ResultsModule } from "./results/results.module";
import { FinanceModule } from "./finance/finance.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { LibraryModule } from "./library/library.module";
import { TransportModule } from "./transport/transport.module";
import { RedisModule } from "./redis/redis.module";
import { CommunicationModule } from "./communication/communication.module";
import { MessagesModule } from "./messages/messages.module";
import { SuperAdminModule } from "./super-admin/super-admin.module";
import { HRModule } from "./hr/hr.module";
import { SettingsModule } from "./settings/settings.module";
import { SecurityModule } from "./security/security.module";
import { AdmissionsModule } from "./admissions/admissions.module";
import { TimetableModule } from "./timetable/timetable.module";
import { WorkflowModule } from "./workflow/workflow.module";
import { ReportingModule } from "./reporting/reporting.module";
import { BullModule } from "@nestjs/bullmq";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { SecurityHeadersMiddleware } from "./common/middleware/security-headers.middleware";
import { SessionInterceptor } from "./security/interceptors/session.interceptor";
import { NestModule, MiddlewareConsumer } from "@nestjs/common";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    SchoolsModule,
    StudentsModule,
    TeachersModule,
    GuardiansModule,
    StaffModule,
    AcademicsModule,
    EnrollmentsModule,
    AttendanceModule,
    AssessmentsModule,
    GradingModule,
    ResultsModule,
    FinanceModule,
    NotificationsModule,
    SubscriptionsModule,
    LibraryModule,
    TransportModule,
    HRModule,
    AdmissionsModule,
    TimetableModule,
    WorkflowModule,
    ReportingModule,
    RedisModule,
    CommunicationModule,
    MessagesModule,
    SuperAdminModule,
    SettingsModule,
    SecurityModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SessionInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware).forRoutes("*");
  }
}
