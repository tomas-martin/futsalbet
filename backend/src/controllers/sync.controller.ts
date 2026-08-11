import { Request, Response, NextFunction } from 'express';
import { syncFromScorefy } from '../services/scorefySync.service';

// Secret para proteger el endpoint de cron o triggers manuales.
const CRON_SECRET = process.env.CRON_SECRET || 'futsalbet_cron_secret_2026';

function isValidSyncRequest(req: Request): boolean {
  const authHeader = String(req.headers.authorization || '');
  const cronSecret = String(req.query.secret || '');
  const isBearerAuth = authHeader === 'Bearer ' + CRON_SECRET;
  const isSecretQuery = cronSecret === CRON_SECRET;
  const isVercelCron = String(req.headers['x-vercel-cron'] || '').toLowerCase() === 'true';
  return isBearerAuth || isSecretQuery || isVercelCron;
}

export const triggerSync = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!isValidSyncRequest(req)) {
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
    schedule: 'Manual o cron externo. Vercel Hobby solo permite cron diarios.',
    timestamp: new Date().toISOString(),
  });
};
