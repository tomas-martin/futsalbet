import { Router } from 'express';
import { getRanking } from '../controllers/ranking.controller';

export const rankingRouter = Router();

rankingRouter.get('/', getRanking);
