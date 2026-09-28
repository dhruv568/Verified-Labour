const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allServices = await prisma.service.findMany({
    include: { category: true }
  });
  console.log("ALL SERVICES COUNT:", allServices.length);
  console.log(allServices.map(s => `${s.id} | ${s.name} | ${s.slug} | ${s.category?.name}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
