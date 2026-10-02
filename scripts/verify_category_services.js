const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== VERIFYING CATEGORY TO SERVICE MAPPING IN DB ===");

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      services: {
        where: { isActive: true }
      }
    }
  });

  for (const cat of categories) {
    console.log(`\nCategory: [${cat.id}] "${cat.name}" (${cat.slug})`);
    if (cat.services.length === 0) {
      console.log(`  ⚠️ No active service found! Creating primary service...`);
      const defaultService = await prisma.service.create({
        data: {
          categoryId: cat.id,
          name: cat.name,
          nameHi: cat.nameHi || cat.name,
          slug: `${cat.slug}-primary-service`,
          description: `Primary service for ${cat.name}`,
          basePrice: 350.0,
          priceUnit: 'per job',
          isActive: true
        }
      });
      console.log(`  ✔ Created primary service: [${defaultService.id}] "${defaultService.name}" (${defaultService.slug})`);
    } else {
      console.log(`  ✔ ${cat.services.length} active service(s) found:`);
      for (const svc of cat.services) {
        console.log(`    - [${svc.id}] "${svc.name}" (${svc.slug})`);
      }
    }
  }

  console.log("\n=== ALL CATEGORY TO SERVICE MAPPINGS VERIFIED ===");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
