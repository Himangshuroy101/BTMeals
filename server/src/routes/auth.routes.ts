import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateFcmTokenSchema,
} from '../utils/validators';

const router = Router();

// POST /api/auth/register
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      message: 'Registration successful. Waiting for approval.',
      user,
    });
  } catch (error: any) {
    const errorMap: Record<string, { status: number; message: string }> = {
      HOSTEL_NOT_FOUND: { status: 404, message: 'Hostel not found' },
      HOSTEL_INACTIVE: { status: 400, message: 'Hostel is currently inactive' },
      PHONE_ALREADY_REGISTERED: { status: 409, message: 'Phone number already registered' },
    };
    const err = errorMap[error.message] || { status: 500, message: error.message };
    res.status(err.status).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body.phone, req.body.password);
    res.json(result);
  } catch (error: any) {
    const errorMap: Record<string, { status: number; message: string }> = {
      INVALID_CREDENTIALS: { status: 401, message: 'Invalid phone or password' },
      ACCOUNT_REJECTED: { status: 403, message: 'Your account has been rejected' },
      ACCOUNT_SUSPENDED: { status: 403, message: 'Your account has been suspended' },
    };
    const err = errorMap[error.message] || { status: 500, message: error.message };
    res.status(err.status).json({ error: err.message });
  }
});

// POST /api/auth/refresh
router.post('/refresh', validateBody(refreshTokenSchema), async (req: Request, res: Response) => {
  try {
    const tokens = await authService.refreshToken(req.body.refreshToken);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, validateBody(changePasswordSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.changePassword(
      req.user!.userId,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.json(result);
  } catch (error: any) {
    if (error.message === 'CURRENT_PASSWORD_INCORRECT') {
      res.status(400).json({ error: 'Current password is incorrect' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT /api/auth/fcm-token
router.put('/fcm-token', authenticate, validateBody(updateFcmTokenSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.updateFcmToken(req.user!.userId, req.body.fcmToken);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
