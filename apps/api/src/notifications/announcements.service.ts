import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationService } from '../communication/communication.service';
import { AudienceType, AnnouncementStatus } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private comms: CommunicationService,
  ) {}

  async create(schoolId: string, authorId: string, dto: any) {
    const announcement = await this.prisma.announcement.create({
      data: {
        ...dto,
        schoolId,
        authorId,
      },
    });

    if (announcement.status === AnnouncementStatus.PUBLISHED) {
      await this.triggerNotifications(announcement);
    }

    return announcement;
  }

  async findAll(schoolId: string, audienceType?: AudienceType) {
    return this.prisma.announcement.findMany({
      where: {
        schoolId,
        ...(audienceType ? { audienceType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async publish(id: string) {
    const announcement = await this.prisma.announcement.update({
      where: { id },
      data: { status: AnnouncementStatus.PUBLISHED, publishAt: new Date() },
    });

    await this.triggerNotifications(announcement);

    return announcement;
  }

  private async triggerNotifications(announcement: any) {
    // Logic to resolve users based on audienceType and audienceIds
    // and send notifications via CommunicationService
    // For now, let's assume a simplified version

    // In a real app, we would fetch user IDs based on the audience
    // and call this.comms.sendNotification for each.
  }
}
