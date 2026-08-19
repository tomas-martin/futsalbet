import { Router } from 'express';
import { getProdeRanking } from '../controllers/ranking.controller';

export const rankingRouter = Router();

rankingRouter.get('/prode', getProdeRanking);