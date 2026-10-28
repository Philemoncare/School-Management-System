import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthService } from '../../auth/auth.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  PLATFORM_OPERATOR_ROLES,
  PLATFORM_READ_ROLES,
} from '../../auth/platform-roles';
import { Prisma, SessionStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { ResetUserPasswordDto, UpdateUserStatusDto } from '../dto/super-admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_READ_ROLES)
@Controller('super-admin/users')
export class SuperAdminUsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async getUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    const where: Prisma.UserWhereInput = {
      ...(status === 'active'
        ? { isActive: true }
        : status === 'disabled'
          ? { isActive: false }
          : status === 'pending'
            ? { emailVerified: null }
            : status === 'locked'
              ? { accountState: 'LOCKED' }
              : status
                ? { accountState: status as any }
                : {}),
      ...(schoolId ? { memberships: { some: { schoolId } } } : {}),
      ...(role ? { userRoles: { some: { role: { name: role } } } } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const page = Math.max(0, skip ? parseInt(skip, 10) : 0);
    const limit = Math.min(100, Math.max(1, take ? parseInt(take, 10) : 20));

    const [items, total, roles] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: page,
        take: limit,
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          isActive: true,
          emailVerified: true,
          phoneVerified: true,
          accountState: true,
          createdAt: true,
          updatedAt: true,
          memberships: {
            include: { school: { select: { id: true, name: true, code: true, status: true } } },
          },
          userRoles: {
            include: {
              role: true,
              school: { select: { id: true, name: true, code: true } },
            },
          },
          MfaMethod: { select: { id: true, type: true, status: true, verifiedAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
      this.prisma.role.findMany({
        select: { name: true },
        distinct: ['name'],
        orderBy: { name: 'asc' },
      }),
    ]);

    return { items, total, skip: page, take: limit, roles: roles.map((item) => item.name) };
  }

  @Patch(':id/status')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  async toggleStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: any,
  ) {
    if (id === admin.id) throw new BadRequestException('You cannot disable your own Super Admin account');
    const target = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.isActive && !dto.isActive && target.userRoles.some((item) => item.role.name === 'SUPER_ADMIN')) {
      throw new BadRequestException('Super Admin accounts cannot be disabled from this screen');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          isActive: dto.isActive,
          accountState: dto.isActive ? 'ACTIVE' : 'SUSPENDED',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          accountState: true,
        },
      });
      if (!dto.isActive) {
        await tx.userSession.updateMany({
          where: { userId: id, status: SessionStatus.ACTIVE },
          data: {
            status: SessionStatus.REVOKED,
            revokedAt: new Date(),
            revokeReason: dto.reason || 'Account disabled by Super Admin',
          },
        });
      }
      await this.audit.log(
        {
          userId: admin.id,
          action: dto.isActive ? 'USER_ENABLED' : 'USER_DISABLED',
          module: 'USERS',
          resourceId: id,
          metadata: { targetEmail: user.email, reason: dto.reason || null },
        },
        tx,
      );
      return user;
    });

    return updated;
  }

  @Post(':id/reset-password')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetUserPasswordDto,
    @CurrentUser() admin: any,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.userRoles.some((item) => item.role.name === 'SUPER_ADMIN') && target.id !== admin.id) {
      throw new BadRequestException('Use the secure reset flow for Super Admin accounts');
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { passwordHash } });
      await tx.userSession.updateMany({
        where: { userId: id, status: SessionStatus.ACTIVE },
        data: {
          status: SessionStatus.REVOKED,
          revokedAt: new Date(),
          revokeReason: 'Password reset by Super Admin',
        },
      });
      await this.audit.log(
        {
          userId: admin.id,
          action: 'USER_PASSWORD_RESET',
          module: 'USERS',
          resourceId: id,
          metadata: { targetEmail: target.email, sessionsRevoked: true },
        },
        tx,
      );
    });

    return { message: `Password reset successfully for ${target.email}` };
  }

  @Post(':id/send-password-reset')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  async sendPasswordReset(@Param('id') id: string, @CurrentUser() admin: any) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.userRoles.some((item) => item.role.name === 'SUPER_ADMIN') && target.id !== admin.id) {
      throw new BadRequestException('Secure reset emails for other Super Admin accounts must be initiated by that account');
    }

    const result = await this.authService.forgotPassword(target.email);
    await this.audit.log({
      userId: admin.id,
      action: 'USER_PASSWORD_RESET_EMAIL_SENT',
      module: 'USERS',
      resourceId: id,
      metadata: { targetEmail: target.email },
    });

    return {
      ...result,
      message: `Password reset instructions were queued for ${target.email}.`,
    };
  }
}
