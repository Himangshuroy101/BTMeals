import { prisma } from '../config/database';

type RoleName = 'SUPER_ADMIN' | 'MAINTENANCE_PREFECT' | 'MESS_PREFECT' | 'MANAGER' | 'STUDENT' | 'AUDITOR' | 'LIBRARIAN' | 'GAME_PREFECT' | 'COOKING_STAFF';

export class RoleService {
  /**
   * Assign a role to a user
   */
  async assignRole(data: {
    userId: string;
    role: RoleName;
    hostelId: string;
    year: number;
    month?: number;
    assignedBy: string;
  }) {
    // Verify user exists and belongs to the hostel
    const user = await prisma.user.findFirst({
      where: { id: data.userId, hostelId: data.hostelId },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Can't assign SUPER_ADMIN through API
    if (data.role === 'SUPER_ADMIN') {
      throw new Error('CANNOT_ASSIGN_SUPER_ADMIN');
    }

    // Check if role already exists
    const existing = await prisma.userRole.findFirst({
      where: {
        userId: data.userId,
        role: data.role,
        hostelId: data.hostelId,
        year: data.year,
        month: data.month ?? 0,
      },
    });

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        return prisma.userRole.update({
          where: { id: existing.id },
          data: { isActive: true, assignedBy: data.assignedBy },
        });
      }
      throw new Error('ROLE_ALREADY_ASSIGNED');
    }

    return prisma.userRole.create({
      data: {
        userId: data.userId,
        hostelId: data.hostelId,
        role: data.role,
        year: data.year,
        month: data.month ?? 0,
        assignedBy: data.assignedBy,
      },
    });
  }

  /**
   * Revoke a role
   */
  async revokeRole(roleId: string, hostelId: string) {
    const role = await prisma.userRole.findFirst({
      where: { id: roleId, hostelId },
    });

    if (!role) {
      throw new Error('ROLE_NOT_FOUND');
    }

    if (role.role === 'SUPER_ADMIN') {
      throw new Error('CANNOT_REVOKE_SUPER_ADMIN');
    }

    return prisma.userRole.update({
      where: { id: roleId },
      data: { isActive: false },
    });
  }

  /**
   * Get users with their roles
   */
  async getUsersWithRoles(hostelId: string) {
    return prisma.user.findMany({
      where: { hostelId, status: 'APPROVED' },
      select: {
        id: true,
        name: true,
        phone: true,
        rollNumber: true,
        userRoles: {
          where: { isActive: true },
          select: {
            id: true,
            role: true,
            year: true,
            month: true,
            assignedAt: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Assign 3 managers for a month (Mess Prefect action)
   */
  async assignManagers(data: {
    userIds: string[];
    hostelId: string;
    year: number;
    month: number;
    assignedBy: string;
  }) {
    if (data.userIds.length > 3) {
      throw new Error('MAX_3_MANAGERS');
    }

    // Deactivate existing managers for this month
    await prisma.userRole.updateMany({
      where: {
        hostelId: data.hostelId,
        role: 'MANAGER',
        year: data.year,
        month: data.month,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Assign new managers
    const managers = await Promise.all(
      data.userIds.map((userId) =>
        prisma.userRole.upsert({
          where: {
            userId_role_hostelId_year_month: {
              userId,
              role: 'MANAGER',
              hostelId: data.hostelId,
              year: data.year,
              month: data.month,
            },
          },
          update: { isActive: true, assignedBy: data.assignedBy },
          create: {
            userId,
            hostelId: data.hostelId,
            role: 'MANAGER',
            year: data.year,
            month: data.month,
            assignedBy: data.assignedBy,
          },
        })
      )
    );

    return managers;
  }

  /**
   * Get managers for a specific month
   */
  async getManagers(hostelId: string, year: number, month: number) {
    return prisma.userRole.findMany({
      where: {
        hostelId,
        role: 'MANAGER',
        year,
        month,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            rollNumber: true,
          },
        },
      },
    });
  }
}

export const roleService = new RoleService();
