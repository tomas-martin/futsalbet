import { Router } from 'express';
import { createPrediction, createBatchPredictions, getMyPredictions, getPredictionsByMatch, deletePrediction } from '../controllers/prediction.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

export const predictionRouter = Router();

predictionRouter.post('/', authenticate, createPrediction);
predictionRouter.post('/batch', authenticate, createBatchPredictions);
predictionRouter.get('/my', authenticate, getMyPredictions);
// Admin endpoints
predictionRouter.get('/match/:matchId', authenticate, requireAdmin, getPredictionsByMatch);
predictionRouter.delete('/:id', authenticate, requireAdmin, deletePrediction);

