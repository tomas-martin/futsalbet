import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', getNotifications);
notificationRouter.put('/:id/read', markAsRead);
