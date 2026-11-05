/**
 * BTMeals TypeScript Type Definitions
 */

// ========================
// USER & AUTH
// ========================

export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type RoleName =
  | 'SUPER_ADMIN'
  | 'MAINTENANCE_PREFECT'
  | 'MESS_PREFECT'
  | 'MANAGER'
  | 'STUDENT'
  | 'AUDITOR'
  | 'LIBRARIAN'
  | 'GAME_PREFECT'
  | 'COOKING_STAFF';

export type MealPreference = 'VEG' | 'NON_VEG';

export interface Hostel {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  rollNumber: string;
  roomNumber?: string;
  status: UserStatus;
  hostel: Hostel;
  roles: RoleName[];
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ========================
// MEAL SYSTEM
// ========================

export interface MealSlotStatus {
  slotId: string;
  slotName: string;
  cutoffTime: string;
  isOn: boolean;
  preference: MealPreference;
  source: 'override' | 'default' | 'none';
}

export interface DayMealStatus {
  date: string;
  globalDisabled: boolean;
  holiday: boolean;
  reason?: string;
  slots: MealSlotStatus[];
}

// ========================
// MENU
// ========================

export interface MenuItem {
  id: string;
  slotId: string;
  slotName: string;
  items: string[];
  menuType: MealPreference;
}

export interface DayMenu {
  dayOfWeek: number;
  dayName: string;
  meals: MenuItem[];
}

// ========================
// ATTENDANCE
// ========================

export interface AttendanceRecord {
  userId: string;
  name: string;
  rollNumber: string;
  roomNumber?: string;
  wasPresent: boolean;
  preferenceUsed: MealPreference;
}

export interface MyAttendanceRecord {
  date: string;
  slotName: string;
  wasPresent: boolean;
  preferenceUsed: MealPreference;
}

// ========================
// MEAL COUNT
// ========================

export interface MealCount {
  totalOn: number;
  vegCount: number;
  nonVegCount: number;
  totalStudents: number;
}

// ========================
// NOTIFICATIONS
// ========================

export type NotificationType =
  | 'MEAL_REMINDER'
  | 'STATUS_CHANGE'
  | 'MENU_UPDATE'
  | 'ROLE_ASSIGNED'
  | 'HOLIDAY'
  | 'GENERAL';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

// ========================
// HOLIDAYS
// ========================

export interface Holiday {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  mealsDisabled: boolean;
  creator: { name: string };
  createdAt: string;
}

// ========================
// PAGINATION
// ========================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ========================
// STUDENT (for manager views)
// ========================

export interface StudentMealInfo {
  id: string;
  name: string;
  rollNumber: string;
  roomNumber?: string;
  preference: MealPreference;
}
