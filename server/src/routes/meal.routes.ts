import { Router, Request, Response } from 'express';
import { mealService } from '../services/meal.service';
import { authenticate } from '../middleware/auth';
import { requireManager, requireMaintenancePrefect } from '../middleware/roleGuard';
import { validateBody } from '../middleware/validate';
import { mealPreferenceSchema, mealOverrideSchema, globalToggleSchema } from '../utils/validators';
import { holidayService } from '../services/holiday.service';
import { prisma } from '../config/database';

const router = Router();

router.use(authenticate);

// GET /api/meals/slots - Get hostel's meal slots (used by menu editor)
router.get('/slots', async (req: Request, res: Response) => {
  try {
    const slots = await prisma.mealSlot.findMany({
      where: { hostelId: req.user!.hostelId },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, cutoffTime: true },
    });
    res.json(slots);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/meals/status - Get own meal status for today + upcoming week
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await mealService.getMealStatus(req.user!.userId, req.user!.hostelId);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/meals/preference - Set meal preference (effective from a date)
router.put('/preference', validateBody(mealPreferenceSchema), async (req: Request, res: Response) => {
  try {
    const result = await mealService.setPreference({
      userId: req.user!.userId,
      hostelId: req.user!.hostelId,
      ...req.body,
    });
    res.json(result);
  } catch (error: any) {
    const errorMap: Record<string, { status: number; message: string }> = {
      MEAL_SLOT_NOT_FOUND: { status: 404, message: 'Meal slot not found' },
      CUTOFF_PASSED: { status: 400, message: 'Cutoff time has passed for this meal' },
      CANNOT_MODIFY_PAST: { status: 400, message: 'Cannot modify meals for past dates' },
      MEALS_GLOBALLY_DISABLED: { status: 400, message: 'Meals are currently disabled' },
      HOLIDAY_MEALS_DISABLED: { status: 400, message: 'Meals are disabled for this holiday' },
    };
    const err = errorMap[error.message] || { status: 500, message: error.message };
    res.status(err.status).json({ error: err.message });
  }
});

// PUT /api/meals/override - Override for a specific date
router.put('/override', validateBody(mealOverrideSchema), async (req: Request, res: Response) => {
  console.log('[PUT /meals/override] body:', JSON.stringify(req.body));
  try {
    const result = await mealService.setOverride({
      userId: req.user!.userId,
      hostelId: req.user!.hostelId,
      ...req.body,
    });
    res.json(result);
  } catch (error: any) {
    console.error('[PUT /meals/override] error:', error.message);
    const errorMap: Record<string, { status: number; message: string }> = {
      MEAL_SLOT_NOT_FOUND: { status: 404, message: 'Meal slot not found' },
      CUTOFF_PASSED: { status: 400, message: 'Cutoff time has passed for this meal' },
      CANNOT_MODIFY_PAST: { status: 400, message: 'Cannot modify meals for past dates' },
      MEALS_GLOBALLY_DISABLED: { status: 400, message: 'Meals are currently disabled' },
      HOLIDAY_MEALS_DISABLED: { status: 400, message: 'Meals are disabled for this holiday' },
    };
    const err = errorMap[error.message] || { status: 500, message: error.message };
    res.status(err.status).json({ error: err.message });
  }
});

// GET /api/meals/count/:date/:slotId - Get meal count (Manager)
router.get('/count/:date/:slotId', requireManager, async (req: Request, res: Response) => {
  try {
    const count = await mealService.getMealCount(
      req.user!.hostelId,
      String(req.params.date),
      String(req.params.slotId)
    );
    res.json(count);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/meals/students/:date/:slotId - Get students with meal ON (Manager)
router.get('/students/:date/:slotId', requireManager, async (req: Request, res: Response) => {
  try {
    const students = await mealService.getStudentsWithMealOn(
      req.user!.hostelId,
      String(req.params.date),
      String(req.params.slotId)
    );
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/meals/global-toggle - Enable/disable meals globally (Maintenance Prefect)
router.put('/global-toggle', requireMaintenancePrefect, validateBody(globalToggleSchema), async (req: Request, res: Response) => {
  try {
    const result = await holidayService.toggleGlobalMeals({
      hostelId: req.user!.hostelId,
      toggledBy: req.user!.userId,
      ...req.body,
    });
    res.json({ message: 'Global meal toggle updated', result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/meals/global-status - Get global meal status
router.get('/global-status', async (req: Request, res: Response) => {
  try {
    const status = await holidayService.getGlobalStatus(req.user!.hostelId);
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/meals/today-stats - Public stats for today (all authenticated users)
router.get('/today-stats', async (req: Request, res: Response) => {
  try {
    const slots = await mealService.getTodayStats(req.user!.hostelId);
    res.json(slots);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
