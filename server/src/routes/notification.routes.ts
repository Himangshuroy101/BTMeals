import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /api/notifications - Get own notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await notificationService.getUserNotifications(req.user!.userId, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    await notificationService.markAsRead(String(req.params.id), req.user!.userId);
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    await notificationService.markAllAsRead(req.user!.userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
