import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async send(userId: string, title: string, content: string, type: string = 'INFO', schoolId?: string) {
    let effectiveSchoolId = schoolId;
    if (!effectiveSchoolId) {
      const membership = await this.prisma.schoolMembership.findFirst({
        where: { userId },
        select: { schoolId: true },
      });
      effectiveSchoolId = membership?.schoolId || '';
    }

    return this.prisma.notification.create({
      data: {
        schoolId: effectiveSchoolId,
        userId,
        title,
        content,
        notificationType: type,
      },
    });
  }

  private shape(notification: {
    id: string;
    title: string;
    content: string;
    notificationType: string;
    readAt: Date | null;
    createdAt: Date;
    [key: string]: any;
  }) {
    return {
      ...notification,
      // The UI treats `type` and `read` as the canonical fields.
      type: notification.notificationType,
      read: Boolean(notification.readAt),
    };
  }

  async findAll(userId: string, limit?: number) {
    const take = Math.min(Math.max(Number(limit) || 20, 1), 200);
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take,
      }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return { items: items.map((item) => this.shape(item)), unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notification not found');
    }

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { success: true, updated: result.count };
  }
}
