import { Router } from 'express';
import {
  getTournaments,
  getTournamentById,
  getTournamentStandings,
  getTournamentMatches,
  createTournament,
  updateTournament,
} from '../controllers/tournament.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

export const tournamentRouter = Router();

tournamentRouter.get('/', getTournaments);
tournamentRouter.get('/:id', getTournamentById);
tournamentRouter.get('/:id/standings', getTournamentStandings);
tournamentRouter.get('/:id/matches', getTournamentMatches);

// Admin routes
tournamentRouter.post('/', authenticate, requireAdmin, createTournament);
tournamentRouter.put('/:id', authenticate, requireAdmin, updateTournament);
