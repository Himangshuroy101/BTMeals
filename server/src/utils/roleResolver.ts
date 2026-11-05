/**
 * Role Duration Rules:
 * - SUPER_ADMIN     → Permanent (isActive = true forever, no year/month check)
 * - MANAGER         → 1 month  (valid only during the assigned month of the assigned year)
 * - All others      → 1 year   (valid during the assigned year, Super Admin can revoke anytime)
 *
 * Additionally, all non-SUPER_ADMIN users are also students — STUDENT is always
 * injected into the role list for approved users who are not SUPER_ADMIN.
 */

type RoleRecord = {
  role: string;
  year: number;
  month: number;
  isActive: boolean;
};

/**
 * Filter a user's DB role records to only those currently valid,
 * then inject STUDENT for non-Super-Admin users.
 */
export function resolveActiveRoles(userRoles: RoleRecord[]): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  const active = userRoles
    .filter((ur) => {
      if (!ur.isActive) return false;

      switch (ur.role) {
        case 'SUPER_ADMIN':
          // Permanent — no date restriction
          return true;

        case 'MANAGER':
          // Valid only during the assigned month of the assigned year
          return ur.year === currentYear && ur.month === currentMonth;

        default:
          // All other roles valid for the assigned year
          return ur.year === currentYear;
      }
    })
    .map((ur) => ur.role);

  const isSuperAdmin = active.includes('SUPER_ADMIN');

  // Non-Super-Admin approved users are always students too
  if (!isSuperAdmin && !active.includes('STUDENT')) {
    active.push('STUDENT');
  }

  return active;
}
