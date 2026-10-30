import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const schools = await prisma.school.findMany({
    select: { id: true, name: true, code: true, status: true },
    orderBy: { name: 'asc' },
  });
  console.log('SCHOOLS', schools.length);
  const hso = schools.find((s) => s.code === 'HSO') ?? schools[0];
  console.log('TARGET', hso);

  const classes = await prisma.class.findMany({
    where: { schoolId: hso.id },
    select: { id: true, name: true, code: true, level: true, isActive: true },
    orderBy: { level: 'asc' },
  });
  console.log('CLASSES', JSON.stringify(classes, null, 1));

  const years = await prisma.academicYear.findMany({
    where: { schoolId: hso.id },
    select: { id: true, name: true, startDate: true, isCurrent: true, status: true },
    orderBy: { startDate: 'desc' },
  });
  console.log('YEARS', JSON.stringify(years, null, 1));

  const subjects = await prisma.subject.findMany({
    where: { schoolId: hso.id },
    select: { name: true, code: true, isActive: true },
    orderBy: { name: 'asc' },
  });
  console.log('SUBJECTS', subjects.length, JSON.stringify(subjects.slice(0, 20)));

  const sections = await prisma.section.findMany({
    where: { class: { schoolId: hso.id } },
    select: { name: true, class: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });
  console.log('SECTIONS', sections.length, JSON.stringify(sections.slice(0, 15)));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
