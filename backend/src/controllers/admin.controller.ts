import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getAdminStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers,
      totalTournaments,
      totalTeams,
      totalMatches,
      liveMatches,
      upcomingMatches,
      finishedMatches,
      totalPredictions,
      pendingPredictions,
      wonPredictions,
      exactPredictions,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.tournament.count(),
      prisma.team.count(),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'LIVE' } }),
      prisma.match.count({ where: { status: 'SCHEDULED' } }),
      prisma.match.count({ where: { status: 'FINISHED' } }),
      prisma.prediction.count(),
      prisma.prediction.count({ where: { result: 'PENDING' } }),
      prisma.prediction.count({ where: { result: 'WON' } }),
      prisma.prediction.count({ where: { pointsEarned: 6 } }),
    ]);

    res.json({
      users: { total: totalUsers },
      tournaments: { total: totalTournaments },
      teams: { total: totalTeams },
      matches: {
        total: totalMatches,
        live: liveMatches,
        upcoming: upcomingMatches,
        finished: finishedMatches,
      },
      prode: {
        total: totalPredictions,
        pending: pendingPredictions,
        won: wonPredictions,
        exact: exactPredictions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { predictions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined) updateData.role = role;

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: id,
        oldData: { isActive: user.isActive, role: user.role },
        newData: { isActive, role },
      },
    });

    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { username: true, email: true } },
        },
      }),
      prisma.auditLog.count(),
    ]);

    res.json({ data: logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};