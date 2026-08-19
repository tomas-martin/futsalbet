import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { updateMatchSchema, createMatchSchema, createMatchEventSchema } from '../validators/schemas';
import { PredictionSettlementService } from '../services/predictionSettlement.service';
import { MatchStatus } from '@prisma/client';

export const getMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, tournamentId, teamId, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (tournamentId) where.tournamentId = tournamentId;
    if (teamId) where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        orderBy: { scheduledAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        include: {
          homeTeam: { select: { id: true, name: true, logoUrl: true, shortName: true } },
          awayTeam: { select: { id: true, name: true, logoUrl: true, shortName: true } },
          tournament: { select: { id: true, name: true, logoUrl: true } },
        },
      }),
      prisma.match.count({ where }),
    ]);

    res.json({
      data: matches,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLiveMatches = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: MatchStatus.LIVE },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true, shortName: true } },
        tournament: { select: { id: true, name: true, logoUrl: true } },
        events: { orderBy: { minute: 'desc' }, take: 5 },
      },
    });
    res.json({ data: matches });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingMatches = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({
      where: {
        status: MatchStatus.SCHEDULED,
        scheduledAt: { gte: new Date() },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true, shortName: true } },
        tournament: { select: { id: true, name: true, logoUrl: true } },
      },
    });
    res.json({ data: matches });
  } catch (error) {
    next(error);
  }
};

export const getResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where: { status: MatchStatus.FINISHED },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          homeTeam: { select: { id: true, name: true, logoUrl: true, shortName: true } },
          awayTeam: { select: { id: true, name: true, logoUrl: true, shortName: true } },
          tournament: { select: { id: true, name: true } },
        },
      }),
      prisma.match.count({ where: { status: MatchStatus.FINISHED } }),
    ]);

    res.json({ data: matches, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const getMatchById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: {
          include: {
            standings: {
              orderBy: { position: 'asc' },
              take: 12,
              include: { team: { select: { name: true, logoUrl: true } } },
            },
          },
        },
        events: { orderBy: { minute: 'asc' } },
      },
    });

    if (!match) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    res.json(match);
  } catch (error) {
    next(error);
  }
};

export const createMatch = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createMatchSchema.parse(req.body);

    const match = await prisma.match.create({
      data: {
        tournamentId: data.tournamentId,
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        scheduledAt: new Date(data.scheduledAt),
        venue: data.venue,
        round: data.round,
        status: MatchStatus.SCHEDULED,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: true,
      },
    });

    res.status(201).json({ message: 'Partido creado', match });
  } catch (error) {
    next(error);
  }
};

export const updateMatch = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = updateMatchSchema.parse(req.body);

    const current = await prisma.match.findUnique({ where: { id: req.params.id } });
    if (!current) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    const keepScore = data.status === undefined || data.status === MatchStatus.FINISHED || data.status === MatchStatus.LIVE;

    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(!keepScore && { homeScore: null, awayScore: null, minute: null }),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    // If a finished match has its score corrected, re-score the prode from
    // scratch so points reflect the new result.
    if (match.status === MatchStatus.FINISHED && match.homeScore !== null && match.awayScore !== null) {
      await PredictionSettlementService.resettlePredictions(match.id);
    } else if (current.status === MatchStatus.FINISHED && match.status !== MatchStatus.FINISHED) {
      // Match reopened: predictions should go back to PENDING to be re-scored later.
      await PredictionSettlementService.resetPredictions(match.id);
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_MATCH',
        entity: 'Match',
        entityId: match.id,
        oldData: {
          scheduledAt: current.scheduledAt,
          status: current.status,
          homeScore: current.homeScore,
          awayScore: current.awayScore,
          venue: current.venue,
          round: current.round,
        },
        newData: {
          scheduledAt: match.scheduledAt,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          venue: match.venue,
          round: match.round,
        },
      },
    });

    res.json({ message: 'Partido actualizado', match });
  } catch (error) {
    next(error);
  }
};

export const addMatchEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createMatchEventSchema.parse(req.body);

    const event = await prisma.matchEvent.create({
      data: {
        matchId: req.params.id,
        ...data,
      },
    });

    res.status(201).json({ message: 'Evento registrado', event });
  } catch (error) {
    next(error);
  }
};

export const settleMatch = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { homeScore, awayScore } = req.body;

    if (homeScore === undefined || awayScore === undefined) {
      res.status(400).json({ error: 'Se requiere homeScore y awayScore' });
      return;
    }

    const current = await prisma.match.findUnique({ where: { id: req.params.id } });
    if (!current) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        status: MatchStatus.FINISHED,
      },
    });

    // Re-score from scratch: covers both first settlement and result corrections.
    const result = await PredictionSettlementService.resettlePredictions(match.id);

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'SETTLE_MATCH',
        entity: 'Match',
        entityId: match.id,
        oldData: { status: current.status, homeScore: current.homeScore, awayScore: current.awayScore },
        newData: { status: match.status, homeScore: match.homeScore, awayScore: match.awayScore },
      },
    });

    res.json({
      message: 'Partido finalizado y prode puntuado',
      match,
      settlement: result,
    });
  } catch (error) {
    next(error);
  }
};