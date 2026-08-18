import { Router } from 'express';
import { getRanking, getProdeRanking } from '../controllers/ranking.controller';

export const rankingRouter = Router();

rankingRouter.get('/prode', getProdeRanking);
rankingRouter.get('/', getRanking);
