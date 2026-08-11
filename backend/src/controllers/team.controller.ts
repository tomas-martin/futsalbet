import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tournamentId } = req.query;

    const where: any = { isActive: true };
    if (tournamentId) {
      where.categories = { some: { category: { tournamentId: tournamentId as string } } };
    }

    const teams = await prisma.team.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { homeMatches: true, awayMatches: true } },
      },
    });

    res.json({ data: teams });
  } catch (error) {
    next(error);
  }
};

export const getTeamById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await prisma.team.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      include: {
        players: { where: { isActive: true }, orderBy: { name: 'asc' } },
        standings: {
          include: { tournament: { select: { name: true, slug: true } } },
        },
      },
    });

    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    // Recent matches
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
        status: { in: ['FINISHED', 'LIVE', 'SCHEDULED'] },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 10,
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        tournament: { select: { name: true } },
      },
    });

    res.json({ ...team, matches });
  } catch (error) {
    next(error);
  }
};

export const createTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug, shortName, logoUrl, city, region } = req.body;

    const team = await prisma.team.create({
      data: { name, slug, shortName, logoUrl, city, region },
    });

    res.status(201).json({ message: 'Equipo creado', team });
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ message: 'Equipo actualizado', team });
  } catch (error) {
    next(error);
  }
};
