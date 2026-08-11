import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { TransactionType } from '@prisma/client';

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
      totalBets,
      pendingBets,
      wonBets,
      lostBets,
      walletsAgg,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.tournament.count(),
      prisma.team.count(),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'LIVE' } }),
      prisma.match.count({ where: { status: 'SCHEDULED' } }),
      prisma.match.count({ where: { status: 'FINISHED' } }),
      prisma.bet.count(),
      prisma.bet.count({ where: { status: 'PENDING' } }),
      prisma.bet.count({ where: { status: 'WON' } }),
      prisma.bet.count({ where: { status: 'LOST' } }),
      prisma.virtualWallet.aggregate({
        _sum: { balance: true, totalWon: true, totalLost: true, totalBet: true },
      }),
    ]);

    // Daily bets stats for charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentBets = await prisma.bet.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, stakeAmount: true, status: true },
    });

    // Group bets by day
    const betsByDay: Record<string, { count: number; totalStake: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      betsByDay[key] = { count: 0, totalStake: 0 };
    }

    recentBets.forEach(b => {
      const dayKey = b.createdAt.toISOString().split('T')[0];
      if (betsByDay[dayKey]) {
        betsByDay[dayKey].count++;
        betsByDay[dayKey].totalStake += Number(b.stakeAmount);
      }
    });

    const betsChartData = Object.keys(betsByDay).map(date => ({
      date,
      count: betsByDay[date].count,
      totalStake: betsByDay[date].totalStake,
    }));

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
      bets: {
        total: totalBets,
        pending: pendingBets,
        won: wonBets,
        lost: lostBets,
      },
      points: {
        circulating: walletsAgg._sum.balance ?? 0,
        totalBet: walletsAgg._sum.totalBet ?? 0,
        totalWon: walletsAgg._sum.totalWon ?? 0,
        totalLost: walletsAgg._sum.totalLost ?? 0,
      },
      charts: {
        betsByDay: betsChartData,
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
          wallet: { select: { balance: true, totalWon: true, totalLost: true, totalBet: true } },
          _count: { select: { bets: true } },
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
    const { isActive, role, pointsAdjustment } = req.body;

    const user = await prisma.user.findUnique({ where: { id }, include: { wallet: true } });
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

    if (pointsAdjustment && user.wallet) {
      const amount = parseFloat(pointsAdjustment);
      const balanceBefore = Number(user.wallet.balance);
      const balanceAfter = balanceBefore + amount;

      await prisma.virtualWallet.update({
        where: { id: user.wallet.id },
        data: { balance: balanceAfter },
      });

      await prisma.walletTransaction.create({
        data: {
          walletId: user.wallet.id,
          type: TransactionType.ADMIN_ADJUSTMENT,
          amount,
          balanceBefore,
          balanceAfter,
          description: `Ajuste administrativo de puntos por ${req.user!.email}`,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: id,
        oldData: { isActive: user.isActive, role: user.role },
        newData: { isActive, role, pointsAdjustment },
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
