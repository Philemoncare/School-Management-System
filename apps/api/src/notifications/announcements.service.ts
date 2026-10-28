import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnnouncementStatus,
  AudienceType,
  NotificationPriority,
  NotificationStatus,
} from '@prisma/client';

interface AnnouncementInput {
  title?: string;
  content?: string;
  priority?: NotificationPriority;
  status?: AnnouncementStatus;
  publishAt?: string | Date | null;
  expiresAt?: string | Date | null;
  audienceType?: AudienceType;
  audienceTypes?: AudienceType[];
  classId?: string | null;
  sectionId?: string | null;
  roleId?: string | null;
  studentId?: string | null;
}

@Injectable()
export class AnnouncementsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnnouncementsService.name);
  private timer?: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    // Redis is optional in this deployment, so scheduled publishing cannot rely
    // on the BullMQ queue. A lightweight in-process sweeper keeps scheduled
    // announcements honest even in degraded mode. The atomic status update below
    // prevents duplicate notifications when several API instances are running.
    this.timer = setInterval(() => {
      this.processDueAnnouncements().catch((error) =>
        this.logger.warn(`Announcement scheduler failed: ${error?.message || error}`),
      );
    }, 60_000);
    this.timer.unref?.();
    this.processDueAnnouncements().catch(() => undefined);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async processDueAnnouncements() {
    const now = new Date();

    const due = await this.prisma.announcement.findMany({
      where: { status: AnnouncementStatus.SCHEDULED, publishAt: { lte: now } },
      take: 50,
    });

    for (const scheduled of due) {
      const claimed = await this.prisma.announcement.updateMany({
        where: { id: scheduled.id, status: AnnouncementStatus.SCHEDULED },
        data: { status: AnnouncementStatus.PUBLISHED },
      });
      if (claimed.count === 0) continue;

      const announcement = await this.prisma.announcement.findUnique({
        where: { id: scheduled.id },
        include: { audiences: true },
      });
      if (announcement) await this.triggerNotifications(announcement);
    }

    await this.prisma.announcement.updateMany({
      where: { status: AnnouncementStatus.PUBLISHED, expiresAt: { lte: now } },
      data: { status: AnnouncementStatus.EXPIRED },
    });
  }

  async create(schoolId: string, authorId: string, dto: AnnouncementInput) {
    const title = String(dto?.title || '').trim();
    const content = String(dto?.content || '').trim();
    if (!title) throw new BadRequestException('Announcement title is required.');
    if (!content) throw new BadRequestException('Announcement content is required.');

    const publishAt = this.toDate(dto.publishAt);
    const expiresAt = this.toDate(dto.expiresAt);
    if (publishAt && expiresAt && expiresAt <= publishAt) {
      throw new BadRequestException('Expiry must be after the publish date.');
    }

    let status = dto.status || AnnouncementStatus.DRAFT;
    if (status === AnnouncementStatus.PUBLISHED && publishAt && publishAt > new Date()) {
      status = AnnouncementStatus.SCHEDULED;
    }

    const audienceTypes = this.resolveAudienceTypes(dto);
    if (audienceTypes.length === 0) {
      throw new BadRequestException('Select at least one audience.');
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        schoolId,
        authorId,
        title,
        content,
        priority: dto.priority || NotificationPriority.NORMAL,
        status,
        publishAt: status === AnnouncementStatus.PUBLISHED ? new Date() : publishAt,
        expiresAt,
        audiences: {
          create: audienceTypes.map((audienceType) => ({
            audienceType,
            classId: audienceType === AudienceType.CLASS ? dto.classId || null : null,
            sectionId: audienceType === AudienceType.SECTION ? dto.sectionId || null : null,
            roleId: audienceType === AudienceType.ROLE ? dto.roleId || null : null,
            studentId: audienceType === AudienceType.SECTION ? dto.studentId || null : null,
          })),
        },
      },
      include: { author: { select: { id: true, firstName: true, lastName: true, email: true } }, audiences: true },
    });

    if (announcement.status === AnnouncementStatus.PUBLISHED) {
      await this.triggerNotifications(announcement);
    }

    return announcement;
  }

  async findAll(schoolId: string, audienceType?: AudienceType, status?: AnnouncementStatus) {
    return this.prisma.announcement.findMany({
      where: {
        schoolId,
        ...(status ? { status } : {}),
        ...(audienceType ? { audiences: { some: { audienceType } } } : {}),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        audiences: true,
        _count: { select: { notifications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(schoolId: string, id: string, dto: AnnouncementInput) {
    const existing = await this.prisma.announcement.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Announcement not found');
    if (existing.status === AnnouncementStatus.PUBLISHED) {
      throw new BadRequestException('Published announcements cannot be edited. Cancel and create a new announcement instead.');
    }

    const data: any = {};
    if (dto.title !== undefined) {
      const title = String(dto.title).trim();
      if (!title) throw new BadRequestException('Announcement title is required.');
      data.title = title;
    }
    if (dto.content !== undefined) {
      const content = String(dto.content).trim();
      if (!content) throw new BadRequestException('Announcement content is required.');
      data.content = content;
    }
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.publishAt !== undefined) data.publishAt = this.toDate(dto.publishAt);
    if (dto.expiresAt !== undefined) data.expiresAt = this.toDate(dto.expiresAt);

    if (dto.audienceTypes || dto.audienceType) {
      const audienceTypes = this.resolveAudienceTypes(dto);
      if (audienceTypes.length === 0) {
        throw new BadRequestException('Select at least one audience.');
      }
      await this.prisma.announcementAudience.deleteMany({ where: { announcementId: id } });
      data.audiences = {
        create: audienceTypes.map((audienceType) => ({
          audienceType,
          classId: audienceType === AudienceType.CLASS ? dto.classId || null : null,
          sectionId: audienceType === AudienceType.SECTION ? dto.sectionId || null : null,
          roleId: audienceType === AudienceType.ROLE ? dto.roleId || null : null,
          studentId: audienceType === AudienceType.SECTION ? dto.studentId || null : null,
        })),
      };
    }

    return this.prisma.announcement.update({
      where: { id },
      data,
      include: { author: { select: { id: true, firstName: true, lastName: true, email: true } }, audiences: true },
    });
  }

  async publish(schoolId: string, id: string) {
    const existing = await this.prisma.announcement.findFirst({
      where: { id, schoolId },
      include: { audiences: true },
    });
    if (!existing) throw new NotFoundException('Announcement not found');
    if (existing.status === AnnouncementStatus.PUBLISHED) {
      throw new BadRequestException('This announcement is already published.');
    }
    if (existing.status === AnnouncementStatus.CANCELLED || existing.status === AnnouncementStatus.EXPIRED) {
      throw new BadRequestException('Cancelled or expired announcements cannot be published.');
    }

    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: { status: AnnouncementStatus.PUBLISHED, publishAt: new Date() },
      include: { audiences: true, author: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    const delivered = await this.triggerNotifications(announcement);
    return { ...announcement, deliveredCount: delivered };
  }

  async cancel(schoolId: string, id: string) {
    const existing = await this.prisma.announcement.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Announcement not found');
    if (existing.status === AnnouncementStatus.CANCELLED) {
      throw new BadRequestException('This announcement is already cancelled.');
    }
    return this.prisma.announcement.update({
      where: { id },
      data: { status: AnnouncementStatus.CANCELLED },
    });
  }

  async remove(schoolId: string, id: string) {
    const existing = await this.prisma.announcement.findFirst({ where: { id, schoolId } });
    if (!existing) throw new NotFoundException('Announcement not found');
    if (existing.status === AnnouncementStatus.PUBLISHED) {
      throw new BadRequestException('Published announcements cannot be deleted. Cancel it instead.');
    }
    await this.prisma.notification.deleteMany({ where: { announcementId: id } });
    await this.prisma.announcementAudience.deleteMany({ where: { announcementId: id } });
    await this.prisma.announcement.delete({ where: { id } });
    return { deleted: true };
  }

  private resolveAudienceTypes(dto: AnnouncementInput): AudienceType[] {
    const raw =
      dto.audienceTypes && Array.isArray(dto.audienceTypes) && dto.audienceTypes.length > 0
        ? dto.audienceTypes
        : dto.audienceType
          ? [dto.audienceType]
          : [];
    const allowed = new Set(Object.values(AudienceType) as string[]);
    return Array.from(new Set(raw.filter((value): value is AudienceType => allowed.has(String(value)))));
  }

  private toDate(value?: string | Date | null): Date | null {
    if (value === undefined || value === null || value === '') return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date supplied.');
    return date;
  }

  /**
   * Resolve the audience rows to real user ids and create in-app notifications.
   * Returns the number of users notified. No queue is required, so publishing
   * works in the same degraded-mode environments as the rest of the app.
   */
  private async triggerNotifications(announcement: any): Promise<number> {
    const audiences: any[] = Array.isArray(announcement.audiences) ? announcement.audiences : [];
    const userIds = new Set<string>();

    const add = (id?: string | null) => {
      if (id) userIds.add(id);
    };

    for (const audience of audiences) {
      switch (audience.audienceType) {
        case AudienceType.ALL: {
          const members = await this.prisma.schoolMembership.findMany({
            where: { schoolId: announcement.schoolId, status: 'ACTIVE' },
            select: { userId: true },
          });
          members.forEach((member) => add(member.userId));
          break;
        }
        case AudienceType.TEACHERS:
        case AudienceType.STAFF:
        case AudienceType.ROLE: {
          const roleNames =
            audience.audienceType === AudienceType.TEACHERS
              ? ['TEACHER']
              : audience.audienceType === AudienceType.STAFF
                ? ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT', 'LIBRARIAN', 'STAFF', 'HR_MANAGER', 'NURSE', 'RECEPTIONIST']
                : [];
          const assignments = await this.prisma.userRole.findMany({
            where: {
              user: { memberships: { some: { schoolId: announcement.schoolId, status: 'ACTIVE' } } },
              ...(audience.audienceType === AudienceType.ROLE
                ? { roleId: audience.roleId || undefined }
                : {
                    role: {
                      name: { in: roleNames },
                      OR: [{ schoolId: announcement.schoolId }, { schoolId: null }],
                    },
                  }),
            },
            select: { userId: true },
          });
          assignments.forEach((assignment) => add(assignment.userId));
          break;
        }
        case AudienceType.STUDENTS: {
          const students = await this.prisma.student.findMany({
            where: { schoolId: announcement.schoolId, status: 'ACTIVE', userId: { not: null } },
            select: { userId: true },
          });
          students.forEach((student) => add(student.userId));
          break;
        }
        case AudienceType.PARENTS: {
          const links = await this.prisma.studentGuardian.findMany({
            where: { student: { schoolId: announcement.schoolId, status: 'ACTIVE' } },
            select: { guardian: { select: { userId: true } } },
          });
          links.forEach((link) => add(link.guardian?.userId));
          break;
        }
        case AudienceType.CLASS:
        case AudienceType.SECTION: {
          const enrollments = await this.prisma.enrollment.findMany({
            where: {
              schoolId: announcement.schoolId,
              status: 'ACTIVE',
              ...(audience.classId ? { classId: audience.classId } : {}),
              ...(audience.sectionId ? { sectionId: audience.sectionId } : {}),
            },
            select: {
              student: {
                select: {
                  userId: true,
                  guardians: { select: { guardian: { select: { userId: true } } } },
                },
              },
            },
          });
          for (const enrollment of enrollments) {
            add(enrollment.student?.userId);
            (enrollment.student?.guardians || []).forEach((link) => add(link.guardian?.userId));
          }
          break;
        }
        case AudienceType.TRANSPORT_GROUP: {
          const assignments = await this.prisma.transportAssignment.findMany({
            where: { student: { schoolId: announcement.schoolId }, status: 'ACTIVE' },
            select: { student: { select: { userId: true } } },
          });
          assignments.forEach((assignment) => add(assignment.student?.userId));
          break;
        }
        case AudienceType.LIBRARY_MEMBERS: {
          const memberships = await this.prisma.libraryMembership.findMany({
            where: { schoolId: announcement.schoolId, status: 'ACTIVE' },
            select: { userId: true },
          });
          memberships.forEach((membership) => add(membership.userId));
          break;
        }
        default:
          break;
      }
    }

    add(announcement.authorId);

    const activeUsers =
      userIds.size > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: Array.from(userIds) }, isActive: true },
            select: { id: true },
          })
        : [];

    if (activeUsers.length === 0) return 0;

    await this.prisma.notification.createMany({
      data: activeUsers.map((user) => ({
        schoolId: announcement.schoolId,
        userId: user.id,
        notificationType: 'ANNOUNCEMENT',
        announcementId: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority || NotificationPriority.NORMAL,
        status: NotificationStatus.SENT,
      })),
    });

    return activeUsers.length;
  }
}
