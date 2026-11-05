import { Router, Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { authenticate } from '../middleware/auth';
import { requireManager } from '../middleware/roleGuard';
import { validateBody } from '../middleware/validate';
import { markAttendanceSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

// GET /api/attendance/:date/:slotId - Get attendance list (Manager)
router.get('/:date/:slotId', requireManager, async (req: Request, res: Response) => {
  try {
    const list = await attendanceService.getAttendanceList(
      req.user!.hostelId,
      String(req.params.date),
      String(req.params.slotId)
    );
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/attendance/mark - Mark attendance bulk (Manager)
router.post('/mark', requireManager, validateBody(markAttendanceSchema), async (req: Request, res: Response) => {
  try {
    const result = await attendanceService.markAttendance({
      ...req.body,
      markedBy: req.user!.userId,
    });
    res.json({ message: 'Attendance marked successfully', ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/attendance/my-history - Get own attendance history
router.get('/my-history', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const history = await attendanceService.getMyHistory(req.user!.userId, page, limit);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
