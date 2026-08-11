import { Router } from 'express';
import { createBet, getMyBets, getBetById } from '../controllers/bet.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const betRouter = Router();

betRouter.use(authenticate);

betRouter.post('/', createBet);
betRouter.get('/my', getMyBets);
betRouter.get('/:id', getBetById);
