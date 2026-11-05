import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: [] });

async function main() {
  // Clean all test data
  const delPrefs = await prisma.mealPreference.deleteMany({});
  console.log(`Deleted ${delPrefs.count} meal_preferences`);

  const delOverrides = await prisma.mealOverride.deleteMany({});
  console.log(`Deleted ${delOverrides.count} meal_overrides`);

  console.log('✅ Database cleaned for effectiveFrom migration');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
