import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getTournaments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { matches: true, standings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: tournaments });
  } catch (error) {
    next(error);
  }
};

export const getTournamentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tournament = await prisma.tournament.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      include: {
        categories: {
          include: {
            teams: { include: { team: true } },
          },
        },
        _count: { select: { matches: true, standings: true } },
      },
    });

    if (!tournament) {
      res.status(404).json({ error: 'Torneo no encontrado' });
      return;
    }

    res.json(tournament);
  } catch (error) {
    next(error);
  }
};

export const getTournamentStandings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const standings = await prisma.standing.findMany({
      where: { tournamentId: req.params.id },
      orderBy: [{ points: 'desc' }, { goalDiff: 'desc' }, { goalsFor: 'desc' }],
      include: {
        team: { select: { id: true, name: true, logoUrl: true, shortName: true } },
      },
    });
    res.json({ data: standings });
  } catch (error) {
    next(error);
  }
};

export const getTournamentMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({
      where: { tournamentId: req.params.id },
      orderBy: { scheduledAt: 'desc' },
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
      },
    });
    res.json({ data: matches });
  } catch (error) {
    next(error);
  }
};

export const createTournament = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug, season, organizer, region, description, logoUrl } = req.body;

    const tournament = await prisma.tournament.create({
      data: { name, slug, season, organizer, region, description, logoUrl },
    });

    res.status(201).json({ message: 'Torneo creado', tournament });
  } catch (error) {
    next(error);
  }
};

export const updateTournament = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tournament = await prisma.tournament.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ message: 'Torneo actualizado', tournament });
  } catch (error) {
    next(error);
  }
};
