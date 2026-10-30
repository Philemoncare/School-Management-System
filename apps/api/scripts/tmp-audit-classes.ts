import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const schools = await prisma.school.findMany({ select: { id: true, name: true, code: true } });
  for (const s of schools) {
    const classes = await prisma.class.findMany({
      where: { schoolId: s.id },
      select: { name: true, code: true, level: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!classes.length) continue;
    console.log(
      s.code,
      '=>',
      classes.map((c) => `${c.name}(L${c.level})`).join(' | '),
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
