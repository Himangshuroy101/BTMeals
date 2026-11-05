import { prisma } from '../config/database';
import { resolveActiveRoles } from '../utils/roleResolver';

export class UserService {
  /**
   * Get pending registration requests for a hostel
   */
  async getPendingUsers(hostelId: string) {
    return prisma.user.findMany({
      where: {
        hostelId,
        status: 'PENDING' as const,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        rollNumber: true,
        roomNumber: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Approve a pending student registration
   */
  async approveUser(userId: string, hostelId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, hostelId },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (user.status !== 'PENDING') {
      throw new Error('USER_NOT_PENDING');
    }

    const currentYear = new Date().getFullYear();
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { status: 'APPROVED' as const },
        select: {
          id: true,
          name: true,
          phone: true,
          status: true,
        },
      }),
      // Activate existing STUDENT role (created at registration)
      prisma.userRole.updateMany({
        where: { userId, hostelId, role: 'STUDENT' },
        data: { isActive: true, year: currentYear },
      }),
    ]);

    // If no STUDENT role exists yet (edge case), create one
    const studentRole = await prisma.userRole.findFirst({
      where: { userId, hostelId, role: 'STUDENT' },
    });
    if (!studentRole) {
      await prisma.userRole.create({
        data: { userId, hostelId, role: 'STUDENT', year: currentYear, month: 0, isActive: true },
      });
    }

    return updatedUser;
  }

  /**
   * Reject a pending student registration
   */
  async rejectUser(userId: string, hostelId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, hostelId },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { status: 'REJECTED' as const },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
      },
    });
  }

  /**
   * Suspend an approved student
   */
  async suspendUser(userId: string, hostelId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, hostelId },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { status: 'SUSPENDED' as const },
      }),
      prisma.userRole.updateMany({
        where: { userId, hostelId },
        data: { isActive: false },
      }),
    ]);
  }

  /**
   * Get own profile
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        rollNumber: true,
        roomNumber: true,
        status: true,
        createdAt: true,
        hostel: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        userRoles: {
          where: { isActive: true },
          select: {
            role: true,
            year: true,
            month: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return {
      ...user,
      roles: resolveActiveRoles(user.userRoles),
    };
  }

  /**
   * Update own profile
   */
  async updateProfile(userId: string, data: { name?: string; roomNumber?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        roomNumber: true,
      },
    });
  }

  /**
   * List all approved users in a hostel
   */
  async getApprovedUsers(hostelId: string) {
    return prisma.user.findMany({
      where: {
        hostelId,
        status: 'APPROVED' as const,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        rollNumber: true,
        roomNumber: true,
        userRoles: {
          where: { isActive: true },
          select: { role: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}

export const userService = new UserService();
