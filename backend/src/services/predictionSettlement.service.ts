import prisma from '../config/database';
import { MatchStatus, SelectionResult } from '@prisma/client';

export const PREDICTION_EXACT_POINTS = 6;
export const PREDICTION_WINNER_POINTS = 3;

export interface PredictionSettlementResult {
  settled: number;
  won: number;
  exact: number;
  totalPoints: number;
}

export class PredictionSettlementService {
  /**
   * Score all pending prode predictions for a finished match.
   * Exact score = 6 points, correct winner/draw = 3 points, otherwise 0.
   */
  /**
   * Reset all predictions for a match to PENDING (no points). Used when a
   * finished match is reopened so predictions can be re-scored later.
   */
  static async resetPredictions(matchId: string): Promise<void> {
    await prisma.prediction.updateMany({
      where: { matchId },
      data: { result: SelectionResult.PENDING, pointsEarned: 0, settledAt: null },
    });
  }

  /**
   * Reset all predictions for a match to PENDING and re-score them against the
   * current result. Used when an admin corrects the score of an already
   * finished/settled match so the prode points stay in sync.
   */
  static async resettlePredictions(matchId: string): Promise<PredictionSettlementResult> {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (
      !match ||
      match.status !== MatchStatus.FINISHED ||
      match.homeScore === null ||
      match.awayScore === null
    ) {
      return { settled: 0, won: 0, exact: 0, totalPoints: 0 };
    }

    await this.resetPredictions(matchId);

    return this.settlePredictions(matchId);
  }

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
      include: { user: { select: { id: true } } },
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

      await prisma.notification.create({
        data: {
          userId: prediction.userId,
          title: points > 0 ? '🎯 ¡Acierto en el Prode!' : 'Prode — Pronóstico resuelto',
          message:
            points > 0
              ? `Acertaste ${isExact ? 'el resultado EXACTO' : 'el ganador o el empate'} de ${prediction.predictedHome}-${prediction.predictedAway}. Sumaste ${points} puntos al prode.`
              : `Tu pronóstico ${prediction.predictedHome}-${prediction.predictedAway} no acertó (resultado final ${home}-${away}).`,
          type: points > 0 ? 'PRODE_WON' : 'PRODE_LOST',
          data: { matchId, predictionId: prediction.id, pointsEarned: points },
        },
      });
    }

    return outcome;
  }
}