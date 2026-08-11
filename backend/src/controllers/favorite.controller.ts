import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getFavorites = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [favoriteTeams, favoriteTournaments] = await Promise.all([
      prisma.favoriteTeam.findMany({
        where: { userId },
        include: {
          team: {
            include: {
              _count: { select: { homeMatches: true, awayMatches: true } },
            },
          },
        },
      }),
      prisma.favoriteTournament.findMany({
        where: { userId },
        include: { tournament: true },
      }),
    ]);

    // Fetch upcoming matches for favorite teams
    const teamIds = favoriteTeams.map(ft => ft.teamId);
    const upcomingMatches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
        status: { in: ['SCHEDULED', 'LIVE'] },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
      include: {
        homeTeam: { select: { id: true, name: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, logoUrl: true } },
        tournament: { select: { name: true } },
      },
    });

    res.json({
      teams: favoriteTeams.map(ft => ft.team),
      tournaments: favoriteTournaments.map(ft => ft.tournament),
      upcomingMatches,
    });
  } catch (error) {
    next(error);
  }
};

export const addFavoriteTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { teamId } = req.body;

    if (!teamId) {
      res.status(400).json({ error: 'teamId requerido' });
      return;
    }

    const favorite = await prisma.favoriteTeam.upsert({
      where: { userId_teamId: { userId, teamId } },
      update: {},
      create: { userId, teamId },
      include: { team: true },
    });

    res.status(201).json({ message: 'Equipo añadido a favoritos', favorite });
  } catch (error) {
    next(error);
  }
};

export const removeFavoriteTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { teamId } = req.params;

    await prisma.favoriteTeam.deleteMany({
      where: { userId, teamId },
    });

    res.json({ message: 'Equipo eliminado de favoritos' });
  } catch (error) {
    next(error);
  }
};

export const addFavoriteTournament = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tournamentId } = req.body;

    if (!tournamentId) {
      res.status(400).json({ error: 'tournamentId requerido' });
      return;
    }

    const favorite = await prisma.favoriteTournament.upsert({
      where: { userId_tournamentId: { userId, tournamentId } },
      update: {},
      create: { userId, tournamentId },
      include: { tournament: true },
    });

    res.status(201).json({ message: 'Torneo añadido a favoritos', favorite });
  } catch (error) {
    next(error);
  }
};

export const removeFavoriteTournament = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tournamentId } = req.params;

    await prisma.favoriteTournament.deleteMany({
      where: { userId, tournamentId },
    });

    res.json({ message: 'Torneo eliminado de favoritos' });
  } catch (error) {
    next(error);
  }
};
