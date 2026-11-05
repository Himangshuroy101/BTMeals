import { Router, Request, Response } from 'express';
import { menuService } from '../services/menu.service';
import { authenticate } from '../middleware/auth';
import { requireManager } from '../middleware/roleGuard';
import { validateBody } from '../middleware/validate';
import { weeklyMenuBulkSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

// GET /api/menu/weekly - Get weekly menu
router.get('/weekly', async (req: Request, res: Response) => {
  try {
    const menu = await menuService.getWeeklyMenu(req.user!.hostelId);
    res.json(menu);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/menu/today - Get today's menu
router.get('/today', async (req: Request, res: Response) => {
  try {
    const menu = await menuService.getTodayMenu(req.user!.hostelId);
    res.json(menu);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/menu/weekly - Set/update weekly menu (Manager)
router.put('/weekly', requireManager, validateBody(weeklyMenuBulkSchema), async (req: Request, res: Response) => {
  try {
    const result = await menuService.setWeeklyMenu({
      hostelId: req.user!.hostelId,
      menus: req.body.menus,
      setBy: req.user!.userId,
    });
    res.json({ message: 'Menu updated successfully', count: result.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
