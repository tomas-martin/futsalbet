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
