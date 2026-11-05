import { prisma } from '../config/database';

type NotificationType = 'MEAL_REMINDER' | 'STATUS_CHANGE' | 'MENU_UPDATE' | 'ROLE_ASSIGNED' | 'HOLIDAY' | 'GENERAL';

export class NotificationService {
  /**
   * Create a notification for a user
   */
  async create(data: {
    userId: string;
    hostelId: string;
    title: string;
    body: string;
    type: NotificationType;
  }) {
    return prisma.notification.create({ data });
  }

  /**
   * Create notifications for all approved users in a hostel
   */
  async createBulk(data: {
    hostelId: string;
    title: string;
    body: string;
    type: NotificationType;
  }) {
    const users = await prisma.user.findMany({
      where: { hostelId: data.hostelId, status: 'APPROVED' },
      select: { id: true },
    });

    return prisma.notification.createMany({
      data: users.map((user: { id: string }) => ({
        userId: user.id,
        hostelId: data.hostelId,
        title: data.title,
        body: data.body,
        type: data.type,
      })),
    });
  }

  /**
   * Get notifications for a user (paginated)
   */
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const notificationService = new NotificationService();
