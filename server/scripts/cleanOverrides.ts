import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: [] });

async function main() {
  const today = new Date();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  const todayUTC = new Date(todayStr + 'T00:00:00.000Z');

  // Delete overrides for PAST dates (before today) — they're irrelevant
  const pastDeleted = await prisma.mealOverride.deleteMany({
    where: { date: { lt: todayUTC } },
  });
  console.log(`Deleted ${pastDeleted.count} past date overrides`);

  // Delete overrides for FUTURE dates (after today) — test data from earlier experiments
  const futureDeleted = await prisma.mealOverride.deleteMany({
    where: { date: { gt: todayUTC } },
  });
  console.log(`Deleted ${futureDeleted.count} future date overrides (test data)`);

  console.log('\nRemaining overrides (today only):');
  const remaining = await prisma.mealOverride.findMany({
    include: { user: { select: { name: true } }, mealSlot: { select: { name: true } } },
  });
  console.table(remaining.map(o => ({
    user: o.user.name,
    slot: o.mealSlot.name,
    date: o.date.toISOString().split('T')[0],
    isOn: o.isOn,
  })));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
