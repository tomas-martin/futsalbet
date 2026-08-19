import { Router } from 'express';
import { supabaseAuth, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/supabase', supabaseAuth);
authRouter.get('/me', authenticate, getMe);