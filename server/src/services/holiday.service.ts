import { prisma } from '../config/database';

export class HolidayService {
  /**
   * Create a holiday period
   */
  async createHoliday(data: {
    hostelId: string;
    startDate: string;
    endDate: string;
    reason?: string;
    mealsDisabled: boolean;
    createdBy: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start > end) {
      throw new Error('START_DATE_AFTER_END_DATE');
    }

    return prisma.holiday.create({
      data: {
        hostelId: data.hostelId,
        startDate: start,
        endDate: end,
        reason: data.reason,
        mealsDisabled: data.mealsDisabled,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * List all holidays for a hostel
   */
  async getHolidays(hostelId: string) {
    return prisma.holiday.findMany({
      where: { hostelId },
      include: {
        creator: {
          select: { name: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Delete a holiday
   */
  async deleteHoliday(holidayId: string, hostelId: string) {
    const holiday = await prisma.holiday.findFirst({
      where: { id: holidayId, hostelId },
    });

    if (!holiday) {
      throw new Error('HOLIDAY_NOT_FOUND');
    }

    return prisma.holiday.delete({
      where: { id: holidayId },
    });
  }

  /**
   * Toggle global meal status
   */
  async toggleGlobalMeals(data: {
    hostelId: string;
    isMealsEnabled: boolean;
    reason?: string;
    toggledBy: string;
  }) {
    return prisma.globalMealToggle.create({
      data: {
        hostelId: data.hostelId,
        isMealsEnabled: data.isMealsEnabled,
        toggledBy: data.toggledBy,
        reason: data.reason,
      },
    });
  }

  /**
   * Get current global meal status
   */
  async getGlobalStatus(hostelId: string) {
    const latest = await prisma.globalMealToggle.findFirst({
      where: { hostelId },
      orderBy: { toggledAt: 'desc' },
      include: {
        toggler: {
          select: { name: true },
        },
      },
    });

    return latest || { isMealsEnabled: true, reason: null };
  }
}

export const holidayService = new HolidayService();
