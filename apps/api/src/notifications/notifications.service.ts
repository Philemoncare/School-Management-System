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

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
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
}
