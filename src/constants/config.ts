/**
 * App configuration constants
 */

// API Base URL — change to your Oracle Cloud server URL in production
// export const API_BASE_URL = __DEV__
//   ? 'http://192.168.29.128:3000/api'  // Your PC's local IP — update if it changes
//   : 'https://your-oracle-cloud-domain.com/api';

export const API_BASE_URL = __DEV__
  ? 'http://192.168.31.81:3000/api'  // Your PC's local IP — update if it changes
  : 'https://your-oracle-cloud-domain.com/api';

// Meal slot cutoff times (for display purposes)
export const CUTOFF_TIMES = {
  Morning: '07:00 AM',
  Night: '05:00 PM',
} as const;

// Day names
export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
] as const;

// Short day names
export const DAY_NAMES_SHORT = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
] as const;

// Role display names
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  MAINTENANCE_PREFECT: 'Maintenance Prefect',
  MESS_PREFECT: 'Mess Prefect',
  MANAGER: 'Manager',
  STUDENT: 'Student',
  AUDITOR: 'Auditor',
  LIBRARIAN: 'Librarian',
  GAME_PREFECT: 'Game Prefect',
  COOKING_STAFF: 'Cooking Staff',
} as const;
