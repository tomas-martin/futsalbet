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

  // Cada 10 minutos: Notificar partidos que se juegan en las próximas 24 horas (recordatorio)
  cron.schedule('*/10 * * * *', async () => {
    await checkAndSend24hReminders();
  });

  // Ejecución inmediata al arrancar para no perder partidos próximos
  checkAndSend24hReminders().catch((err) =>
    console.error('Error en chequeo inicial de recordatorios 24h:', err)
  );
}

/**
 * Revisa partidos programados en las próximas 24 horas y envía recordatorio in-app y push
 * evitando duplicar notificaciones para el mismo partido.
 */
export async function checkAndSend24hReminders() {
  try {
    const now = new Date();
    // Ventana: desde ahora hasta dentro de 24 horas y 30 minutos
    const in24HoursWindow = new Date(now.getTime() + (24 * 60 + 30) * 60 * 1000);

    const matchesSoon = await prisma.match.findMany({
      where: {
        status: MatchStatus.SCHEDULED,
        scheduledAt: {
          gt: now,
          lte: in24HoursWindow,
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: true,
      },
    });

    if (matchesSoon.length === 0) return;

    // Verificar cuáles ya tienen notificación de recordatorio 24h emitida
    const existingReminders = await prisma.notification.findMany({
      where: {
        type: 'MATCH_REMINDER_24H',
      },
      select: {
        data: true,
      },
    });

    const notifiedMatchIds = new Set<string>();
    for (const rem of existingReminders) {
      if (rem.data && typeof rem.data === 'object' && 'matchId' in (rem.data as any)) {
        notifiedMatchIds.add(String((rem.data as any).matchId));
      }
    }

    const pendingMatches = matchesSoon.filter((m) => !notifiedMatchIds.has(m.id));
    if (pendingMatches.length === 0) return;

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const { sendPushToAll } = await import('../services/fcm.service');

    for (const match of pendingMatches) {
      const home = match.homeTeam.shortName || match.homeTeam.name;
      const away = match.awayTeam.shortName || match.awayTeam.name;
      const roundStr = match.round ? ` (${match.round})` : '';

      const title = '⏳ ¡Falta 1 día para el partido!';
      const message = `Mañana se juega ${home} vs ${away}${roundStr}. ¡Cargá tu pronóstico en el Prode antes de que empiece!`;

      // 1. Notificación in-app en la base de datos para todos los usuarios activos
      if (users.length > 0) {
        await prisma.notification.createMany({
          data: users.map((u) => ({
            userId: u.id,
            title,
            message,
            type: 'MATCH_REMINDER_24H',
            data: {
              matchId: match.id,
              tournamentId: match.tournamentId,
              url: '/prode',
            },
          })),
        });
      }

      // 2. Notificación push a todos los dispositivos registrados
      await sendPushToAll({
        title,
        body: message,
        url: '/prode',
        data: {
          matchId: match.id,
          type: 'MATCH_REMINDER_24H',
        },
      });

      console.log(`📢 Recordatorio de 24h enviado para ${home} vs ${away} (ID: ${match.id})`);
    }
  } catch (error) {
    console.error('Error al procesar recordatorios de 24h:', error);
  }
}

/**
 * Función que puede invocarse cuando se importan o crean nuevos partidos programados
 */
export async function notifyNewMatchesAvailable(count: number, tournamentName?: string) {
  try {
    const { sendPushToAll } = await import('../services/fcm.service');
    const title = '⚽ ¡Nuevos partidos disponibles para Prode!';
    const msg = tournamentName
      ? `Se habilitaron ${count} nuevos partidos en ${tournamentName}. ¡Entrá y suma puntos para el torneo!`
      : `Se habilitaron ${count} nuevos partidos para pronosticar. ¡Ingresa tus marcadores!`;

    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title,
          message: msg,
          type: 'NEW_MATCH',
          data: { url: '/prode' },
        })),
      });
    }

    await sendPushToAll({
      title,
      body: msg,
      url: '/prode',
      data: { type: 'NEW_MATCH' },
    });
  } catch (error) {
    console.error('Error al notificar nuevos partidos:', error);
  }
}