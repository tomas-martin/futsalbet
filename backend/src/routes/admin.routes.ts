import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  updateUserStatus,
  getAuditLogs,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/stats', getAdminStats);
adminRouter.get('/users', getAdminUsers);
adminRouter.put('/users/:id', updateUserStatus);
adminRouter.get('/logs', getAuditLogs);
