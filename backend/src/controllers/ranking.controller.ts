import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const getRanking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sortBy = (req.query.sortBy as string) || 'balance';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    let orderBy: any = { balance: 'desc' };
    if (sortBy === 'totalWon') orderBy = { totalWon: 'desc' };
    else if (sortBy === 'totalBet') orderBy = { totalBet: 'desc' };

    const wallets = await prisma.virtualWallet.findMany({
      where: { user: { isActive: true, role: 'USER' } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
            _count: { select: { bets: true } },
          },
        },
      },
    });

    const total = await prisma.virtualWallet.count({
      where: { user: { isActive: true, role: 'USER' } },
    });

    const ranking = await Promise.all(
      wallets.map(async (w, idx) => {
        const wonBets = await prisma.bet.count({
          where: { userId: w.userId, status: 'WON' },
        });

        return {
          rank: (page - 1) * limit + idx + 1,
          user: {
            id: w.user.id,
            username: w.user.username,
            displayName: w.user.displayName,
            avatarUrl: w.user.avatarUrl,
          },
          balance: w.balance,
          totalWon: w.totalWon,
          totalBet: w.totalBet,
          totalLost: w.totalLost,
          totalBets: w.user._count.bets,
          wonBets,
        };
      })
    );

    res.json({
      data: ranking,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
