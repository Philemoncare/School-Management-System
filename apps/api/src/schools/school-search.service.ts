import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolSearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(schoolId: string, query: string) {
    const term = query.trim();
    if (!term) return { students: [], teachers: [], classes: [] };

    const [students, teachers, classes] = await Promise.all([
      this.prisma.student.findMany({
        where: {
          schoolId,
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { studentNumber: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      this.prisma.teacher.findMany({
        where: {
          schoolId,
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { employeeId: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      this.prisma.class.findMany({
        where: {
          schoolId,
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { code: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
    ]);

    return { students, teachers, classes };
  }
}
