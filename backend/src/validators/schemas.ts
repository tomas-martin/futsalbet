import { z } from 'zod';

export const supabaseAuthSchema = z.object({
  accessToken: z.string().min(1, 'Token de acceso requerido'),
});

export const updateMatchSchema = z.object({
  tournamentId: z.string().min(1).optional(),
  homeTeamId: z.string().min(1).optional(),
  awayTeamId: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().optional(),
  venue: z.string().optional(),
  round: z.string().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED']).optional(),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  minute: z.number().int().min(0).max(90).optional(),
});

export const createMatchSchema = z.object({
  tournamentId: z.string().min(1),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  venue: z.string().optional(),
  round: z.string().optional(),
});

export const createMatchEventSchema = z.object({
  minute: z.number().int().min(0).max(90),
  type: z.enum(['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION', 'OTHER']),
  teamId: z.string().optional(),
  playerName: z.string().optional(),
  description: z.string().optional(),
});

export const createPredictionSchema = z.object({
  matchId: z.string().min(1),
  predictedHome: z.number().int().min(0),
  predictedAway: z.number().int().min(0),
});