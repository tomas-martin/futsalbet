import { Router } from 'express';
import { getWallet, getTransactions } from '../controllers/wallet.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const walletRouter = Router();

walletRouter.use(authenticate);

walletRouter.get('/', getWallet);
walletRouter.get('/transactions', getTransactions);
