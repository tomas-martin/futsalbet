import { Router } from 'express';
import {
  getMatches,
  getLiveMatches,
  getUpcomingMatches,
  getResults,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  addMatchEvent,
  settleMatch,
  notifyRoundMatches,
} from '../controllers/match.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

export const matchRouter = Router();

matchRouter.get('/', getMatches);
matchRouter.get('/live', getLiveMatches);
matchRouter.get('/upcoming', getUpcomingMatches);
matchRouter.get('/results', getResults);

// Admin routes - specific paths first
matchRouter.post('/notify-round', authenticate, requireAdmin, notifyRoundMatches);
matchRouter.post('/', authenticate, requireAdmin, createMatch);

matchRouter.get('/:id', getMatchById);
matchRouter.put('/:id', authenticate, requireAdmin, updateMatch);
matchRouter.delete('/:id', authenticate, requireAdmin, deleteMatch);
matchRouter.post('/:id/events', authenticate, requireAdmin, addMatchEvent);
matchRouter.post('/:id/settle', authenticate, requireAdmin, settleMatch);
