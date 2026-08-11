import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { authRouter } from './routes/auth.routes';
import { tournamentRouter } from './routes/tournament.routes';
import { teamRouter } from './routes/team.routes';
import { matchRouter } from './routes/match.routes';
import { betRouter } from './routes/bet.routes';
import { walletRouter } from './routes/wallet.routes';
import { rankingRouter } from './routes/ranking.routes';
import { favoriteRouter } from './routes/favorite.routes';
import { notificationRouter } from './routes/notification.routes';
import { adminRouter } from './routes/admin.routes';
import { marketRouter } from './routes/market.routes';
import { errorHandler } from './middlewares/error.middleware';
import { startCronJobs } from './utils/cron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===========================
// SECURITY MIDDLEWARES
// ===========================
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// General rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Demasiadas solicitudes. Intenta nuevamente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Demasiados intentos de autenticación. Intenta en 15 minutos.' },
});

// ===========================
// PARSING
// ===========================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.use(morgan('combined'));
}

// ===========================
// HEALTH CHECK
// ===========================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'FutsalBet API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    note: 'Plataforma recreativa — Solo puntos virtuales, sin dinero real',
  });
});

// ===========================
// ROUTES
// ===========================
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/tournaments', tournamentRouter);
app.use('/api/teams', teamRouter);
app.use('/api/matches', matchRouter);
app.use('/api/markets', marketRouter);
app.use('/api/bets', betRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/ranking', rankingRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/admin', adminRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Error handler
app.use(errorHandler);

// ===========================
// START (ONLY IN STANDALONE NODE ENV)
// ===========================
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 FutsalBet API corriendo en http://localhost:${PORT}`);
    console.log(`🎮 Plataforma recreativa — Solo puntos virtuales`);
  });

  startCronJobs();
}

export default app;
