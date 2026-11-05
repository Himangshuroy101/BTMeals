import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: [] });

async function main() {
  console.log('=== MEAL PREFERENCES ===');
  const prefs = await prisma.mealPreference.findMany({
    include: { user: { select: { name: true } }, mealSlot: { select: { name: true } } },
    orderBy: { effectiveFrom: 'asc' },
  });
  if (prefs.length === 0) {
    console.log('(empty — clean slate, ready for students to toggle)');
  } else {
    console.table(prefs.map(p => ({
      user: p.user.name,
      slot: p.mealSlot.name,
      isOn: p.isOn,
      effectiveFrom: p.effectiveFrom.toISOString().split('T')[0],
      preference: p.preference,
    })));
  }

  console.log('\n=== MEAL OVERRIDES (should be empty) ===');
  const overrides = await prisma.mealOverride.count();
  console.log(`Count: ${overrides}`);

  console.log('\n=== MEAL SLOTS ===');
  const slots = await prisma.mealSlot.findMany({
    select: { id: true, name: true, cutoffTime: true },
    orderBy: { sortOrder: 'asc' },
  });
  console.table(slots);

  console.log('\n=== APPROVED USERS ===');
  const users = await prisma.user.findMany({
    where: { status: 'APPROVED' },
    select: { name: true, rollNumber: true },
  });
  console.table(users);

  console.log(`\n✅ Database is clean. ${users.length} approved users, 0 preferences (they will be created when students toggle).`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
