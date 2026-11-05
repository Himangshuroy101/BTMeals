import { Router, Request, Response } from 'express';
import { userService } from '../services/user.service';
import { authenticate } from '../middleware/auth';
import { requireMaintenancePrefect, requireMessPrefect } from '../middleware/roleGuard';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema } from '../utils/validators';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/users/me - Get own profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    const profile = await userService.getProfile(req.user!.userId);
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/me - Update own profile
router.put('/me', validateBody(updateProfileSchema), async (req: Request, res: Response) => {
  try {
    const updated = await userService.updateProfile(req.user!.userId, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/pending - List pending registrations (Maintenance Prefect)
router.get('/pending', requireMaintenancePrefect, async (req: Request, res: Response) => {
  try {
    const users = await userService.getPendingUsers(req.user!.hostelId);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id/approve - Approve a student (Maintenance Prefect)
router.put('/:id/approve', requireMaintenancePrefect, async (req: Request, res: Response) => {
  try {
    const user = await userService.approveUser(String(req.params.id), req.user!.hostelId);
    res.json({ message: 'User approved successfully', user });
  } catch (error: any) {
    const errorMap: Record<string, { status: number; message: string }> = {
      USER_NOT_FOUND: { status: 404, message: 'User not found' },
      USER_NOT_PENDING: { status: 400, message: 'User is not in pending status' },
    };
    const err = errorMap[error.message] || { status: 500, message: error.message };
    res.status(err.status).json({ error: err.message });
  }
});

// PUT /api/users/:id/reject - Reject a student (Maintenance Prefect)
router.put('/:id/reject', requireMaintenancePrefect, async (req: Request, res: Response) => {
  try {
    const user = await userService.rejectUser(String(req.params.id), req.user!.hostelId);
    res.json({ message: 'User rejected', user });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT /api/users/:id/suspend - Suspend a student (Maintenance Prefect)
router.put('/:id/suspend', requireMaintenancePrefect, async (req: Request, res: Response) => {
  try {
    await userService.suspendUser(String(req.params.id), req.user!.hostelId);
    res.json({ message: 'User suspended' });
  } catch (error: any) {
    if (error.message === 'USER_NOT_FOUND') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// GET /api/users - List all approved users (Maintenance Prefect OR Mess Prefect)
router.get('/', requireMessPrefect, async (req: Request, res: Response) => {
  try {
    const users = await userService.getApprovedUsers(req.user!.hostelId);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
