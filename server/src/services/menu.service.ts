import { prisma } from '../config/database';

export class MenuService {
  /**
   * Get the full weekly menu for a hostel
   */
  async getWeeklyMenu(hostelId: string) {
    const menus = await prisma.weeklyMenu.findMany({
      where: { hostelId },
      include: {
        mealSlot: {
          select: { id: true, name: true, sortOrder: true },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { mealSlot: { sortOrder: 'asc' } },
        { menuType: 'asc' },
      ],
    });

    // Group by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grouped = dayNames.map((dayName, dayIndex) => ({
      dayOfWeek: dayIndex,
      dayName,
      meals: menus
        .filter((m: any) => m.dayOfWeek === dayIndex)
        .map((m: any) => ({
          id: m.id,
          slotId: m.mealSlotId,
          slotName: m.mealSlot.name,
          items: m.items as string[],
          menuType: m.menuType,
        })),
    }));

    return grouped;
  }

  /**
   * Get today's menu
   */
  async getTodayMenu(hostelId: string) {
    const today = new Date().getDay(); // 0 = Sunday

    const menus = await prisma.weeklyMenu.findMany({
      where: {
        hostelId,
        dayOfWeek: today,
      },
      include: {
        mealSlot: {
          select: { id: true, name: true, sortOrder: true },
        },
      },
      orderBy: [
        { mealSlot: { sortOrder: 'asc' } },
        { menuType: 'asc' },
      ],
    });

    return menus.map((m: any) => ({
      id: m.id,
      slotId: m.mealSlotId,
      slotName: m.mealSlot.name,
      items: m.items as string[],
      menuType: m.menuType,
    }));
  }

  /**
   * Set/update weekly menu (Manager action)
   */
  async setWeeklyMenu(data: {
    hostelId: string;
    menus: Array<{
      mealSlotId: string;
      dayOfWeek: number;
      items: string[];
      menuType: string;
    }>;
    setBy: string;
  }) {
    const results = await Promise.all(
      data.menus.map((menu) =>
        prisma.weeklyMenu.upsert({
          where: {
            hostelId_mealSlotId_dayOfWeek_menuType: {
              hostelId: data.hostelId,
              mealSlotId: menu.mealSlotId,
              dayOfWeek: menu.dayOfWeek,
              menuType: menu.menuType as any,
            },
          },
          update: {
            items: menu.items,
            setBy: data.setBy,
          },
          create: {
            hostelId: data.hostelId,
            mealSlotId: menu.mealSlotId,
            dayOfWeek: menu.dayOfWeek,
            items: menu.items,
            menuType: menu.menuType as any,
            setBy: data.setBy,
          },
        })
      )
    );

    return results;
  }
}

export const menuService = new MenuService();
