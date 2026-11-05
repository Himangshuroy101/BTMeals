import { Router, Request, Response } from 'express';
import { roleService } from '../services/role.service';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin, requireMessPrefect } from '../middleware/roleGuard';
import { validateBody } from '../middleware/validate';
import { assignRoleSchema, assignManagersSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

// POST /api/roles/assign - Assign a role (Super Admin)
router.post('/assign', requireSuperAdmin, validateBody(assignRoleSchema), async (req: Request, res: Response) => {
  try {
    const role = await roleService.assignRole({
      ...req.body,
      hostelId: req.user!.hostelId,
      assignedBy: req.user!.userId,
    });
    res.status(201).json({ message: 'Role assigned successfully', role });
  } catch (error: any) {
    const errorMap: Record<string, { status: number; message: string }> = {
      USER_NOT_FOUND: { status: 404, message: 'User not found in this hostel' },
      CANNOT_ASSIGN_SUPER_ADMIN: { status: 403, message: 'Cannot assign Super Admin role' },
      ROLE_ALREADY_ASSIGNED: { status: 409, message: 'This role is already assigned to the user' },
    };
    const err = errorMap[error.message] || { status: 500, message: error.message };
    res.status(err.status).json({ error: err.message });
  }
});

// DELETE /api/roles/:id - Revoke a role (Super Admin)
router.delete('/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    await roleService.revokeRole(String(req.params.id), req.user!.hostelId);
    res.json({ message: 'Role revoked successfully' });
  } catch (error: any) {
    const errorMap: Record<string, { status: number; message: string }> = {
      ROLE_NOT_FOUND: { status: 404, message: 'Role not found' },
      CANNOT_REVOKE_SUPER_ADMIN: { status: 403, message: 'Cannot revoke Super Admin role' },
    };
    const err = errorMap[error.message] || { status: 500, message: error.message };
    res.status(err.status).json({ error: err.message });
  }
});

// GET /api/roles/users - List users with their roles (Super Admin)
router.get('/users', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const users = await roleService.getUsersWithRoles(req.user!.hostelId);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/roles/assign-managers - Assign managers for a month (Mess Prefect)
router.post('/assign-managers', requireMessPrefect, validateBody(assignManagersSchema), async (req: Request, res: Response) => {
  try {
    const managers = await roleService.assignManagers({
      ...req.body,
      hostelId: req.user!.hostelId,
      assignedBy: req.user!.userId,
    });
    res.status(201).json({ message: 'Managers assigned successfully', managers });
  } catch (error: any) {
    if (error.message === 'MAX_3_MANAGERS') {
      res.status(400).json({ error: 'Maximum 3 managers can be assigned per month' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// GET /api/roles/managers/:year/:month - Get managers for a month
router.get('/managers/:year/:month', async (req: Request, res: Response) => {
  try {
    const year = parseInt(String(req.params.year));
    const month = parseInt(String(req.params.month));
    const managers = await roleService.getManagers(req.user!.hostelId, year, month);
    res.json(managers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
