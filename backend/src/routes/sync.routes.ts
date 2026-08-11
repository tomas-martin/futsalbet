import { Router } from 'express';
import { triggerSync, getSyncStatus } from '../controllers/sync.controller';

export const syncRouter = Router();

// GET /api/sync — estado
syncRouter.get('/', getSyncStatus);

// POST /api/sync/scorefy — trigger manual o cron
syncRouter.post('/scorefy', triggerSync);

// GET /api/sync/scorefy — Vercel Cron usa GET
syncRouter.get('/scorefy', triggerSync);
