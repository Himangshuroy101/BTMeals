import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  phone: z.string().min(10).max(15).regex(/^\d+$/, 'Phone must contain only digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  rollNumber: z.string().min(1, 'Roll number is required'),
  roomNumber: z.string().optional(),
  hostelCode: z.string().min(1, 'Hostel code is required'),
});

export const loginSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const updateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1),
});

// User schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  roomNumber: z.string().optional(),
});

// Role schemas
export const assignRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum([
    'MAINTENANCE_PREFECT',
    'MESS_PREFECT',
    'MANAGER',
    'AUDITOR',
    'LIBRARIAN',
    'GAME_PREFECT',
    'COOKING_STAFF',
  ]),
  year: z.number().int().optional().default(new Date().getFullYear()),
  month: z.number().int().min(0).max(12).optional().default(0),
});

export const assignManagersSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(3),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
});

// Meal schemas
export const mealPreferenceSchema = z.object({
  mealSlotId: z.string().uuid(),
  isOn: z.boolean(),
  preference: z.enum(['VEG', 'NON_VEG']).optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});

export const mealOverrideSchema = z.object({
  mealSlotId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  isOn: z.boolean(),
  preference: z.enum(['VEG', 'NON_VEG']).optional(),
});

// Menu schemas
export const weeklyMenuSchema = z.object({
  mealSlotId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  items: z.array(z.string().min(1)),
  menuType: z.enum(['VEG', 'NON_VEG']),
});

export const weeklyMenuBulkSchema = z.object({
  menus: z.array(weeklyMenuSchema),
});

// Attendance schemas
export const markAttendanceSchema = z.object({
  mealSlotId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  attendance: z.array(z.object({
    userId: z.string().uuid(),
    wasPresent: z.boolean(),
    preferenceUsed: z.enum(['VEG', 'NON_VEG']),
  })),
});

// Holiday schemas
export const createHolidaySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
  mealsDisabled: z.boolean().default(true),
});

// Global toggle schema
export const globalToggleSchema = z.object({
  isMealsEnabled: z.boolean(),
  reason: z.string().optional(),
});

// Notification schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
