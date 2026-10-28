import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { EmailProvider } from '../communication/providers/email.provider';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import { Roles } from './decorators/roles.decorator';
import { ActiveSchool } from './decorators/active-school.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { InvitationStatus } from '@prisma/client';

class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  roleName?: string;
}

const INVITE_TTL_DAYS = 7;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('users/invitations')
export class InvitationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailProvider: EmailProvider,
  ) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Get('roles')
  async listRoles(@ActiveSchool() schoolId: string) {
    return this.prisma.role.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true },
    });
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Get()
  async list(@ActiveSchool() schoolId: string) {
    return this.prisma.invitation.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post()
  async create(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: any,
  ) {
    const email = dto.email.trim().toLowerCase();

    const role = dto.roleId
      ? await this.prisma.role.findFirst({ where: { id: dto.roleId, schoolId } })
      : dto.roleName
        ? await this.prisma.role.findFirst({
            where: { name: dto.roleName.toUpperCase(), schoolId },
          })
        : null;

    if (!role) {
      throw new NotFoundException(
        'Role not found in this school. Select a role that exists for this workspace.',
      );
    }

    const existingMember = await this.prisma.schoolMembership.findFirst({
      where: { schoolId, user: { email } },
      select: { id: true },
    });
    if (existingMember) {
      throw new ConflictException('This email already belongs to a member of this school.');
    }

    const pending = await this.prisma.invitation.findFirst({
      where: { schoolId, email, status: InvitationStatus.PENDING },
      select: { id: true, expiresAt: true },
    });
    if (pending && pending.expiresAt > new Date()) {
      throw new ConflictException('A pending invitation already exists for this email.');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        schoolId,
        email,
        roleId: role.id,
        tokenHash: hashToken(token),
        expiresAt,
        invitedById: user.id,
      },
      select: {
        id: true,
        email: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
        school: { select: { name: true } },
      },
    });

    const link = this.buildLink(token);
    const delivery = await this.emailProvider
      .send({
        to: email,
        subject: `You have been invited to ${invitation.school.name}`,
        body: [
          `You have been invited to join ${invitation.school.name} as ${role.name}.`,
          '',
          `Accept the invitation and set your password: ${link}`,
          '',
          `This link expires on ${expiresAt.toDateString()}.`,
        ].join('\n'),
      })
      .catch((error) => ({
        success: false,
        error: error instanceof Error ? error.message : 'Email delivery failed',
      }));

    return {
      ...invitation,
      inviteLink: link,
      delivery,
    };
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post(':id/resend')
  async resend(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, schoolId },
      include: { school: { select: { name: true } }, role: { select: { name: true } } },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invitations can be resent.');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.invitation.update({
      where: { id },
      data: { tokenHash: hashToken(token), expiresAt },
    });

    const link = this.buildLink(token);
    const delivery = await this.emailProvider
      .send({
        to: invitation.email,
        subject: `Invitation reminder: ${invitation.school.name}`,
        body: `Accept your invitation to ${invitation.school.name} as ${invitation.role.name}: ${link}`,
      })
      .catch((error) => ({
        success: false,
        error: error instanceof Error ? error.message : 'Email delivery failed',
      }));

    return { id, email: invitation.email, expiresAt, inviteLink: link, delivery };
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Delete(':id')
  async revoke(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    const result = await this.prisma.invitation.updateMany({
      where: { id, schoolId, status: InvitationStatus.PENDING },
      data: { status: InvitationStatus.REVOKED },
    });
    if (result.count === 0) {
      throw new NotFoundException('Pending invitation not found');
    }
    return { success: true };
  }

  private buildLink(token: string) {
    const base =
      process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${base.replace(/\/$/, '')}/invite/accept?token=${token}`;
  }
}
