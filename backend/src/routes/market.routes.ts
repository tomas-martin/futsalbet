import { Router } from 'express';
import { getMarket, updateMarket, updateMarketOptionOdds } from '../controllers/market.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

export const marketRouter = Router();

marketRouter.get('/:id', getMarket);

// Admin routes
marketRouter.put('/:id', authenticate, requireAdmin, updateMarket);
marketRouter.put('/:id/options/:optionId/odds', authenticate, requireAdmin, updateMarketOptionOdds);
