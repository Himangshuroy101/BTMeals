import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { Prisma } from '@prisma/client';
import { resolveActiveRoles } from '../utils/roleResolver';

type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export class AuthService {
  /**
   * Register a new student
   */
  async register(data: {
    phone: string;
    password: string;
    name: string;
    rollNumber: string;
    roomNumber?: string;
    hostelCode: string;
  }) {
    // Find the hostel by code
    const hostel = await prisma.hostel.findUnique({
      where: { code: data.hostelCode },
    });

    if (!hostel) {
      throw new Error('HOSTEL_NOT_FOUND');
    }

    if (!hostel.isActive) {
      throw new Error('HOSTEL_INACTIVE');
    }

    // Check if phone already exists
    const existing = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new Error('PHONE_ALREADY_REGISTERED');
    }

    // Hash password and create user
    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        hostelId: hostel.id,
        phone: data.phone,
        passwordHash,
        name: data.name,
        rollNumber: data.rollNumber,
        roomNumber: data.roomNumber,
        status: 'PENDING' as UserStatus,
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
    });

    // Assign STUDENT role (inactive until approved)
    const currentYear = new Date().getFullYear();
    await prisma.userRole.create({
      data: {
        userId: user.id,
        hostelId: hostel.id,
        role: 'STUDENT',
        year: currentYear,
        isActive: false, // Will be activated upon approval
      },
    });

    return user;
  }

  /**
   * Login with phone and password
   */
  async login(phone: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        hostel: { select: { id: true, name: true, code: true } },
        userRoles: {
          where: { isActive: true },
          select: { role: true, year: true, month: true, isActive: true },
        },
      },
    });

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (user.status === 'REJECTED') {
      throw new Error('ACCOUNT_REJECTED');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('ACCOUNT_SUSPENDED');
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      hostelId: user.hostelId,
    });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        rollNumber: user.rollNumber,
        roomNumber: user.roomNumber,
        status: user.status,
        hostel: user.hostel,
        roles: resolveActiveRoles(user.userRoles),
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists and is not suspended
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, status: true, hostelId: true },
    });

    if (!user || user.status === 'SUSPENDED') {
      throw new Error('ACCOUNT_INVALID');
    }

    return generateTokenPair({
      userId: user.id,
      hostelId: user.hostelId,
    });
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('CURRENT_PASSWORD_INCORRECT');
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Update FCM token for push notifications
   */
  async updateFcmToken(userId: string, fcmToken: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    return { message: 'FCM token updated' };
  }
}

export const authService = new AuthService();
