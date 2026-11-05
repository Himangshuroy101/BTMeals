import { Router, Request, Response } from 'express';
import { holidayService } from '../services/holiday.service';
import { authenticate } from '../middleware/auth';
import { requireMaintenancePrefect } from '../middleware/roleGuard';
import { validateBody } from '../middleware/validate';
import { createHolidaySchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

// POST /api/holidays - Create a holiday (Maintenance Prefect)
router.post('/', requireMaintenancePrefect, validateBody(createHolidaySchema), async (req: Request, res: Response) => {
  try {
    const holiday = await holidayService.createHoliday({
      hostelId: req.user!.hostelId,
      createdBy: req.user!.userId,
      ...req.body,
    });
    res.status(201).json(holiday);
  } catch (error: any) {
    if (error.message === 'START_DATE_AFTER_END_DATE') {
      res.status(400).json({ error: 'Start date must be before end date' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// GET /api/holidays - List holidays
router.get('/', async (req: Request, res: Response) => {
  try {
    const holidays = await holidayService.getHolidays(req.user!.hostelId);
    res.json(holidays);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/holidays/:id - Delete a holiday (Maintenance Prefect)
router.delete('/:id', requireMaintenancePrefect, async (req: Request, res: Response) => {
  try {
    await holidayService.deleteHoliday(String(req.params.id), req.user!.hostelId);
    res.json({ message: 'Holiday deleted' });
  } catch (error: any) {
    if (error.message === 'HOLIDAY_NOT_FOUND') {
      res.status(404).json({ error: 'Holiday not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;
