import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OutboxService } from '../workflow/events/outbox.service';
import { DomainEvent } from '../workflow/events/domain-event';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private outbox: OutboxService,
    private settings: SettingsService,
  ) {}

  async create(schoolId: string, dto: any, actorId: string) {
    const employeeId = dto.employeeId || await this.settings.generateNextNumber(schoolId, 'STAFF');

    const existing = await this.prisma.staff.findFirst({
      where: { schoolId, employeeId },
    });
    if (existing) throw new ConflictException('Employee ID already exists');

    const staff = await this.prisma.staff.create({
      data: { ...dto, employeeId, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'STAFF_CREATED',
      module: 'STAFF',
      resourceId: staff.id,
    });

    await this.outbox.dispatch(
      new DomainEvent(
        'STAFF_CREATED',
        'STAFF',
        staff.id,
        { staffId: staff.id, employeeId: staff.employeeId },
        schoolId,
        actorId
      )
    );

    return staff;
  }

  async findAll(schoolId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, search } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      schoolId,
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastName: 'asc' },
        include: {
          user: {
            select: { email: true, isActive: true }
          }
        }
      }),
      this.prisma.staff.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(schoolId: string, id: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, schoolId },
      include: { user: true, department: true, position: true }
    });
    if (!staff) {
      // Try teacher
      const teacher = await this.prisma.teacher.findFirst({
        where: { id, schoolId },
        include: { user: true, department: true, position: true }
      });
      if (!teacher) throw new NotFoundException('Employee not found');
      return teacher;
    }
    return staff;
  }

  async findMe(schoolId: string, userId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { userId, schoolId },
      include: { user: true, department: true, position: true }
    });
    if (!staff) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, schoolId },
        include: { user: true, department: true, position: true }
      });
      if (!teacher) throw new NotFoundException('Staff profile not found');
      return teacher;
    }
    return staff;
  }
}
