import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const session = request.session; // Assumes session is injected by a previous guard or middleware

    if (!user || !session) return false;

    // Check if the session was recently authenticated or MFA verified
    const authTime = new Date(session.lastMfaAt || session.createdAt).getTime();
    const now = Date.now();

    const MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

    if (now - authTime > MAX_AGE_MS) {
      throw new ForbiddenException('Step-up authentication required');
    }

    return true;
  }
}
