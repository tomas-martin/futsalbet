import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { createBetSchema } from '../validators/schemas';
import { BetStatus, MarketStatus, MatchStatus, TransactionType, SelectionResult } from '@prisma/client';

export const createBet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createBetSchema.parse(req.body);
    const userId = req.user!.id;

    // Fetch all selected options with their markets and matches
    const options = await prisma.marketOption.findMany({
      where: {
        id: { in: data.selections.map(s => s.marketOptionId) },
        isActive: true,
      },
      include: {
        market: {
          include: {
            match: true,
          },
        },
      },
    });

    if (options.length !== data.selections.length) {
      res.status(400).json({ error: 'Una o más opciones no existen o están desactivadas' });
      return;
    }

    // Validations
    for (const opt of options) {
      if (opt.market.status !== MarketStatus.OPEN) {
        res.status(400).json({ error: `El mercado "${opt.market.name}" está cerrado` });
        return;
      }

      const match = opt.market.match;
      if (match.status === MatchStatus.LIVE || match.status === MatchStatus.FINISHED) {
        res.status(400).json({ error: `El partido ya comenzó o finalizó. No puedes apostar.` });
        return;
      }

      if (match.status === MatchStatus.CANCELLED || match.status === MatchStatus.POSTPONED) {
        res.status(400).json({ error: `El partido fue cancelado o postpuesto.` });
        return;
      }
    }

    // Check no duplicate markets in a single bet
    const marketIds = options.map(o => o.marketId);
    if (new Set(marketIds).size !== marketIds.length) {
      res.status(400).json({ error: 'No puedes seleccionar múltiples opciones del mismo mercado' });
      return;
    }

    // Get user wallet
    const wallet = await prisma.virtualWallet.findUnique({ where: { userId } });
    if (!wallet) {
      res.status(400).json({ error: 'Billetera no encontrada' });
      return;
    }

    if (Number(wallet.balance) < data.stakeAmount) {
      res.status(400).json({
        error: `Puntos insuficientes. Saldo: ${wallet.balance} | Requerido: ${data.stakeAmount}`,
      });
      return;
    }

    // Calculate total odds (combined)
    const totalOdds = options.reduce((acc, opt) => acc * Number(opt.odds), 1);
    const potentialPayout = data.stakeAmount * totalOdds;
    const isCombined = options.length > 1;

    // Create bet with transaction
    const bet = await prisma.$transaction(async (tx) => {
      // Deduct points
      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore - data.stakeAmount;

      await tx.virtualWallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          totalBet: { increment: data.stakeAmount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.BET_PLACED,
          amount: -data.stakeAmount,
          balanceBefore,
          balanceAfter,
          description: `Apuesta ${isCombined ? 'combinada' : 'simple'} — ${options.length} selección(es)`,
        },
      });

      // Create bet
      const newBet = await tx.bet.create({
        data: {
          userId,
          totalOdds: Math.round(totalOdds * 100) / 100,
          stakeAmount: data.stakeAmount,
          potentialPayout: Math.round(potentialPayout * 100) / 100,
          status: BetStatus.PENDING,
          isCombined,
          selections: {
            create: options.map(opt => ({
              marketOptionId: opt.id,
              odds: Number(opt.odds),
              result: SelectionResult.PENDING,
            })),
          },
        },
        include: {
          selections: {
            include: {
              marketOption: {
                include: {
                  market: {
                    include: { match: { include: { homeTeam: true, awayTeam: true } } },
                  },
                },
              },
            },
          },
        },
      });

      return newBet;
    });

    res.status(201).json({
      message: 'Apuesta registrada exitosamente',
      bet: {
        id: bet.id,
        totalOdds: bet.totalOdds,
        stakeAmount: bet.stakeAmount,
        potentialPayout: bet.potentialPayout,
        status: bet.status,
        isCombined: bet.isCombined,
        createdAt: bet.createdAt,
        selections: bet.selections.map(s => ({
          id: s.id,
          odds: s.odds,
          label: s.marketOption.label,
          marketName: s.marketOption.market.name,
          matchName: `${s.marketOption.market.match.homeTeam.name} vs ${s.marketOption.market.match.awayTeam.name}`,
        })),
      },
      newBalance: Number(wallet.balance) - data.stakeAmount,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBets = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as BetStatus | undefined;

    const where = {
      userId: req.user!.id,
      ...(status && { status }),
    };

    const [bets, total] = await Promise.all([
      prisma.bet.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          selections: {
            include: {
              marketOption: {
                include: {
                  market: {
                    include: {
                      match: {
                        include: {
                          homeTeam: { select: { name: true, logoUrl: true } },
                          awayTeam: { select: { name: true, logoUrl: true } },
                          tournament: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.bet.count({ where }),
    ]);

    res.json({
      data: bets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBetById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bet = await prisma.bet.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        selections: {
          include: {
            marketOption: {
              include: {
                market: {
                  include: {
                    match: {
                      include: {
                        homeTeam: true,
                        awayTeam: true,
                        tournament: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!bet) {
      res.status(404).json({ error: 'Apuesta no encontrada' });
      return;
    }

    res.json(bet);
  } catch (error) {
    next(error);
  }
};
