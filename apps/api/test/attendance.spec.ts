import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AttendanceService } from '../src/attendance/attendance.service';
import { AppModule } from '../src/app.module';

describe('Attendance Management (Integration)', () => {
  let app: INestApplication;
  let attendanceService: AttendanceService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    attendanceService = app.get<AttendanceService>(AttendanceService);
    await app.init();
  });

  it('should verify attendance service is available', () => {
    expect(attendanceService).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
