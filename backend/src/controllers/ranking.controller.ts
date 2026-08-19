import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { PREDICTION_EXACT_POINTS } from '../services/predictionSettlement.service';

export const getProdeRanking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tournamentId = req.query.tournamentId as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const matchWhere = tournamentId ? { tournamentId } : {};

    // Only settled predictions count for the prode ranking.
    const predictions = await prisma.prediction.findMany({
      where: {
        match: matchWhere,
        result: { in: ['WON', 'LOST'] },
      },
      select: { userId: true, result: true, pointsEarned: true },
    });

    const totals = new Map<string, { points: number; predictions: number; won: number; exact: number }>();
    for (const p of predictions) {
      const entry = totals.get(p.userId) ?? { points: 0, predictions: 0, won: 0, exact: 0 };
      entry.predictions++;
      entry.points += p.pointsEarned;
      if (p.result === 'WON') {
        entry.won++;
        if (p.pointsEarned === PREDICTION_EXACT_POINTS) entry.exact++;
      }
      totals.set(p.userId, entry);
    }

    const userIds = [...totals.keys()];
    if (userIds.length === 0) {
      res.json({ data: [], pagination: { page, limit, total: 0, pages: 0 } });
      return;
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    const rows = users
      .filter((u) => totals.has(u.id))
      .map((u) => ({
        user: u,
        points: totals.get(u.id)!.points,
        predictions: totals.get(u.id)!.predictions,
        won: totals.get(u.id)!.won,
        exact: totals.get(u.id)!.exact,
      }))
      .sort((a, b) => b.points - a.points || b.won - a.won || a.user.displayName.localeCompare(b.user.displayName));

    const total = rows.length;
    const paged = rows.slice((page - 1) * limit, page * limit).map((row, idx) => ({
      rank: (page - 1) * limit + idx + 1,
      ...row,
    }));

    res.json({
      data: paged,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
