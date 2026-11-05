import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create the hostel
  const hostelName = process.env.SEED_HOSTEL_NAME || 'B.T. Men\'s Hall';
  const hostelCode = process.env.SEED_HOSTEL_CODE || 'BTMH';

  const hostel = await prisma.hostel.upsert({
    where: { code: hostelCode },
    update: {},
    create: {
      name: hostelName,
      code: hostelCode,
      address: '',
      isActive: true,
    },
  });
  console.log(`✅ Hostel created: ${hostel.name} (${hostel.code})`);

  // 2. Create meal slots
  const morningSlot = await prisma.mealSlot.upsert({
    where: { hostelId_name: { hostelId: hostel.id, name: 'Morning' } },
    update: {},
    create: {
      hostelId: hostel.id,
      name: 'Morning',
      cutoffTime: '07:00',
      sortOrder: 1,
    },
  });
  console.log(`✅ Morning meal slot created (cutoff: 07:00 AM)`);

  const nightSlot = await prisma.mealSlot.upsert({
    where: { hostelId_name: { hostelId: hostel.id, name: 'Night' } },
    update: {},
    create: {
      hostelId: hostel.id,
      name: 'Night',
      cutoffTime: '17:00',
      sortOrder: 2,
    },
  });
  console.log(`✅ Night meal slot created (cutoff: 05:00 PM)`);

  // 3. Create Super Admin user
  const adminPhone = process.env.SEED_ADMIN_PHONE || '9999999999';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const adminName = process.env.SEED_ADMIN_NAME || 'Super Admin';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {},
    create: {
      hostelId: hostel.id,
      phone: adminPhone,
      passwordHash,
      name: adminName,
      rollNumber: 'ADMIN',
      status: 'APPROVED',
    },
  });
  console.log(`✅ Super Admin created: ${admin.name} (${adminPhone})`);

  // 4. Assign SUPER_ADMIN role
  const currentYear = new Date().getFullYear();
  const existingRole = await prisma.userRole.findFirst({
    where: {
      userId: admin.id,
      role: 'SUPER_ADMIN',
      hostelId: hostel.id,
      year: currentYear,
    },
  });

  if (!existingRole) {
    await prisma.userRole.create({
      data: {
        userId: admin.id,
        hostelId: hostel.id,
        role: 'SUPER_ADMIN',
        year: currentYear,
        month: 0,
        isActive: true,
      },
    });
  } else {
    await prisma.userRole.update({
      where: { id: existingRole.id },
      data: { isActive: true },
    });
  }
  console.log(`✅ SUPER_ADMIN role assigned for year ${currentYear}`);


  // Initialize global meal toggle (enabled by default) — only if not already set
  const existingToggle = await prisma.globalMealToggle.findFirst({
    where: { hostelId: hostel.id },
  });
  if (!existingToggle) {
    await prisma.globalMealToggle.create({
      data: {
        hostelId: hostel.id,
        isMealsEnabled: true,
        toggledBy: admin.id,
        reason: 'Initial setup',
      },
    });
  }
  console.log(`✅ Global meal toggle initialized (enabled)`);

  console.log('\n🎉 Seed completed successfully!');
  console.log(`\n📱 Login with:`);
  console.log(`   Phone: ${adminPhone}`);
  console.log(`   Password: ${adminPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
