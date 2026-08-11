import { Router } from 'express';
import { register, login, getMe, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getMe);
authRouter.put('/change-password', authenticate, changePassword);
