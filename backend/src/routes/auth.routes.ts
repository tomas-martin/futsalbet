import { Router } from 'express';
import { supabaseAuth, registerDirectly, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const authRouter = Router();

authRouter.post('/register', registerDirectly);
authRouter.post('/supabase', supabaseAuth);
authRouter.get('/me', authenticate, getMe);