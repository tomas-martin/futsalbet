import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getWallet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wallet = await prisma.virtualWallet.findUnique({
      where: { userId: req.user!.id },
    });

    if (!wallet) {
      res.status(404).json({ error: 'Billetera no encontrada' });
      return;
    }

    res.json(wallet);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const wallet = await prisma.virtualWallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) {
      res.status(404).json({ error: 'Billetera no encontrada' });
      return;
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    res.json({
      data: transactions,
      wallet: {
        balance: wallet.balance,
        totalWon: wallet.totalWon,
        totalLost: wallet.totalLost,
        totalBet: wallet.totalBet,
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
