import { Request, Response, NextFunction } from 'express';

/**
 * Middleware factory to check if user has one of the required roles.
 * Must be used AFTER the authenticate middleware.
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.roles,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is a Super Admin
 */
export const requireSuperAdmin = requireRole('SUPER_ADMIN');

/**
 * Middleware to check if user is Maintenance Prefect or Super Admin
 */
export const requireMaintenancePrefect = requireRole('SUPER_ADMIN', 'MAINTENANCE_PREFECT');

/**
 * Middleware to check if user is Mess Prefect or Super Admin
 */
export const requireMessPrefect = requireRole('SUPER_ADMIN', 'MESS_PREFECT');

/**
 * Middleware to check if user is a Manager or higher
 */
export const requireManager = requireRole('SUPER_ADMIN', 'MESS_PREFECT', 'MANAGER');
