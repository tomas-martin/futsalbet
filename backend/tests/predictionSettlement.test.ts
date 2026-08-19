import { describe, it, expect } from 'vitest';
import { PREDICTION_EXACT_POINTS, PREDICTION_WINNER_POINTS } from '../src/services/predictionSettlement.service';

describe('Puntaje del Prode (pronósticos)', () => {
  function scorePrediction(predictedHome: number, predictedAway: number, home: number, away: number): number {
    const isExact = predictedHome === home && predictedAway === away;
    const actualSign = Math.sign(home - away);
    const predictedSign = Math.sign(predictedHome - predictedAway);
    const isWinner = actualSign === predictedSign;
    return isExact ? PREDICTION_EXACT_POINTS : isWinner ? PREDICTION_WINNER_POINTS : 0;
  }

  it('Resultado exacto otorga 6 puntos', () => {
    expect(PREDICTION_EXACT_POINTS).toBe(6);
    expect(scorePrediction(4, 2, 4, 2)).toBe(6);
  });

  it('Ganador correcto pero no exacto otorga 3 puntos', () => {
    expect(PREDICTION_WINNER_POINTS).toBe(3);
    expect(scorePrediction(3, 1, 4, 2)).toBe(3);
  });

  it('Empate acertado otorga 6 (exacto) o 3 (ganador) puntos', () => {
    expect(scorePrediction(2, 2, 2, 2)).toBe(6);
    expect(scorePrediction(1, 1, 3, 3)).toBe(3);
  });

  it('Pronóstico totalmente fallado otorga 0 puntos', () => {
    expect(scorePrediction(1, 3, 4, 2)).toBe(0);
  });
});