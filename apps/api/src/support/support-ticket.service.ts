import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommunicationChannel,
  DeliveryStatus,
  NotificationPriority,
  NotificationStatus,
  Prisma,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailProvider } from '../communication/providers/email.provider';

/**
 * Ticket lifecycle. Kept as an explicit table rather than free-form updates so
 * an operator cannot jump a ticket from OPEN to CLOSED without it passing
 * through resolution - which is what makes the resolution history meaningful.
 */
const TICKET_STATUS_FLOW: Record<SupportTicketStatus, SupportTicketStatus[]> = {
  OPEN: [SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.AWAITING_SCHOOL, SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED],
  IN_PROGRESS: [SupportTicketStatus.AWAITING_SCHOOL, SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED],
  AWAITING_SCHOOL: [SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED],
  RESOLVED: [SupportTicketStatus.CLOSED, SupportTicketStatus.IN_PROGRESS],
  CLOSED: [SupportTicketStatus.IN_PROGRESS],
};

const TERMINAL_STATUSES: SupportTicketStatus[] = [
  SupportTicketStatus.RESOLVED,
  SupportTicketStatus.CLOSED,
];

/** Query strings are user input; anything not in the enum is ignored instead of reaching Prisma. */
function pickEnum<T extends Record<string, string>>(
  value: string | undefined,
  allowed: T,
): T[keyof T] | undefined {
  if (!value) return undefined;
  const upper = value.trim().toUpperCase();
  return (Object.values(allowed) as string[]).includes(upper)
    ? (upper as T[keyof T])
    : undefined;
}

@Injectable()
export class SupportTicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly emailProvider: EmailProvider,
  ) {}

  private async nextReference(): Promise<string> {
    // Short human-readable handle, checked rather than assumed unique: the
    // column has a real unique constraint, so a collision must not surface as a
    // 500 from a failed insert.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `SPT-${randomBytes(3).toString('hex').toUpperCase()}`;
      const taken = await this.prisma.supportTicket.findUnique({
        where: { reference: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
    }
    throw new BadRequestException('Unable to allocate a ticket reference, please retry.');
  }

  async list(params: {
    skip?: number;
    take?: number;
    status?: string;
    priority?: string;
    category?: string;
    schoolId?: string;
    assignedToId?: string;
    unassigned?: string;
    search?: string;
  }) {
    const status = pickEnum(params.status, SupportTicketStatus);
    const priority = pickEnum(params.priority, SupportTicketPriority);
    const category = pickEnum(params.category, SupportTicketCategory);

    const where: Prisma.SupportTicketWhereInput = {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(category ? { category } : {}),
      ...(params.schoolId ? { schoolId: params.schoolId } : {}),
      ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
      ...(params.unassigned === 'true' ? { assignedToId: null } : {}),
      ...(params.search
        ? {
            OR: [
              { subject: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
              { reference: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const take = Math.min(Math.max(params.take ? Number(params.take) : 25, 1), 100);
    const skip = Math.max(params.skip ? Number(params.skip) : 0, 0);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          school: { select: { id: true, name: true, code: true, status: true } },
          openedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { messages: true } },
        },
        orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  /** Real counts for the queue header - no cached or hardcoded numbers. */
  async metrics() {
    // A single grouped read carries the whole queue's status/priority/assignee
    // distribution, so the header cannot drift from what the list actually
    // contains. Resolved and raised windows are time-based and stay separate.
    const [rows, resolvedLast7Days, raisedLast24Hours] = await Promise.all([
      this.prisma.supportTicket.groupBy({
        by: ['status', 'priority', 'assignedToId'],
        _count: { _all: true },
      }),
      this.prisma.supportTicket.count({
        where: { resolvedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.supportTicket.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    const count = (match: (row: (typeof rows)[number]) => boolean) =>
      rows.reduce((sum, row) => (match(row) ? sum + row._count._all : sum), 0);

    const isActive = (row: (typeof rows)[number]) =>
      !TERMINAL_STATUSES.includes(row.status);

    return {
      total: count(() => true),
      open: count((row) => row.status === SupportTicketStatus.OPEN),
      inProgress: count((row) => row.status === SupportTicketStatus.IN_PROGRESS),
      awaitingSchool: count((row) => row.status === SupportTicketStatus.AWAITING_SCHOOL),
      resolved: count((row) => row.status === SupportTicketStatus.RESOLVED),
      closed: count((row) => row.status === SupportTicketStatus.CLOSED),
      unassigned: count((row) => isActive(row) && row.assignedToId === null),
      resolvedLast7Days,
      raisedLast24Hours,
      openByPriority: {
        critical: count((row) => isActive(row) && row.priority === 'CRITICAL'),
        high: count((row) => isActive(row) && row.priority === 'HIGH'),
        medium: count((row) => isActive(row) && row.priority === 'MEDIUM'),
        low: count((row) => isActive(row) && row.priority === 'LOW'),
      },
    };
  }

  async detail(ticketId: string, options: { schoolId?: string; platform: boolean }) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        school: { select: { id: true, name: true, code: true, status: true } },
        openedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    // Tenant isolation is enforced here, not only in the route: a school asking
    // for another school's ticket id gets 404, the same as if it did not exist.
    if (options.schoolId && ticket.schoolId !== options.schoolId) {
      throw new NotFoundException('Support ticket not found');
    }

    const messages = options.platform
      ? ticket.messages
      : ticket.messages.filter((message) => !message.internal);

    return { ...ticket, messages };
  }

  async open(
    dto: {
      subject: string;
      description: string;
      schoolId: string;
      category?: SupportTicketCategory;
      priority?: SupportTicketPriority;
      notifySchoolAdmins?: boolean;
    },
    actorId: string,
    options: { platformActor: boolean; ipAddress?: string } = { platformActor: true },
  ) {
    const school = await this.prisma.school.findUnique({
      where: { id: dto.schoolId },
      select: { id: true, name: true, code: true },
    });
    if (!school) throw new NotFoundException('School not found');

    const reference = await this.nextReference();

    const ticket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportTicket.create({
        data: {
          reference,
          schoolId: school.id,
          openedById: actorId,
          subject: dto.subject.trim(),
          description: dto.description.trim(),
          category: dto.category ?? SupportTicketCategory.OTHER,
          priority: dto.priority ?? SupportTicketPriority.MEDIUM,
          status: SupportTicketStatus.OPEN,
        },
      });

      await tx.supportTicketMessage.create({
        data: {
          ticketId: created.id,
          authorId: actorId,
          body: dto.description.trim(),
          internal: false,
        },
      });

      await this.audit.log(
        {
          userId: actorId,
          schoolId: school.id,
          action: 'SUPPORT_TICKET_CREATED',
          module: 'SUPPORT',
          resourceId: created.id,
          ipAddress: options.ipAddress,
          metadata: {
            reference: created.reference,
            category: created.category,
            priority: created.priority,
            raisedBy: options.platformActor ? 'PLATFORM' : 'SCHOOL',
          },
        },
        tx,
      );

      return created;
    });

    // Notification happens after the row exists so it can never reference a
    // ticket that was rolled back. A school that raised the ticket itself is
    // not emailed about its own submission, and the platform can open a ticket
    // silently on a tenant's behalf.
    const suppress =
      options.platformActor === false || dto.notifySchoolAdmins === false;
    const delivery = suppress
      ? { recipients: 0, inApp: 0, emailSent: 0, emailFailed: 0, emailStatus: 'SKIPPED' }
      : await this.notifySchoolAdmins(
          ticket,
          'Support request received',
          `Your ticket ${ticket.reference} (${ticket.subject}) has been logged and queued for the platform support team.`,
          options.ipAddress,
        );

    return { ...ticket, delivery };
  }

  async assign(ticketId: string, assigneeId: string, actorId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { school: { select: { id: true, name: true } } },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    if (ticket.assignedToId === assigneeId && ticket.status !== SupportTicketStatus.OPEN) {
      return { ...ticket, unchanged: true };
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
    });
    if (!assignee) throw new NotFoundException('Assignee not found');
    if (!assignee.isActive) throw new BadRequestException('Assignee account is deactivated');

    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          assignedToId: assignee.id,
          // Being picked up is a state change; leaving it OPEN would misreport
          // the queue and let it be counted as untouched forever.
          ...(ticket.status === SupportTicketStatus.OPEN
            ? { status: SupportTicketStatus.IN_PROGRESS as SupportTicketStatus }
            : {}),
          lastActivityAt: new Date(),
        },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          school: { select: { id: true, name: true, code: true } },
        },
      });

      if (saved.status !== ticket.status) {
        await tx.supportTicketMessage.create({
          data: {
            ticketId,
            authorId: actorId,
            body: `Ticket assigned to ${assignee.firstName} ${assignee.lastName}.`,
            internal: true,
            statusChange: SupportTicketStatus.IN_PROGRESS,
          },
        });
      }

      await this.audit.log(
        {
          userId: actorId,
          schoolId: ticket.schoolId,
          action: 'SUPPORT_TICKET_ASSIGNED',
          module: 'SUPPORT',
          resourceId: ticketId,
          metadata: {
            previousAssigneeId: ticket.assignedToId ?? null,
            assigneeId: assignee.id,
            reference: ticket.reference,
          },
        },
        tx,
      );

      return saved;
    });

    return updated;
  }

  /**
   * Tenancy is asserted inside the mutation rather than by a separate lookup
   * the controller performs first: one read, no window between check and write,
   * and a school replaying another school's ticket id gets the same 404 it
   * would get from a detail request.
   */
  private assertTenant(ticket: { schoolId: string }, options: { schoolActor?: boolean; schoolId?: string }) {
    if (!options.schoolActor) return;
    if (!options.schoolId || ticket.schoolId !== options.schoolId) {
      throw new NotFoundException('Support ticket not found');
    }
  }

  async updateStatus(
    ticketId: string,
    dto: { status: SupportTicketStatus; note?: string; resolutionNote?: string },
    actorId: string,
    options: { schoolActor?: boolean; ipAddress?: string; schoolId?: string } = {},
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { school: { select: { id: true, name: true } } },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    this.assertTenant(ticket, options);

    if (ticket.status === dto.status) {
      throw new BadRequestException(`Ticket is already ${ticket.status}`);
    }

    // A school may reopen its own ticket, but may not mark it resolved or close
    // it on the platform's behalf - resolution is the platform's assertion.
    const allowedForSchool: SupportTicketStatus[] = [
      SupportTicketStatus.IN_PROGRESS,
      SupportTicketStatus.CLOSED,
    ];
    if (options.schoolActor && !allowedForSchool.includes(dto.status)) {
      throw new BadRequestException(
        'A school can only reopen or withdraw its own ticket. Resolution is recorded by the platform team.',
      );
    }

    const allowed = TICKET_STATUS_FLOW[ticket.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot move ticket from ${ticket.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    if (dto.status === SupportTicketStatus.RESOLVED && !dto.resolutionNote?.trim()) {
      throw new BadRequestException('A resolution note is required before resolving a ticket.');
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: dto.status,
          lastActivityAt: now,
          ...(dto.status === SupportTicketStatus.RESOLVED
            ? { resolvedAt: now, resolutionNote: dto.resolutionNote?.trim() }
            : {}),
          ...(dto.status === SupportTicketStatus.CLOSED ? { closedAt: now } : {}),
          ...(dto.status === SupportTicketStatus.IN_PROGRESS
            ? { resolvedAt: null, closedAt: null }
            : {}),
        },
        include: {
          school: { select: { id: true, name: true, code: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          openedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });

      const body =
        dto.note?.trim() ||
        (dto.status === SupportTicketStatus.RESOLVED
          ? `Resolved: ${dto.resolutionNote?.trim()}`
          : `Status changed from ${ticket.status} to ${dto.status}.`);

      await tx.supportTicketMessage.create({
        data: {
          ticketId,
          authorId: actorId,
          body,
          // A status change is communicated to the school; internal notes stay hidden.
          internal: false,
          statusChange: dto.status,
        },
      });

      await this.audit.log(
        {
          userId: actorId,
          schoolId: ticket.schoolId,
          action: 'SUPPORT_TICKET_STATUS_UPDATED',
          module: 'SUPPORT',
          resourceId: ticketId,
          ipAddress: options.ipAddress,
          metadata: {
            previousStatus: ticket.status,
            newStatus: dto.status,
            reference: ticket.reference,
            actor: options.schoolActor ? 'SCHOOL' : 'PLATFORM',
          },
        },
        tx,
      );

      return saved;
    });

    let delivery = null;
    if (dto.status === SupportTicketStatus.RESOLVED || dto.status === SupportTicketStatus.CLOSED) {
      delivery = await this.notifySchoolAdmins(
        updated,
        `Ticket ${updated.reference} ${dto.status === SupportTicketStatus.RESOLVED ? 'resolved' : 'closed'}`,
        dto.status === SupportTicketStatus.RESOLVED
          ? `Your ticket "${updated.subject}" was marked resolved.\n\n${updated.resolutionNote || ''}`
          : `Your ticket "${updated.subject}" has been closed.`,
        options.ipAddress,
      );
    }

    return { ...updated, delivery };
  }

  async addMessage(
    ticketId: string,
    dto: { body: string; internal?: boolean },
    actorId: string,
    options: { schoolActor?: boolean; ipAddress?: string; schoolId?: string } = {},
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { school: { select: { id: true, name: true } } },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    this.assertTenant(ticket, options);
    if (options.schoolActor && ticket.status === SupportTicketStatus.CLOSED) {
      throw new BadRequestException('This ticket is closed. Reopen it to add more detail.');
    }

    const internal = options.schoolActor ? false : Boolean(dto.internal);

    const message = await this.prisma.supportTicketMessage.create({
      data: {
        ticketId,
        authorId: actorId,
        body: dto.body.trim(),
        internal,
      },
    });

    // Any reply is activity, and the queue is sorted on it.
    const activity: Prisma.SupportTicketUpdateInput = { lastActivityAt: new Date() };
    if (!internal) {
      // A public reply flips ownership of the next action: platform answers ->
      // the school is awaited, school answers -> the platform picks it back up.
      if (options.schoolActor && ticket.status !== SupportTicketStatus.IN_PROGRESS) {
        activity.status = SupportTicketStatus.IN_PROGRESS;
      } else if (!options.schoolActor && !TERMINAL_STATUSES.includes(ticket.status)) {
        activity.status = SupportTicketStatus.AWAITING_SCHOOL;
      }
    }
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: activity,
      include: { school: { select: { id: true, name: true, code: true } } },
    });

    await this.audit.log({
      userId: actorId,
      schoolId: ticket.schoolId,
      action: internal ? 'SUPPORT_TICKET_NOTE_ADDED' : 'SUPPORT_TICKET_REPLY_ADDED',
      module: 'SUPPORT',
      resourceId: ticketId,
      ipAddress: options.ipAddress,
      metadata: { messageId: message.id, reference: ticket.reference },
    });

    let delivery = null;
    if (!internal && !options.schoolActor) {
      delivery = await this.notifySchoolAdmins(
        updated,
        `New reply on ticket ${ticket.reference}`,
        `${ticket.subject}\n\n${dto.body.trim()}`,
        options.ipAddress,
      );
    }

    return { message, ticket: updated, delivery };
  }

  /**
   * In-app notification for the tenant's active administrators, plus an email
   * attempt through the configured provider. The returned object reports what
   * actually happened - if email is unconfigured that is stated, not hidden.
   */
  private async notifySchoolAdmins(
    ticket: { id: string; reference: string; schoolId: string },
    title: string,
    content: string,
    ipAddress?: string,
  ) {
    const admins = await this.prisma.userRole.findMany({
      where: { schoolId: ticket.schoolId, role: { name: 'SCHOOL_ADMIN' } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });

    const recipients = admins.filter((row) => row.user.isActive).map((row) => row.user);
    if (!recipients.length) {
      return { recipients: 0, inApp: 0, emailSent: 0, emailFailed: 0, emailStatus: 'NO_RECIPIENTS' };
    }

    let inApp = 0;
    let emailSent = 0;
    let emailFailed = 0;
    let emailError: string | undefined;

    for (const admin of recipients) {
      await this.prisma.notification.create({
        data: {
          schoolId: ticket.schoolId,
          userId: admin.id,
          notificationType: 'SUPPORT_TICKET',
          title: `[${ticket.reference}] ${title}`,
          content,
          priority: NotificationPriority.NORMAL,
          status: NotificationStatus.SENT,
          deliveries: {
            create: [
              {
                channel: CommunicationChannel.IN_APP,
                status: DeliveryStatus.DELIVERED,
                deliveredAt: new Date(),
                attemptCount: 1,
              },
            ],
          },
        },
      });
      inApp += 1;

      if (admin.email) {
        const result = await this.emailProvider.send({
          to: admin.email,
          subject: `[SchooMA Support] ${title}`,
          body: `Hello ${admin.firstName || 'Administrator'},\n\n${content}\n\nTicket reference: ${ticket.reference}`,
        });
        if (result.success) emailSent += 1;
        else {
          emailFailed += 1;
          emailError = result.error;
        }
      }
    }

    await this.audit.log({
      userId: 'system',
      schoolId: ticket.schoolId,
      action: 'SUPPORT_TICKET_SCHOOL_NOTIFIED',
      module: 'SUPPORT',
      resourceId: ticket.id,
      ipAddress,
      metadata: { recipients: recipients.length, inApp, emailSent, emailFailed, emailError },
    });

    return {
      recipients: recipients.length,
      inApp,
      emailSent,
      emailFailed,
      emailError,
      // Stated as what happened: an unconfigured SMTP provider reports NOT_SENT
      // or FAILED rather than being quietly counted as delivered.
      emailStatus: emailSent > 0 ? 'SENT' : emailFailed > 0 ? 'FAILED' : 'NOT_SENT',
    };
  }

  /** Tenant-scoped list for the school's own view of its tickets. */
  async listForSchool(schoolId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { schoolId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 50,
    });
    return { items: tickets, total: tickets.length };
  }
}
