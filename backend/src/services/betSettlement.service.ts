import prisma from '../config/database';
import { BetStatus, MarketStatus, MatchStatus, SelectionResult, TransactionType, MarketType } from '@prisma/client';

export const PREDICTION_EXACT_POINTS = 6;
export const PREDICTION_WINNER_POINTS = 3;

interface SettlementResult {
  settled: number;
  won: number;
  lost: number;
  void: number;
  totalPaidOut: number;
  prode: PredictionSettlementResult;
}

interface PredictionSettlementResult {
  settled: number;
  won: number;
  exact: number;
  totalPoints: number;
}

export class BetSettlementService {
  /**
   * Settle all markets and bets for a finished match, and score the prode predictions.
   */
  static async settleMatch(matchId: string): Promise<SettlementResult> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        markets: {
          include: {
            options: { include: { selections: { include: { bet: true } } } },
          },
        },
      },
    });

    if (!match || match.homeScore === null || match.awayScore === null) {
      throw new Error('Partido sin resultado válido');
    }

    const homeScore = match.homeScore;
    const awayScore = match.awayScore;
    const totalGoals = homeScore + awayScore;

    const result: SettlementResult = { settled: 0, won: 0, lost: 0, void: 0, totalPaidOut: 0, prode: { settled: 0, won: 0, exact: 0, totalPoints: 0 } };

    for (const market of match.markets) {
      if (market.status === MarketStatus.SETTLED) continue;

      // Evaluate each option individually (supports OVER/UNDER lines correctly)
      for (const option of market.options) {
        const optionResult = this.evaluateOption(market.type, option.value, homeScore, awayScore, totalGoals);

        await prisma.marketOption.update({
          where: { id: option.id },
          data: { result: optionResult },
        });
      }

      // Close market
      await prisma.market.update({
        where: { id: market.id },
        data: { status: MarketStatus.SETTLED, settledAt: new Date() },
      });
    }

    // Now settle all pending bets related to this match
    const pendingBets = await prisma.bet.findMany({
      where: {
        status: BetStatus.PENDING,
        selections: {
          some: {
            marketOption: {
              market: { matchId },
            },
          },
        },
      },
      include: {
        selections: {
          include: {
            marketOption: {
              include: { market: true },
            },
          },
        },
        user: {
          include: { wallet: true },
        },
      },
    });

    for (const bet of pendingBets) {
      // Check all selections that belong to this match
      const matchSelections = bet.selections.filter(s => s.marketOption.market.matchId === matchId);
      const otherSelections = bet.selections.filter(s => s.marketOption.market.matchId !== matchId);

      // Get updated option results
      const updatedOptions = await prisma.marketOption.findMany({
        where: { id: { in: matchSelections.map(s => s.marketOptionId) } },
      });

      const hasLost = updatedOptions.some(o => o.result === SelectionResult.LOST);
      const allWon = updatedOptions.every(o => o.result === SelectionResult.WON);

      // Update selection results
      for (const sel of matchSelections) {
        const opt = updatedOptions.find(o => o.id === sel.marketOptionId);
        if (opt) {
          await prisma.betSelection.update({
            where: { id: sel.id },
            data: { result: opt.result },
          });
        }
      }

      // If it's a combined bet and this match lost, the whole bet is lost
      // If all selections across ALL matches are resolved, settle the bet
      const allSelectionsHaveResult = bet.selections.every(s => {
        if (matchSelections.find(ms => ms.id === s.id)) {
          const opt = updatedOptions.find(o => o.id === s.marketOptionId);
          return opt && opt.result !== SelectionResult.PENDING;
        }
        return s.result !== SelectionResult.PENDING;
      });

      if (!bet.isCombined) {
        // Simple bet - settle immediately
        if (hasLost) {
          await this.settleBetAsLost(bet);
          result.lost++;
        } else if (allWon) {
          const payout = await this.settleBetAsWon(bet);
          result.won++;
          result.totalPaidOut += payout;
        }
        result.settled++;
      } else {
        // Combined bet - only settle if ALL selections have results OR if one lost
        if (hasLost) {
          await this.settleBetAsLost(bet);
          result.lost++;
          result.settled++;
        } else if (allSelectionsHaveResult && !hasLost) {
          const payout = await this.settleBetAsWon(bet);
          result.won++;
          result.totalPaidOut += payout;
          result.settled++;
        }
      }
    }

    // Score prode predictions for this finished match
    result.prode = await this.settlePredictions(matchId);

    return result;
  }

  /**
   * Score all pending prode predictions for a finished match.
   * Exact score = 6 points, correct winner/draw = 3 points, otherwise 0.
   */
  static async settlePredictions(matchId: string): Promise<PredictionSettlementResult> {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (
      !match ||
      match.status !== MatchStatus.FINISHED ||
      match.homeScore === null ||
      match.awayScore === null
    ) {
      return { settled: 0, won: 0, exact: 0, totalPoints: 0 };
    }

    const home = match.homeScore;
    const away = match.awayScore;

    const predictions = await prisma.prediction.findMany({
      where: { matchId, result: SelectionResult.PENDING },
      include: { user: { include: { wallet: true } } },
    });

    const outcome = {
      settled: 0,
      won: 0,
      exact: 0,
      totalPoints: 0,
    };

    for (const prediction of predictions) {
      const isExact = prediction.predictedHome === home && prediction.predictedAway === away;
      const actualSign = Math.sign(home - away);
      const predictedSign = Math.sign(prediction.predictedHome - prediction.predictedAway);
      const isWinner = actualSign === predictedSign;

      const points = isExact
        ? PREDICTION_EXACT_POINTS
        : isWinner
          ? PREDICTION_WINNER_POINTS
          : 0;

      if (points > 0) {
        outcome.won++;
        if (isExact) outcome.exact++;
      }

      await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          result: points > 0 ? SelectionResult.WON : SelectionResult.LOST,
          pointsEarned: points,
          settledAt: new Date(),
        },
      });

      outcome.settled++;
      outcome.totalPoints += points;

      if (prediction.user.wallet) {
        await prisma.notification.create({
          data: {
            userId: prediction.userId,
            title: points > 0 ? '🎯 ¡Acierto en el Prode!' : 'Prode — Pronóstico resuelto',
            message:
              points > 0
                ? `Acertaste ${isExact ? 'el resultado EXACTO' : 'el ganador o el empate'} de ${prediction.predictedHome}-${prediction.predictedAway}. Sumaste ${points} puntos al prode.`
                : `Tu pronóstico ${prediction.predictedHome}-${prediction.predictedAway} no acertó (resultado final ${home}-${away}).`,
            type: points > 0 ? 'BET_WON' : 'BET_LOST',
            data: { matchId, predictionId: prediction.id, pointsEarned: points },
          },
        });
      }
    }

    return outcome;
  }

  /**
   * Void and refund all pending bets that reference a match (cancelled/postponed).
   * Returns the number of refunded bets.
   */
  static async voidBetsForMatch(matchId: string, reason: string): Promise<number> {
    const bets = await prisma.bet.findMany({
      where: {
        status: BetStatus.PENDING,
        selections: {
          some: {
            marketOption: {
              market: { matchId },
            },
          },
        },
      },
      include: { user: { include: { wallet: true } } },
    });

    let refunded = 0;
    for (const bet of bets) {
      try {
        await this.refundBet(bet.id, reason);
        refunded++;
      } catch (error) {
        console.error(`No se pudo anular la apuesta ${bet.id}:`, error);
      }
    }
    return refunded;
  }

  private static evaluateOption(
    marketType: MarketType,
    optionValue: string,
    homeScore: number,
    awayScore: number,
    totalGoals: number
  ): SelectionResult {
    switch (marketType) {
      case MarketType.MATCH_WINNER:
        if (homeScore > awayScore) return optionValue === 'HOME' ? SelectionResult.WON : SelectionResult.LOST;
        if (awayScore > homeScore) return optionValue === 'AWAY' ? SelectionResult.WON : SelectionResult.LOST;
        return optionValue === 'DRAW' ? SelectionResult.WON : SelectionResult.LOST;

      case MarketType.DOUBLE_CHANCE:
        if (homeScore > awayScore) {
          return optionValue === 'HOME_DRAW' || optionValue === 'HOME_AWAY' ? SelectionResult.WON : SelectionResult.LOST;
        }
        if (awayScore > homeScore) {
          return optionValue === 'HOME_AWAY' || optionValue === 'DRAW_AWAY' ? SelectionResult.WON : SelectionResult.LOST;
        }
        return optionValue === 'HOME_DRAW' || optionValue === 'DRAW_AWAY' ? SelectionResult.WON : SelectionResult.LOST;

      case MarketType.OVER_UNDER: {
        const line = optionValue.includes('_')
          ? parseFloat(optionValue.split('_')[1])
          : parseFloat(optionValue.replace(/^\D+/, ''));
        const normalizedLine = Number.isFinite(line) && line > 0 ? line : 4.5;
        if (/^OVER/i.test(optionValue)) {
          return totalGoals > normalizedLine ? SelectionResult.WON : SelectionResult.LOST;
        }
        if (/^UNDER/i.test(optionValue)) {
          return totalGoals < normalizedLine ? SelectionResult.WON : SelectionResult.LOST;
        }
        return SelectionResult.LOST;
      }

      case MarketType.BOTH_TEAMS_SCORE:
        return homeScore > 0 && awayScore > 0
          ? optionValue === 'YES' ? SelectionResult.WON : SelectionResult.LOST
          : optionValue === 'NO' ? SelectionResult.WON : SelectionResult.LOST;

      case MarketType.EXACT_SCORE:
        return optionValue === `${homeScore}-${awayScore}` ? SelectionResult.WON : SelectionResult.LOST;

      case MarketType.FIRST_TEAM_SCORE:
        if (homeScore > 0 && awayScore > 0) {
          return optionValue === 'BOTH' ? SelectionResult.WON : SelectionResult.LOST;
        }
        if (homeScore > 0) return optionValue === 'HOME' ? SelectionResult.WON : SelectionResult.LOST;
        if (awayScore > 0) return optionValue === 'AWAY' ? SelectionResult.WON : SelectionResult.LOST;
        return optionValue === 'NONE' ? SelectionResult.WON : SelectionResult.LOST;

      default:
        return SelectionResult.LOST;
    }
  }

  private static async settleBetAsLost(bet: any): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.bet.update({
        where: { id: bet.id },
        data: { status: BetStatus.LOST, settledAt: new Date(), actualPayout: 0 },
      });

      const wallet = bet.user.wallet;
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.BET_PLACED, // reuse as loss record
          amount: 0,
          balanceBefore: Number(wallet.balance),
          balanceAfter: Number(wallet.balance),
          betId: bet.id,
          description: `Apuesta perdida — ${bet.stakeAmount} puntos`,
        },
      });

      await tx.virtualWallet.update({
        where: { id: wallet.id },
        data: { totalLost: { increment: Number(bet.stakeAmount) } },
      });

      await tx.notification.create({
        data: {
          userId: bet.userId,
          title: 'Apuesta perdida',
          message: `Tu apuesta de ${bet.stakeAmount} puntos fue perdida. ¡Sigue intentando!`,
          type: 'BET_LOST',
          data: { betId: bet.id },
        },
      });
    });
  }

  private static async settleBetAsWon(bet: any): Promise<number> {
    const payout = Number(bet.potentialPayout);
    const wallet = bet.user.wallet;
    const balanceBefore = Number(wallet.balance);
    const balanceAfter = balanceBefore + payout;

    await prisma.$transaction(async (tx) => {
      await tx.bet.update({
        where: { id: bet.id },
        data: { status: BetStatus.WON, settledAt: new Date(), actualPayout: payout },
      });

      await tx.virtualWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: payout },
          totalWon: { increment: payout },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.BET_WON,
          amount: payout,
          balanceBefore,
          balanceAfter,
          betId: bet.id,
          description: `Apuesta ganada — Premio: ${payout} puntos`,
        },
      });

      await tx.notification.create({
        data: {
          userId: bet.userId,
          title: '🎉 ¡Apuesta ganada!',
          message: `¡Felicitaciones! Ganaste ${payout.toFixed(0)} puntos virtuales.`,
          type: 'BET_WON',
          data: { betId: bet.id, payout },
        },
      });
    });

    return payout;
  }

  static async refundBet(betId: string, reason: string): Promise<void> {
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: { user: { include: { wallet: true } } },
    });

    if (!bet || bet.status !== BetStatus.PENDING) {
      throw new Error('Apuesta no encontrada o no está pendiente');
    }

    const wallet = bet.user.wallet!;
    const stake = Number(bet.stakeAmount);
    const balanceBefore = Number(wallet.balance);

    await prisma.$transaction(async (tx) => {
      await tx.bet.update({
        where: { id: betId },
        data: { status: BetStatus.VOID, settledAt: new Date(), actualPayout: stake },
      });

      await tx.virtualWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: stake } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.BET_REFUNDED,
          amount: stake,
          balanceBefore,
          balanceAfter: balanceBefore + stake,
          betId,
          description: `Apuesta anulada — ${reason}. Devuelto: ${stake} puntos`,
        },
      });

      await tx.notification.create({
        data: {
          userId: bet.userId,
          title: 'Apuesta anulada',
          message: `Tu apuesta fue anulada. Se devolvieron ${stake} puntos a tu billetera.`,
          type: 'SYSTEM',
          data: { betId, reason },
        },
      });
    });
  }
}
