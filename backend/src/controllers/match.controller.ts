import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { updateMatchSchema, createMatchSchema, createMatchEventSchema } from '../validators/schemas';
import { BetSettlementService } from '../services/betSettlement.service';
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
          _count: { select: { markets: true } },
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
        markets: {
          where: { status: 'OPEN' },
          select: { id: true, type: true, name: true },
        },
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
        markets: {
          include: {
            options: { orderBy: { odds: 'asc' } },
          },
        },
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

export const getMatchMarkets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const markets = await prisma.market.findMany({
      where: { matchId: req.params.id },
      include: {
        options: { where: { isActive: true }, orderBy: { odds: 'asc' } },
      },
    });

    res.json({ data: markets });
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

    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        ...data,
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
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

    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        status: MatchStatus.FINISHED,
      },
    });

    // Settle all bets for this match
    const result = await BetSettlementService.settleMatch(match.id);

    res.json({
      message: 'Partido finalizado y apuestas resueltas',
      match,
      settlement: result,
    });
  } catch (error) {
    next(error);
  }
};
