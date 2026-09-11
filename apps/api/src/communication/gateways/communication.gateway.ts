import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, UseGuards, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  },
})
export class CommunicationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommunicationGateway.name);
  private userSockets = new Map<string, string[]>(); // userId -> socketId[]

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      const userId = payload.sub;
      client.data.userId = userId;

      // Join school-specific rooms if membership exists
      const memberships = await this.jwtService.decode(token) as any;
      // In a real app we'd verify memberships from DB here, but for now we'll use a simpler approach:
      // Clients can explicitly join their school room after connection or we infer from their token if we included schoolIds.

      const sockets = this.userSockets.get(userId) || [];
      this.userSockets.set(userId, [...sockets, client.id]);

      this.logger.log(`Client connected: ${userId} (${client.id})`);
    } catch (e) {
      this.logger.error('WebSocket connection error', e);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      this.userSockets.set(userId, sockets.filter(id => id !== client.id));
      this.logger.log(`Client disconnected: ${userId} (${client.id})`);
    }
  }

  @SubscribeMessage('join-school')
  async handleJoinSchool(client: Socket, schoolId: string) {
    const userId = client.data.userId;
    if (!userId) throw new ForbiddenException();

    // Verify user belongs to this school
    const membership = await this.prisma.schoolMembership.findUnique({
      where: {
        schoolId_userId: { schoolId, userId },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      this.logger.warn(`Unauthorized school join attempt: User ${userId} -> School ${schoolId}`);
      return { status: 'denied' };
    }

    client.join(`school:${schoolId}`);
    this.logger.log(`Client ${client.id} joined school room: ${schoolId}`);
    return { status: 'joined' };
  }

  sendToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  broadcastToSchool(schoolId: string, event: string, data: any) {
    // In a real app, we would join sockets to rooms based on schoolId
    this.server.to(`school:${schoolId}`).emit(event, data);
  }
}
