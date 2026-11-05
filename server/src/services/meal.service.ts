import { prisma } from '../config/database';

/** Get current date/time components formatted in IST (Asia/Kolkata) */
function getISTParts(d: Date = new Date()): { dateStr: string; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  let year = '', month = '', day = '', hour = '0', minute = '0';
  for (const p of parts) {
    if (p.type === 'year') year = p.value;
    if (p.type === 'month') month = p.value;
    if (p.type === 'day') day = p.value;
    if (p.type === 'hour') hour = p.value;
    if (p.type === 'minute') minute = p.value;
  }
  return {
    dateStr: `${year}-${month}-${day}`,
    hour: parseInt(hour, 10),
    minute: parseInt(minute, 10),
  };
}

/** Get IST date string YYYY-MM-DD */
export function istDateStr(d: Date = new Date()): string {
  return getISTParts(d).dateStr;
}

/** Check if cutoff time (HH:mm format) has already passed in IST */
export function isCutoffPassedIST(cutoffTime: string, now: Date = new Date()): boolean {
  const [cutoffHour, cutoffMin] = cutoffTime.split(':').map(Number);
  const { hour, minute } = getISTParts(now);
  if (hour > cutoffHour) return true;
  if (hour === cutoffHour && minute >= cutoffMin) return true;
  return false;
}

/**
 * Convert a YYYY-MM-DD string to a UTC midnight Date.
 * Prisma @db.Date fields store dates in UTC — always use UTC midnight
 * so that '2026-05-25' is stored/queried consistently as '2026-05-25'.
 */
export function toUTCDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

export class MealService {
  /**
   * Get the effective meal status for a user for a given date.
   * Priority: Global Toggle > Holiday > Override > Default Preference
   */
  async getEffectiveMealStatus(userId: string, hostelId: string, date: Date) {
    // 1. Check global meal toggle
    const globalToggle = await prisma.globalMealToggle.findFirst({
      where: { hostelId },
      orderBy: { toggledAt: 'desc' },
    });

    if (globalToggle && !globalToggle.isMealsEnabled) {
      return {
        globalDisabled: true,
        reason: globalToggle.reason || 'Meals disabled by admin',
        slots: [],
      };
    }

    // 2. Check holidays
    const holiday = await prisma.holiday.findFirst({
      where: {
        hostelId,
        mealsDisabled: true,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    if (holiday) {
      return {
        holiday: true,
        reason: holiday.reason || 'Holiday',
        slots: [],
      };
    }

    // 3. Get all meal slots for the hostel
    const mealSlots = await prisma.mealSlot.findMany({
      where: { hostelId },
      orderBy: { sortOrder: 'asc' },
    });

    // 4. For each slot, find the most recent effective preference
    const slots = await Promise.all(
      mealSlots.map(async (slot: { id: string; name: string; cutoffTime: string }) => {
        // "Effective From" query: find the most recent preference where effectiveFrom <= date
        const preference = await prisma.mealPreference.findFirst({
          where: {
            userId,
            mealSlotId: slot.id,
            effectiveFrom: { lte: date },
          },
          orderBy: { effectiveFrom: 'desc' },
        });

        return {
          slotId: slot.id,
          slotName: slot.name,
          cutoffTime: slot.cutoffTime,
          isOn: preference?.isOn ?? false,  // Default: OFF until explicitly turned ON
          preference: preference?.preference ?? 'VEG',
          source: preference ? ('preference' as const) : ('none' as const),
        };
      })
    );

    return {
      globalDisabled: false,
      holiday: false,
      slots,
    };
  }

  /**
   * Get meal status for today and upcoming 6 days (IST-aware)
   */
  async getMealStatus(userId: string, hostelId: string) {
    const todayStr = istDateStr(new Date());
    const todayUTC = toUTCDate(todayStr);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(todayUTC);
      d.setUTCDate(d.getUTCDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const status = await this.getEffectiveMealStatus(userId, hostelId, d);
      days.push({
        date: dateStr,
        ...status,
      });
    }

    return days;
  }

  /**
   * Set meal preference effective from a specific date.
   * "From this date onwards, my meal is ON/OFF" — persists until changed again.
   */
  async setPreference(data: {
    userId: string;
    hostelId: string;
    mealSlotId: string;
    isOn: boolean;
    preference?: string;
    effectiveFrom: string;  // YYYY-MM-DD
  }) {
    const slot = await prisma.mealSlot.findUnique({ where: { id: data.mealSlotId } });
    if (!slot) throw new Error('MEAL_SLOT_NOT_FOUND');

    const effectiveDate = toUTCDate(data.effectiveFrom);

    // Compute today in IST
    const todayStr = istDateStr(new Date());
    const todayUTC = toUTCDate(todayStr);

    // Reject past dates
    if (effectiveDate.getTime() < todayUTC.getTime()) {
      throw new Error('CANNOT_MODIFY_PAST');
    }

    // If effective date is today, enforce cutoff in IST
    if (effectiveDate.getTime() === todayUTC.getTime()) {
      if (isCutoffPassedIST(slot.cutoffTime)) {
        throw new Error('CUTOFF_PASSED');
      }
    }

    // Check global toggle
    const globalToggle = await prisma.globalMealToggle.findFirst({
      where: { hostelId: data.hostelId },
      orderBy: { toggledAt: 'desc' },
    });

    if (globalToggle && !globalToggle.isMealsEnabled) {
      throw new Error('MEALS_GLOBALLY_DISABLED');
    }

    // Check holiday
    const holiday = await prisma.holiday.findFirst({
      where: {
        hostelId: data.hostelId,
        mealsDisabled: true,
        startDate: { lte: effectiveDate },
        endDate: { gte: effectiveDate },
      },
    });

    if (holiday) {
      throw new Error('HOLIDAY_MEALS_DISABLED');
    }

    // "Clean Sweep": delete any future preference records for this user/slot.
    // This toggle is the "last word" — from this date onwards, everything before is overridden.
    await prisma.mealPreference.deleteMany({
      where: {
        userId: data.userId,
        mealSlotId: data.mealSlotId,
        effectiveFrom: { gt: effectiveDate },
      },
    });

    return prisma.mealPreference.upsert({
      where: {
        userId_mealSlotId_effectiveFrom: {
          userId: data.userId,
          mealSlotId: data.mealSlotId,
          effectiveFrom: effectiveDate,
        },
      },
      update: {
        isOn: data.isOn,
        ...(data.preference && { preference: data.preference as any }),
      },
      create: {
        userId: data.userId,
        mealSlotId: data.mealSlotId,
        isOn: data.isOn,
        preference: (data.preference as any) || 'VEG',
        effectiveFrom: effectiveDate,
      },
    });
  }

  /**
   * Set override for a specific date (checks cutoff time in IST)
   */
  async setOverride(data: {
    userId: string;
    hostelId: string;
    mealSlotId: string;
    date: string; // YYYY-MM-DD
    isOn: boolean;
    preference?: string;
  }) {
    const slot = await prisma.mealSlot.findUnique({
      where: { id: data.mealSlotId },
    });

    if (!slot) {
      throw new Error('MEAL_SLOT_NOT_FOUND');
    }

    const targetDate = toUTCDate(data.date);

    // Compute today in IST
    const todayStr = istDateStr(new Date());
    const todayUTC = toUTCDate(todayStr);

    if (targetDate.getTime() === todayUTC.getTime()) {
      if (isCutoffPassedIST(slot.cutoffTime)) {
        throw new Error('CUTOFF_PASSED');
      }
    } else if (targetDate.getTime() < todayUTC.getTime()) {
      throw new Error('CANNOT_MODIFY_PAST');
    }

    // Check global toggle
    const globalToggle = await prisma.globalMealToggle.findFirst({
      where: { hostelId: data.hostelId },
      orderBy: { toggledAt: 'desc' },
    });

    if (globalToggle && !globalToggle.isMealsEnabled) {
      throw new Error('MEALS_GLOBALLY_DISABLED');
    }

    // Check holiday
    const holiday = await prisma.holiday.findFirst({
      where: {
        hostelId: data.hostelId,
        mealsDisabled: true,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });

    if (holiday) {
      throw new Error('HOLIDAY_MEALS_DISABLED');
    }

    return prisma.mealOverride.upsert({
      where: {
        userId_mealSlotId_date: {
          userId: data.userId,
          mealSlotId: data.mealSlotId,
          date: targetDate,
        },
      },
      update: {
        isOn: data.isOn,
        ...(data.preference && { preference: data.preference as any }),
      },
      create: {
        userId: data.userId,
        mealSlotId: data.mealSlotId,
        date: targetDate,
        isOn: data.isOn,
        preference: (data.preference as any) || 'VEG',
      },
    });
  }

  /**
   * Get meal count for a specific date and slot (Manager view)
   * High performance O(1) query using PostgreSQL DISTINCT ON
   */
  async getMealCount(hostelId: string, date: string, mealSlotId: string) {
    const targetDate = toUTCDate(date);

    // 1. Check global meal toggle once
    const globalToggle = await prisma.globalMealToggle.findFirst({
      where: { hostelId },
      orderBy: { toggledAt: 'desc' },
    });

    if (globalToggle && !globalToggle.isMealsEnabled) {
      const totalStudents = await prisma.user.count({ where: { hostelId, status: 'APPROVED' } });
      return { totalOn: 0, vegCount: 0, nonVegCount: 0, totalStudents, globalDisabled: true };
    }

    // 2. Check holidays once
    const holiday = await prisma.holiday.findFirst({
      where: {
        hostelId,
        mealsDisabled: true,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });

    if (holiday) {
      const totalStudents = await prisma.user.count({ where: { hostelId, status: 'APPROVED' } });
      return { totalOn: 0, vegCount: 0, nonVegCount: 0, totalStudents, holiday: true };
    }

    // 3. Fast SQL query using DISTINCT ON to find the latest effective preference for each student
    type UserPrefRow = {
      userId: string;
      preference: 'VEG' | 'NON_VEG';
      isOn: boolean;
    };

    const [latestPrefs, totalStudents] = await Promise.all([
      prisma.$queryRaw<UserPrefRow[]>`
        SELECT DISTINCT ON (mp."userId")
          mp."userId",
          mp."preference",
          mp."isOn"
        FROM meal_preferences mp
        INNER JOIN users u ON u.id = mp."userId"
        WHERE u."hostelId" = ${hostelId}
          AND u.status = 'APPROVED'
          AND mp."mealSlotId" = ${mealSlotId}
          AND mp."effectiveFrom" <= ${targetDate}
        ORDER BY mp."userId", mp."effectiveFrom" DESC
      `,
      prisma.user.count({
        where: { hostelId, status: 'APPROVED' },
      }),
    ]);

    let vegCount = 0;
    let nonVegCount = 0;
    let totalOn = 0;

    for (const row of latestPrefs) {
      if (row.isOn) {
        totalOn++;
        if (row.preference === 'NON_VEG') {
          nonVegCount++;
        } else {
          vegCount++;
        }
      }
    }

    return { totalOn, vegCount, nonVegCount, totalStudents };
  }

  /**
   * Get students with meal ON for a date/slot (Manager view)
   * High performance O(1) query using PostgreSQL DISTINCT ON
   */
  async getStudentsWithMealOn(hostelId: string, date: string, mealSlotId: string) {
    const targetDate = toUTCDate(date);

    // 1. Check global toggle
    const globalToggle = await prisma.globalMealToggle.findFirst({
      where: { hostelId },
      orderBy: { toggledAt: 'desc' },
    });
    if (globalToggle && !globalToggle.isMealsEnabled) return [];

    // 2. Check holiday
    const holiday = await prisma.holiday.findFirst({
      where: {
        hostelId,
        mealsDisabled: true,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });
    if (holiday) return [];

    type StudentRow = {
      id: string;
      name: string;
      rollNumber: string;
      roomNumber: string | null;
      preference: 'VEG' | 'NON_VEG';
    };

    const students = await prisma.$queryRaw<StudentRow[]>`
      SELECT DISTINCT ON (mp."userId")
        u.id,
        u.name,
        u."rollNumber",
        u."roomNumber",
        mp."preference"
      FROM meal_preferences mp
      INNER JOIN users u ON u.id = mp."userId"
      WHERE u."hostelId" = ${hostelId}
        AND u.status = 'APPROVED'
        AND mp."mealSlotId" = ${mealSlotId}
        AND mp."effectiveFrom" <= ${targetDate}
        AND mp."isOn" = true
      ORDER BY mp."userId", mp."effectiveFrom" DESC
    `;

    return students.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber) || a.name.localeCompare(b.name));
  }

  /**
   * Get today's meal stats per slot — available to all students for transparency
   */
  async getTodayStats(hostelId: string) {
    const todayStr = istDateStr(new Date());

    const mealSlots = await prisma.mealSlot.findMany({
      where: { hostelId },
      orderBy: { sortOrder: 'asc' },
    });

    const result = await Promise.all(
      mealSlots.map(async (slot) => {
        const count = await this.getMealCount(hostelId, todayStr, slot.id);
        return {
          slotId: slot.id,
          slotName: slot.name,
          cutoffTime: slot.cutoffTime,
          ...count,
        };
      })
    );

    return result;
  }
}

export const mealService = new MealService();
