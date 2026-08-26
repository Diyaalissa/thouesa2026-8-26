import { Router, Request, Response } from 'express';
import { db } from '../store';

export const notificationsRouter = Router();

// Track active SSE clients
const sseClients: Set<Response> = new Set();

/**
 * Broadcast event to all connected SSE clients
 */
export function broadcastNotification(notif: any) {
  const data = JSON.stringify(notif);
  sseClients.forEach((res) => {
    try {
      res.write(`event: notification\ndata: ${data}\n\n`);
    } catch {
      sseClients.delete(res);
    }
  });
}

/**
 * GET /api/notifications
 * Fetch notifications list with unread counter
 */
notificationsRouter.get('/', (req: Request, res: Response) => {
  const role = req.query.role as string;
  const userId = req.query.userId as string;

  let list = db.notifications;

  if (role && role !== 'ALL') {
    list = list.filter(
      (n) =>
        !n.targetRole ||
        n.targetRole === 'ALL' ||
        n.targetRole === role ||
        (userId && n.targetUserId === userId)
    );
  }

  const unreadCount = list.filter((n) => !n.isRead).length;

  res.json({
    success: true,
    notifications: list,
    unreadCount,
  });
});

/**
 * POST /api/notifications/mark-read
 */
notificationsRouter.post('/mark-read', (req: Request, res: Response) => {
  const { id } = req.body;
  const notif = db.notifications.find((n) => n.id === id);
  if (notif) {
    notif.isRead = true;
  }
  res.json({ success: true });
});

/**
 * POST /api/notifications/mark-all-read
 */
notificationsRouter.post('/mark-all-read', (req: Request, res: Response) => {
  const { role } = req.body;
  db.notifications.forEach((n) => {
    if (!role || n.targetRole === 'ALL' || n.targetRole === role) {
      n.isRead = true;
    }
  });
  res.json({ success: true });
});

/**
 * POST /api/notifications/create (Internal or test)
 */
notificationsRouter.post('/create', (req: Request, res: Response) => {
  const { type, titleAr, titleEn, messageAr, messageEn, targetRole, referenceId, priority } = req.body;
  if (!titleAr || !messageAr) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const created = db.pushNotification({
    type: type || 'SYSTEM_ALERT',
    titleAr,
    titleEn: titleEn || titleAr,
    messageAr,
    messageEn: messageEn || messageAr,
    targetRole: targetRole || 'ALL',
    referenceId,
    priority: priority || 'NORMAL',
  });

  broadcastNotification(created);

  res.status(201).json({
    success: true,
    notification: created,
  });
});

/**
 * GET /api/notifications/stream (Server-Sent Events)
 */
notificationsRouter.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // cPanel/LiteSpeed & Nginx friendly

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});
