import { Router } from 'express';
import {
  getMatches,
  getLiveMatches,
  getUpcomingMatches,
  getResults,
  getMatchById,
  createMatch,
  updateMatch,
  addMatchEvent,
  settleMatch,
} from '../controllers/match.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

export const matchRouter = Router();

matchRouter.get('/', getMatches);
matchRouter.get('/live', getLiveMatches);
matchRouter.get('/upcoming', getUpcomingMatches);
matchRouter.get('/results', getResults);
matchRouter.get('/:id', getMatchById);

// Admin routes
matchRouter.post('/', authenticate, requireAdmin, createMatch);
matchRouter.put('/:id', authenticate, requireAdmin, updateMatch);
matchRouter.post('/:id/events', authenticate, requireAdmin, addMatchEvent);
matchRouter.post('/:id/settle', authenticate, requireAdmin, settleMatch);
