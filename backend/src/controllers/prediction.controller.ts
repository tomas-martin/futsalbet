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

    // Prevent predictions after match has started — either status is no longer SCHEDULED
    // or the scheduledAt timestamp is in the past.
    const now = new Date();
    if (match.status !== 'SCHEDULED' || new Date(match.scheduledAt) <= now) {
      res.status(400).json({ error: 'No se pueden enviar pronósticos para partidos que ya comenzaron o que no están programados' });
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

export const getPredictionsByMatch = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matchId = req.params.matchId;
    const preds = await prisma.prediction.findMany({
      where: { matchId },
      include: { user: { select: { id: true, username: true, displayName: true, email: true } }, match: { include: { homeTeam: true, awayTeam: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: preds });
  } catch (error) {
    next(error);
  }
};

export const deletePrediction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;
    const pred = await prisma.prediction.delete({ where: { id } });
    res.json({ message: 'Predicción eliminada', prediction: pred });
  } catch (error) {
    next(error);
  }
};
