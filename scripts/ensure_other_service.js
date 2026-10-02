const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== ENSURING 'OTHER WORK / OTHER SERVICE' IN DATABASE ===");

  // 1. Upsert Category
  const category = await prisma.category.upsert({
    where: { slug: 'other-service' },
    update: {
      name: 'Other Work / Other Service',
      nameHi: 'अन्य कार्य / अन्य सेवा',
      description: 'Custom or unlisted services and general work',
      sortOrder: 999,
      isActive: true,
    },
    create: {
      slug: 'other-service',
      name: 'Other Work / Other Service',
      nameHi: 'अन्य कार्य / अन्य सेवा',
      description: 'Custom or unlisted services and general work',
      sortOrder: 999,
      isActive: true,
    },
  });

  console.log(`✔ Category 'other-service' ID: ${category.id}`);

  // 2. Upsert Service
  const service = await prisma.service.upsert({
    where: { slug: 'other-work-service' },
    update: {
      name: 'Other Work / Other Service',
      nameHi: 'अन्य कार्य / अन्य सेवा',
      description: 'Custom or unlisted services and general work',
      basePrice: 350.0,
      priceUnit: 'per job',
      categoryId: category.id,
      isActive: true,
    },
    create: {
      slug: 'other-work-service',
      name: 'Other Work / Other Service',
      nameHi: 'अन्य कार्य / अन्य सेवा',
      description: 'Custom or unlisted services and general work',
      basePrice: 350.0,
      priceUnit: 'per job',
      categoryId: category.id,
      isActive: true,
    },
  });

  console.log(`✔ Service 'other-work-service' ID: ${service.id}`);
  console.log("=== SUCCESSFULLY ENSURED OTHER SERVICE IN DATABASE ===");
}

main()
  .catch((e) => {
    console.error("Error ensuring other service:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
