import { Controller, Get, Post, Body, Patch, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(private prisma: PrismaService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Get()
  async getMembers(@ActiveSchool() schoolId: string) {
    return this.prisma.schoolMembership.findMany({
      where: { schoolId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            isActive: true,
            emailVerified: true,
            accountState: true,
            createdAt: true,
            updatedAt: true,
            userRoles: {
              where: { schoolId },
              include: { role: true }
            }
          }
        }
      }
    });
  }

  @Roles('SCHOOL_ADMIN')
  @Patch(':membershipId/status')
  async updateStatus(
    @ActiveSchool() schoolId: string,
    @Param('membershipId') id: string,
    @Body('status') status: any
  ) {
    const result = await this.prisma.schoolMembership.updateMany({
      where: { id, schoolId },
      data: { status }
    });

    if (result.count === 0) {
      throw new NotFoundException('Membership not found');
    }

    return this.prisma.schoolMembership.findUnique({ where: { id } });
  }
}
