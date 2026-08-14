import { Router } from 'express';
import { createPrediction, getMyPredictions } from '../controllers/prediction.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const predictionRouter = Router();

predictionRouter.post('/', authenticate, createPrediction);
predictionRouter.get('/my', authenticate, getMyPredictions);
