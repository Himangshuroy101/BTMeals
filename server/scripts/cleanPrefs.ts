import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Delete all meal_preferences — they'll be recreated when students toggle
  const deleted = await prisma.mealPreference.deleteMany({});
  console.log(`Deleted ${deleted.count} meal_preferences rows`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
