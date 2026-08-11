import { Router } from 'express';
import { getTeams, getTeamById, createTeam, updateTeam } from '../controllers/team.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

export const teamRouter = Router();

teamRouter.get('/', getTeams);
teamRouter.get('/:id', getTeamById);

// Admin routes
teamRouter.post('/', authenticate, requireAdmin, createTeam);
teamRouter.put('/:id', authenticate, requireAdmin, updateTeam);
