import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationService } from '../communication/communication.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private comms: CommunicationService,
  ) {}

  async createConversation(schoolId: string, participantIds: string[], title?: string) {
    return this.prisma.conversation.create({
      data: {
        schoolId,
        title,
        isGroup: participantIds.length > 2,
        participants: {
          create: participantIds.map(userId => ({ userId })),
        },
      },
      include: { participants: true },
    });
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) throw new NotFoundException('Conversation not found');

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) throw new ForbiddenException('Not a participant in this conversation');

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content,
        },
        include: { sender: true },
      });

      // Update conversation last message timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      // Create read status for all other participants
      const otherParticipants = conversation.participants.filter(p => p.userId !== userId);
      await tx.messageRecipient.createMany({
        data: otherParticipants.map(p => ({
          messageId: message.id,
          userId: p.userId,
        })),
      });

      // Trigger notifications for participants
      for (const participant of otherParticipants) {
        await this.comms.sendNotification({
          schoolId: conversation.schoolId,
          userId: participant.userId,
          type: 'NEW_MESSAGE',
          data: {
            sender_name: `${message.sender.firstName} ${message.sender.lastName}`,
            content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          },
        });
      }

      return message;
    });
  }

  async findUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async findMessages(conversationId: string, userId: string) {
    // Verify participation
    const participation = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!participation) throw new ForbiddenException('Access denied');

    return this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
