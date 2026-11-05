import { prisma } from '../config/database';

export class AttendanceService {
  /**
   * Get attendance list for a meal (with student details)
   */
  async getAttendanceList(hostelId: string, date: string, mealSlotId: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Get existing attendance records
    const existingAttendance = await prisma.mealAttendance.findMany({
      where: {
        mealSlotId,
        date: targetDate,
        user: { hostelId },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            roomNumber: true,
          },
        },
      },
    });

    return existingAttendance.map((a: any) => ({
      userId: a.userId,
      name: a.user.name,
      rollNumber: a.user.rollNumber,
      roomNumber: a.user.roomNumber,
      wasPresent: a.wasPresent,
      preferenceUsed: a.preferenceUsed,
      markedAt: a.markedAt,
    }));
  }

  /**
   * Mark attendance for multiple students (bulk)
   */
  async markAttendance(data: {
    mealSlotId: string;
    date: string;
    attendance: Array<{
      userId: string;
      wasPresent: boolean;
      preferenceUsed: string;
    }>;
    markedBy: string;
  }) {
    const targetDate = new Date(data.date);
    targetDate.setHours(0, 0, 0, 0);

    const results = await Promise.all(
      data.attendance.map((record) =>
        prisma.mealAttendance.upsert({
          where: {
            userId_mealSlotId_date: {
              userId: record.userId,
              mealSlotId: data.mealSlotId,
              date: targetDate,
            },
          },
          update: {
            wasPresent: record.wasPresent,
            preferenceUsed: record.preferenceUsed as any,
            markedBy: data.markedBy,
          },
          create: {
            userId: record.userId,
            mealSlotId: data.mealSlotId,
            date: targetDate,
            wasPresent: record.wasPresent,
            preferenceUsed: record.preferenceUsed as any,
            markedBy: data.markedBy,
          },
        })
      )
    );

    return { marked: results.length };
  }

  /**
   * Get a student's own attendance history
   */
  async getMyHistory(userId: string, page: number = 1, limit: number = 30) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.mealAttendance.findMany({
        where: { userId },
        include: {
          mealSlot: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.mealAttendance.count({ where: { userId } }),
    ]);

    return {
      records: records.map((r: any) => ({
        date: r.date.toISOString().split('T')[0],
        slotName: r.mealSlot.name,
        wasPresent: r.wasPresent,
        preferenceUsed: r.preferenceUsed,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const attendanceService = new AttendanceService();
