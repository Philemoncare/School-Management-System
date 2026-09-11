import { Controller, Get, Query, UseGuards, Patch, Param, Body } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin/users')
export class SuperAdminUsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    const where = {
      ...(search ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as any } },
          { firstName: { contains: search, mode: 'insensitive' as any } },
          { lastName: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: skip ? parseInt(skip) : 0,
        take: take ? parseInt(take) : 20,
        include: {
          memberships: {
            include: { school: true }
          },
          userRoles: {
            include: { role: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return { items, total };
  }

  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive }
    });
  }
}
