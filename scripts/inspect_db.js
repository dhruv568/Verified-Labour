const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      services: {
        orderBy: { name: 'asc' }
      }
    }
  });

  console.log(`Total Categories: ${categories.length}`);
  let totalServices = 0;

  categories.forEach((c, i) => {
    console.log(`\nCategory ${i + 1}: ${c.name} (${c.nameHi || 'No Hi'}) [slug: ${c.slug}, id: ${c.id}]`);
    console.log(`Services (${c.services.length}):`);
    c.services.forEach((s, j) => {
      totalServices++;
      console.log(`  ${j + 1}. ${s.name} [id: ${s.id}, slug: ${s.slug}, active: ${s.isActive}]`);
    });
  });

  const standaloneServices = await prisma.service.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { name: 'asc' }
  });
  console.log(`\nTotal Active Services in DB: ${standaloneServices.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
