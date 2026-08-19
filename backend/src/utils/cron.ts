import cron from 'node-cron';
import prisma from '../config/database';
import { PredictionSettlementService } from '../services/predictionSettlement.service';
import { MatchStatus } from '@prisma/client';

// Los partidos sincronizados desde Scorefy tienen externalId.
// El cron de simulación SOLO debe operar sobre partidos de demo (sin externalId),
// para no pisar ni liquidar datos reales del torneo.
function isDemoMatch(match: { externalId: string | null }): boolean {
  return !match.externalId;
}

export function startCronJobs() {
  console.log('⏰ Inicializando tareas programadas (Cron jobs)...');

  // Cada 5 minutos: Simular avance de partidos en vivo y verificar si terminaron
  cron.schedule('*/5 * * * *', async () => {
    try {
      const liveMatches = await prisma.match.findMany({
        where: { status: MatchStatus.LIVE },
      });

      for (const match of liveMatches) {
        if (!isDemoMatch(match)) continue;

        const currentMinute = (match.minute || 0) + 5;

        if (currentMinute >= 40) {
          // Finalizar partido (Futsal se juega a 40 mins)
          await prisma.match.update({
            where: { id: match.id },
            data: {
              status: MatchStatus.FINISHED,
              minute: 40,
            },
          });

          // Solo resolver si hay un resultado REAL cargado (no el 0-0 placeholder).
          if (match.homeScore !== null && match.awayScore !== null) {
            await PredictionSettlementService.settlePredictions(match.id);
            console.log(`⚽ Partido demo ${match.id} finalizado y prode puntuado por Cron`);
          } else {
            console.log(`⚽ Partido demo ${match.id} finalizado SIN resultado (no se puntuó el prode)`);
          }
        } else {
          // Actualizar minuto en vivo
          await prisma.match.update({
            where: { id: match.id },
            data: { minute: currentMinute },
          });
        }
      }
    } catch (error) {
      console.error('Error en Cron de partidos en vivo:', error);
    }
  });

  // Cada 30 minutos: Verificar partidos próximos que deben pasar a LIVE
  cron.schedule('*/30 * * * *', async () => {
    try {
      const now = new Date();
      const upcomingToStart = await prisma.match.findMany({
        where: {
          status: MatchStatus.SCHEDULED,
          scheduledAt: { lte: now },
        },
      });

      for (const match of upcomingToStart) {
        if (!isDemoMatch(match)) continue;

        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: MatchStatus.LIVE,
            minute: 1,
            homeScore: 0,
            awayScore: 0,
          },
        });

        console.log(`▶️ Partido demo ${match.id} pasó a LIVE por Cron`);
      }
    } catch (error) {
      console.error('Error en Cron de inicio de partidos:', error);
    }
  });
}