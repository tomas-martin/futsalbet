import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

const createPredictionSchema = z.object({
  matchId: z.string().min(1),
  predictedHome: z.number().int().min(0),
  predictedAway: z.number().int().min(0),
});

export const createPrediction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createPredictionSchema.parse(req.body);
    const userId = req.user!.id;

    const match = await prisma.match.findUnique({ where: { id: data.matchId } });
    if (!match) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    if (match.status !== 'SCHEDULED') {
      res.status(400).json({ error: 'No se pueden enviar pronósticos para partidos que no están programados' });
      return;
    }

    // upsert prediction (create or update)
    const prediction = await prisma.prediction.upsert({
      where: { userId_matchId: { userId, matchId: data.matchId } },
      create: {
        userId,
        matchId: data.matchId,
        predictedHome: data.predictedHome,
        predictedAway: data.predictedAway,
      },
      update: {
        predictedHome: data.predictedHome,
        predictedAway: data.predictedAway,
      },
    });

    res.status(201).json({ message: 'Pronóstico guardado', prediction });
  } catch (error) {
    next(error);
  }
};

export const getMyPredictions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const preds = await prisma.prediction.findMany({
      where: { userId },
      include: { match: { include: { homeTeam: true, awayTeam: true, tournament: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: preds });
  } catch (error) {
    next(error);
  }
};
