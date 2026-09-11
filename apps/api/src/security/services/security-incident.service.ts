import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncidentStatus, SecuritySeverity } from '@prisma/client';

@Injectable()
export class SecurityIncidentService {
  constructor(private prisma: PrismaService) {}

  async createIncident(params: {
    title: string;
    description: string;
    severity: SecuritySeverity;
    schoolId?: string;
  }) {
    return this.prisma.securityIncident.create({
      data: {
        title: params.title,
        description: params.description,
        severity: params.severity,
        schoolId: params.schoolId,
        status: IncidentStatus.OPEN,
      },
    });
  }

  async updateIncident(id: string, data: any) {
    return this.prisma.securityIncident.update({
      where: { id },
      data,
    });
  }

  async getIncidents(filters: any) {
    return this.prisma.securityIncident.findMany({
      where: filters,
      orderBy: { detectedAt: 'desc' },
    });
  }
}
