import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { SecurityEventService } from "../security/services/security-event.service";
import { SessionService } from "../security/services/session.service";
import * as argon2 from "argon2";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityEventService: SecurityEventService,
    private readonly sessionService: SessionService,
  ) {}

  @Get("me")
  async getMe(@CurrentUser() user: any) {
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        memberships: { include: { school: true } },
        userRoles: { include: { role: true } },
      },
    });
    if (!fullUser) throw new UnauthorizedException();
    const { passwordHash, ...result } = fullUser;
    return result;
  }

  @Patch("me")
  async updateMe(@CurrentUser() user: any, @Body() dto: any) {
    const allowedFields = ["firstName", "lastName", "phone"];
    const updateData: any = {};
    for (const key of allowedFields) {
      if (dto[key] !== undefined) updateData[key] = dto[key];
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await this.securityEventService.logEvent({
      userId: user.id,
      eventType: "USER_PROFILE_UPDATED" as any,
      metadata: { fields: Object.keys(updateData) },
    });

    const { passwordHash, ...result } = updated;
    return result;
  }

  @Post("me/password/change")
  async changePassword(@CurrentUser() user: any, @Body() dto: any) {
    const { currentPassword, newPassword } = dto;
    if (!currentPassword || !newPassword) {
      throw new BadRequestException("Current and new passwords are required");
    }

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new UnauthorizedException();

    const matches = await argon2.verify(dbUser.passwordHash, currentPassword).catch(() => false);
    if (!matches) throw new BadRequestException("Incorrect current password");

    // Enforce strong password rules
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(newPassword) || newPassword.length < 12) {
      throw new BadRequestException("Password must be at least 12 characters and contain uppercase, lowercase, numbers and symbols.");
    }

    const newHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await this.securityEventService.logEvent({
      userId: user.id,
      eventType: "PASSWORD_CHANGED" as any,
    });

    return { success: true };
  }

  @Get("me/preferences")
  async getPreferences(@CurrentUser() user: any) {
    return this.prisma.userPreference.findMany({
      where: { userId: user.id },
    });
  }

  @Patch("me/preferences")
  async updatePreferences(@CurrentUser() user: any, @Body() dto: { key: string; value: any }) {
    const { key, value } = dto;
    if (!key) throw new BadRequestException("Key is required");

    const pref = await this.prisma.userPreference.upsert({
      where: { userId_key: { userId: user.id, key } },
      update: { value },
      create: { userId: user.id, key, value },
    });

    return pref;
  }

  @Get("me/notifications/preferences")
  async getNotificationPreferences(@CurrentUser() user: any) {
    return this.prisma.notificationPreference.findMany({
      where: { userId: user.id },
    });
  }

  @Patch("me/notifications/preferences")
  async updateNotificationPreferences(@CurrentUser() user: any, @Body() dto: any) {
    const { notificationType, channel, isEnabled } = dto;
    const pref = await this.prisma.notificationPreference.upsert({
      where: {
        userId_notificationType_channel: {
          userId: user.id,
          notificationType,
          channel,
        },
      },
      update: { isEnabled },
      create: { userId: user.id, notificationType, channel, isEnabled },
    });
    return pref;
  }

  @Get("me/security/activity")
  async getSecurityActivity(@CurrentUser() user: any) {
    return this.prisma.securityEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  @Get("me/sessions")
  async getSessions(@CurrentUser() user: any) {
    return this.sessionService.getUserSessions(user.id);
  }

  @Delete("me/sessions/:id")
  async revokeSession(@CurrentUser() user: any, @Param("id") sessionId: string) {
    await this.sessionService.revokeUserSession(sessionId, user.id, "USER_REVOKED");
    await this.securityEventService.logEvent({
      userId: user.id,
      eventType: "SESSION_REVOKED" as any,
      metadata: { revokedSessionId: sessionId },
    });
    return { success: true };
  }

  @Post("me/sessions/revoke-others")
  async revokeOthers(@CurrentUser() user: any) {
    await this.sessionService.revokeAllUserSessions(user.id, user.sessionId);
    return { success: true };
  }

  @Get("me/memberships")
  async getMemberships(@CurrentUser() user: any) {
    return this.prisma.schoolMembership.findMany({
      where: { userId: user.id },
      include: { school: true },
    });
  }

  @Post("me/deactivation-request")
  async requestDeactivation(@CurrentUser() user: any, @Body("reason") reason: string) {
    await this.securityEventService.logEvent({
      userId: user.id,
      eventType: "SUSPICIOUS_ACTIVITY" as any,
      metadata: { action: "DEACTIVATION_REQUESTED", reason },
    });
    return { success: true, message: "Deactivation request received." };
  }
}
