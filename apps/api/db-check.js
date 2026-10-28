const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRaw`SELECT current_database() as db`
  .then(async (r) => {
    const tables = await p.$queryRaw`SELECT count(*)::int as n FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('DB OK:', JSON.stringify(r), 'public tables:', tables[0].n);
    await p.$disconnect();
  })
  .catch(async (e) => {
    console.log('DB ERR:', e.message);
    await p.$disconnect();
    process.exit(1);
  });
