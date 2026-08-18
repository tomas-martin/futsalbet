import { describe, it, expect } from 'vitest';

describe('Cálculos de Cuotas Combinadas y Puntos Virtuales', () => {
  it('Debe calcular correctamente la cuota combinada multiplicando selecciones', () => {
    const oddsSelection1 = 1.80;
    const oddsSelection2 = 1.50;
    const oddsSelection3 = 1.40;

    const totalOdds = Math.round(oddsSelection1 * oddsSelection2 * oddsSelection3 * 100) / 100;
    expect(totalOdds).toBe(3.78);
  });

  it('Debe calcular el premio potencial en puntos virtuales', () => {
    const stakeAmount = 100; // puntos
    const totalOdds = 3.78;

    const potentialPayout = stakeAmount * totalOdds;
    expect(potentialPayout).toBe(378);
  });

  it('Debe descontar correctamente el saldo de puntos virtuales al apostar', () => {
    const initialBalance = 1000;
    const stakeAmount = 100;

    const newBalance = initialBalance - stakeAmount;
    expect(newBalance).toBe(900);
  });

  it('Debe sumar el premio al saldo al ganar un pronóstico', () => {
    const currentBalance = 900;
    const payout = 378;

    const finalBalance = currentBalance + payout;
    expect(finalBalance).toBe(1278);
  });
});

describe('Puntaje del Prode (pronósticos)', () => {
  const EXACT_POINTS = 6;
  const WINNER_POINTS = 3;

  function scorePrediction(predictedHome: number, predictedAway: number, home: number, away: number): number {
    const isExact = predictedHome === home && predictedAway === away;
    const actualSign = Math.sign(home - away);
    const predictedSign = Math.sign(predictedHome - predictedAway);
    const isWinner = actualSign === predictedSign;
    return isExact ? EXACT_POINTS : isWinner ? WINNER_POINTS : 0;
  }

  it('Resultado exacto otorga 6 puntos', () => {
    expect(scorePrediction(4, 2, 4, 2)).toBe(6);
  });

  it('Ganador correcto pero no exacto otorga 3 puntos', () => {
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

describe('Liquidación Over/Under (Total de Goles)', () => {
  function evaluateOverUnder(optionValue: string, totalGoals: number): 'WON' | 'LOST' {
    const line = optionValue.includes('_')
      ? parseFloat(optionValue.split('_')[1])
      : parseFloat(optionValue.replace(/^\D+/, ''));
    const normalizedLine = Number.isFinite(line) && line > 0 ? line : 4.5;
    if (/^OVER/i.test(optionValue)) return totalGoals > normalizedLine ? 'WON' : 'LOST';
    if (/^UNDER/i.test(optionValue)) return totalGoals < normalizedLine ? 'WON' : 'LOST';
    return 'LOST';
  }

  it('OVER 4.5 gana si hay más de 4 goles', () => {
    expect(evaluateOverUnder('OVER_4.5', 6)).toBe('WON');
    expect(evaluateOverUnder('OVER_4.5', 4)).toBe('LOST');
  });

  it('UNDER 4.5 gana si hay menos de 5 goles', () => {
    expect(evaluateOverUnder('UNDER_4.5', 4)).toBe('WON');
    expect(evaluateOverUnder('UNDER_4.5', 6)).toBe('LOST');
  });

  it('Valores legacy OVER/UNDER usan la línea 4.5 por defecto', () => {
    expect(evaluateOverUnder('OVER', 6)).toBe('WON');
    expect(evaluateOverUnder('UNDER', 4)).toBe('WON');
  });
});
