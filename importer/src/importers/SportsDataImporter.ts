import { PrismaClient } from '@prisma/client';
import { DataSourceAdapter } from '../adapters/DataSourceAdapter';

export class SportsDataImporter {
  constructor(
    private prisma: PrismaClient,
    private adapter: DataSourceAdapter
  ) {}

  async runImport() {
    console.log(`🚀 Iniciando importación idempotente desde fuente: ${this.adapter.sourceName}`);

    // 1. Torneos
    const tournaments = await this.adapter.fetchTournaments();
    for (const t of tournaments) {
      const dbTournament = await this.prisma.tournament.upsert({
        where: { externalId: t.externalId },
        update: {
          name: t.name,
          season: t.season,
          logoUrl: t.logoUrl,
          source: this.adapter.sourceName,
        },
        create: {
          externalId: t.externalId,
          name: t.name,
          slug: t.slug,
          season: t.season,
          sport: t.sport,
          country: t.country,
          region: t.region,
          organizer: t.organizer,
          logoUrl: t.logoUrl,
          source: this.adapter.sourceName,
        },
      });

      console.log(`✅ Torneo procesado: ${dbTournament.name}`);

      // 2. Equipos
      const teams = await this.adapter.fetchTeams(t.externalId);
      const teamMap = new Map<string, string>(); // externalId -> dbId

      for (const tm of teams) {
        const dbTeam = await this.prisma.team.upsert({
          where: { externalId: tm.externalId },
          update: {
            name: tm.name,
            logoUrl: tm.logoUrl,
            shortName: tm.shortName,
            source: this.adapter.sourceName,
          },
          create: {
            externalId: tm.externalId,
            name: tm.name,
            slug: tm.slug,
            shortName: tm.shortName,
            logoUrl: tm.logoUrl,
            source: this.adapter.sourceName,
          },
        });
        teamMap.set(tm.externalId, dbTeam.id);
      }
      console.log(`✅ ${teams.length} Equipos procesados`);

      // 3. Partidos
      const matches = await this.adapter.fetchMatches(t.externalId);
      for (const m of matches) {
        const homeTeamId = teamMap.get(m.homeTeamExternalId);
        const awayTeamId = teamMap.get(m.awayTeamExternalId);

        if (homeTeamId && awayTeamId) {
          await this.prisma.match.upsert({
            where: { externalId: m.externalId },
            update: {
              scheduledAt: m.scheduledAt,
              venue: m.venue,
              round: m.round,
              status: m.status as any,
              homeScore: m.homeScore,
              awayScore: m.awayScore,
            },
            create: {
              externalId: m.externalId,
              tournamentId: dbTournament.id,
              homeTeamId,
              awayTeamId,
              scheduledAt: m.scheduledAt,
              venue: m.venue,
              round: m.round,
              status: m.status as any,
              homeScore: m.homeScore,
              awayScore: m.awayScore,
              source: this.adapter.sourceName,
            },
          });
        }
      }
      console.log(`✅ ${matches.length} Partidos procesados`);

      // 4. Tabla de posiciones
      const standings = await this.adapter.fetchStandings(t.externalId);
      for (const st of standings) {
        const teamId = teamMap.get(st.teamExternalId);
        if (teamId) {
          await this.prisma.standing.upsert({
            where: {
              tournamentId_teamId: {
                tournamentId: dbTournament.id,
                teamId,
              },
            },
            update: {
              position: st.position,
              played: st.played,
              won: st.won,
              drawn: st.drawn,
              lost: st.lost,
              goalsFor: st.goalsFor,
              goalsAgainst: st.goalsAgainst,
              goalDiff: st.goalsFor - st.goalsAgainst,
              points: st.points,
            },
            create: {
              tournamentId: dbTournament.id,
              teamId,
              position: st.position,
              played: st.played,
              won: st.won,
              drawn: st.drawn,
              lost: st.lost,
              goalsFor: st.goalsFor,
              goalsAgainst: st.goalsAgainst,
              goalDiff: st.goalsFor - st.goalsAgainst,
              points: st.points,
            },
          });
        }
      }
      console.log(`✅ Standings procesados`);
    }

    console.log('🎉 Importación completada idempotentemente.');
  }
}
