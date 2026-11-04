import { BadRequestException } from '@nestjs/common';
import { StaffService } from '../src/staff/staff.service';

/**
 * Unit tests for the standard staff data structure. These verify the root
 * cause of the "staff information does not tally" defect: fields collected at
 * registration must be normalised, mapped to the staff row, and reflected in
 * the returned profile with an accurate completion status and an independent
 * login-account status.
 */
describe('StaffService data integrity (unit)', () => {
  let prisma: any;
  let audit: any;
  let outbox: any;
  let settings: any;
  let service: StaffService;

  beforeEach(() => {
    prisma = {
      staff: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(async ({ data }: any) => ({
          id: 'staff-1',
          ...data,
          user: null,
          department: null,
          position: null,
        })),
        update: jest.fn(async ({ data }: any) => ({
          id: 'staff-1',
          employeeId: 'STA-1',
          user: null,
          department: null,
          position: null,
          ...data,
        })),
      },
      department: { findFirst: jest.fn().mockResolvedValue(null) },
      position: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };
    outbox = { dispatch: jest.fn().mockResolvedValue(undefined) };
    settings = { generateNextNumber: jest.fn().mockResolvedValue('STA-2026-000007') };
    service = new StaffService(prisma, audit, outbox, settings);
  });

  it('maps and normalises contact + employment fields onto the staff row', async () => {
    const dto: any = {
      firstName: '  Philemon ',
      lastName: 'Melabah ',
      email: '  PH@School.EDU ',
      phone: ' +233 123 456 ',
      gender: 'male',
      employmentType: 'full time',
      dateOfBirth: '1990-05-01',
      commencementDate: '2020-09-01',
      status: 'ACTIVE',
    };

    const result = await service.create('school-1', dto, 'actor-1');

    const createdData = prisma.staff.create.mock.calls[0][0].data;
    expect(createdData.email).toBe('ph@school.edu'); // trimmed + lowercased
    expect(createdData.phone).toBe('+233 123 456'); // trimmed
    expect(createdData.gender).toBe('MALE'); // standardised
    expect(createdData.employmentType).toBe('FULL_TIME'); // standardised
    expect(createdData.dateOfBirth).toBeInstanceOf(Date);
    expect(createdData.commencementDate).toBeInstanceOf(Date);

    // Returned profile carries independent statuses.
    expect(result.accountStatus).toBe('NOT_CREATED');
    expect(result.completion).toBeDefined();
    expect(result.completion.complete).toBe(false);
    expect(result.completion.missingFields).toEqual(
      expect.arrayContaining(['Department', 'Position']),
    );
  });

  it('rejects an unknown gender value instead of storing inconsistent data', async () => {
    const dto: any = { firstName: 'A', lastName: 'B', gender: 'unknown' };
    await expect(service.create('school-1', dto, 'actor-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('does not let an incomplete record be reported as complete', async () => {
    const minimal: any = { firstName: 'A', lastName: 'B' };
    const result = await service.create('school-1', minimal, 'actor-1');
    expect(result.completion.complete).toBe(false);
    expect(result.completion.percent).toBeLessThan(100);
  });

  it('applies partial updates and clears a blanked text field to null', async () => {
    prisma.staff.findFirst.mockResolvedValueOnce({ id: 'staff-1', employeeId: 'STA-1' });
    prisma.staff.update.mockImplementation(async ({ data }: any) => ({
      id: 'staff-1',
      employeeId: 'STA-1',
      user: null,
      ...data,
    }));

    await service.update('school-1', 'staff-1', { phone: '   ' } as any, 'actor-1');

    const updatedData = prisma.staff.update.mock.calls[0][0].data;
    expect('phone' in updatedData).toBe(true);
    expect(updatedData.phone).toBeNull();
    // Fields not present in the payload must not be touched.
    expect('email' in updatedData).toBe(false);
    expect('employmentType' in updatedData).toBe(false);
  });

  it('reports an ACTIVE account status when a linked, active user exists', async () => {
    prisma.staff.findFirst.mockResolvedValueOnce({ id: 'staff-1', employeeId: 'STA-1' });
    prisma.staff.update.mockImplementation(async ({ data }: any) => ({
      id: 'staff-1',
      employeeId: 'STA-1',
      user: { email: 'x@y.z', isActive: true },
      ...data,
    }));

    const result = await service.update('school-1', 'staff-1', { firstName: 'Zed' } as any, 'actor-1');
    // Employment status and account status remain independent.
    expect(result.accountStatus).toBe('ACTIVE');
  });
});
