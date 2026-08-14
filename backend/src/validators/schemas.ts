import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario no puede tener más de 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guiones bajos'),
  displayName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export const createBetSchema = z.object({
  selections: z.array(z.object({
    marketOptionId: z.string().min(1, 'ID de opción requerido'),
  })).min(1, 'Debe seleccionar al menos una opción').max(10, 'Máximo 10 selecciones por apuesta'),
  stakeAmount: z.number()
    .positive('El monto debe ser positivo')
    .min(10, 'Monto mínimo: 10 puntos')
    .max(10000, 'Monto máximo: 10,000 puntos'),
});

export const updateMatchSchema = z.object({
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED']).optional(),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  minute: z.number().int().min(0).max(90).optional(),
  venue: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const createMatchSchema = z.object({
  tournamentId: z.string().min(1),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  venue: z.string().optional(),
  round: z.string().optional(),
});

export const updateOddsSchema = z.object({
  odds: z.number().positive().min(1.01, 'La cuota mínima es 1.01').max(1000, 'La cuota máxima es 1000'),
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
