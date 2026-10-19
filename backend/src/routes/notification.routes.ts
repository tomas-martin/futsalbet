import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  registerDeviceToken,
  unregisterDeviceToken,
  sendTestPush,
} from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', getNotifications);
notificationRouter.put('/:id/read', markAsRead);
notificationRouter.post('/device-token', registerDeviceToken);
notificationRouter.delete('/device-token', unregisterDeviceToken);
notificationRouter.post('/test-push', sendTestPush);
