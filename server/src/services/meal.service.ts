import { prisma } from '../config/database';

/** Get the LOCAL date string YYYY-MM-DD from a JS Date (uses device/server local timezone) */
function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Convert a YYYY-MM-DD string to a UTC midnight Date.
 * Prisma @db.Date fields store dates in UTC — always use UTC midnight
 * so that '2026-05-25' is stored/queried as '2026-05-25', not the day before.
 */
function toUTCDate(dateStr: string): Date {
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
        // "Effective From" query: find the most recent preference where effectiveFrom ≤ date
        const preference = await prisma.mealPreference.findFirst({
          where: {
            userId,
            mealSlotId: slot.id,
            effectiveFrom: { lte: date },  // On or before this date
          },
          orderBy: { effectiveFrom: 'desc' },  // Most recent one wins
        });

        return {
          slotId: slot.id,
          slotName: slot.name,
          cutoffTime: slot.cutoffTime,
          isOn: preference?.isOn ?? false,  // Default: OFF until student explicitly turns ON
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
   * Get meal status for today and upcoming days
   */
  async getMealStatus(userId: string, hostelId: string) {
    const today = new Date();
    const todayStr = localDateStr(today);  // e.g. "2026-05-25" in local time

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = localDateStr(d);             // Local date string
      const utcDate = toUTCDate(dateStr);          // UTC midnight for @db.Date queries
      const status = await this.getEffectiveMealStatus(userId, hostelId, utcDate);
      days.push({
        date: dateStr,  // Return local date string to frontend
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

    // Compute today in local time
    const todayStr = localDateStr(new Date());
    const todayUTC = toUTCDate(todayStr);

    // Reject past dates
    if (effectiveDate.getTime() < todayUTC.getTime()) {
      throw new Error('CANNOT_MODIFY_PAST');
    }

    // If effective date is today, enforce cutoff
    if (effectiveDate.getTime() === todayUTC.getTime()) {
      const now = new Date();
      const [cutoffHour, cutoffMin] = slot.cutoffTime.split(':').map(Number);
      const cutoff = new Date();
      cutoff.setHours(cutoffHour, cutoffMin, 0, 0);

      if (now >= cutoff) {
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
   * Set override for a specific date (checks cutoff time)
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

    // Convert to UTC midnight for @db.Date comparison and storage
    const targetDate = toUTCDate(data.date);

    // Compute today's UTC midnight from local date string (IST-aware)
    const todayStr = localDateStr(new Date());
    const todayUTC = toUTCDate(todayStr);

    if (targetDate.getTime() === todayUTC.getTime()) {
      // It's for today — check cutoff using local time
      const now = new Date();
      const [cutoffHour, cutoffMin] = slot.cutoffTime.split(':').map(Number);
      const cutoff = new Date();
      cutoff.setHours(cutoffHour, cutoffMin, 0, 0);  // Local cutoff time

      if (now >= cutoff) {
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
   */
  async getMealCount(hostelId: string, date: string, mealSlotId: string) {
    const targetDate = toUTCDate(date);  // UTC midnight for @db.Date

    // Get all approved users in the hostel
    const users = await prisma.user.findMany({
      where: { hostelId, status: 'APPROVED' },
      select: { id: true },
    });

    let vegCount = 0;
    let nonVegCount = 0;
    let totalOn = 0;

    for (const user of users) {
      const status = await this.getEffectiveMealStatus(user.id, hostelId, targetDate);
      if (status.globalDisabled || status.holiday) continue;

      const slot = status.slots?.find((s: any) => s.slotId === mealSlotId);
      if (slot?.isOn) {
        totalOn++;
        if (slot.preference === 'NON_VEG') {
          nonVegCount++;
        } else {
          vegCount++;
        }
      }
    }

    return { totalOn, vegCount, nonVegCount, totalStudents: users.length };
  }

  /**
   * Get students with meal ON for a date/slot (Manager view)
   */
  async getStudentsWithMealOn(hostelId: string, date: string, mealSlotId: string) {
    const targetDate = toUTCDate(date);  // UTC midnight for @db.Date

    const users = await prisma.user.findMany({
      where: { hostelId, status: 'APPROVED' },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        roomNumber: true,
      },
    });

    const studentsOn = [];

    for (const user of users) {
      const status = await this.getEffectiveMealStatus(user.id, hostelId, targetDate);
      if (status.globalDisabled || status.holiday) continue;

      const slot = status.slots?.find((s: any) => s.slotId === mealSlotId);
      if (slot?.isOn) {
        studentsOn.push({
          ...user,
          preference: slot.preference,
        });
      }
    }

    return studentsOn;
  }

  /**
   * Get today's meal stats per slot — available to all students for transparency
   */
  async getTodayStats(hostelId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = localDateStr(today);

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
