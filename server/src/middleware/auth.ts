import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { resolveActiveRoles } from '../utils/roleResolver';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        hostelId: string;
        roles: string[];
      };
    }
  }
}

/**
 * Middleware to verify JWT access token and attach user info to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Fetch active roles for the user and resolve against validity windows
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: payload.userId,
        hostelId: payload.hostelId,
        isActive: true,
      },
      select: {
        role: true,
        year: true,
        month: true,
        isActive: true,
      },
    });

    req.user = {
      userId: payload.userId,
      hostelId: payload.hostelId,
      roles: resolveActiveRoles(userRoles),
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
};
