import { Request, Response, NextFunction } from 'express';
import { syncFromScorefy } from '../services/scorefySync.service';

// Secret para proteger el endpoint de cron (solo Vercel puede llamarlo)
const CRON_SECRET = process.env.CRON_SECRET || 'futsalbet_cron_secret_2026';

export const triggerSync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verificar autorización — Vercel manda este header en cron jobs
    const authHeader = req.headers.authorization;
    const cronSecret = req.query.secret as string;

    if (authHeader !== `Bearer ${CRON_SECRET}` && cronSecret !== CRON_SECRET) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    console.log('🔄 Iniciando sync con Scorefy...');
    const result = await syncFromScorefy();

    res.json({
      ok: result.success,
      message: result.message,
      stats: result.stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    next(error);
  }
};

// Endpoint público para ver el estado del último sync (sin auth)
export const getSyncStatus = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    service: 'FutsalBet Sync Service',
    source: 'https://scorefy.app/futsal/mendoza/fefusa-mendoza/FFM-P-M-FSP-C-2026',
    schedule: 'Cada hora (Vercel Cron)',
    timestamp: new Date().toISOString(),
  });
};
