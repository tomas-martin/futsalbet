import prisma from '../config/database';
import { MatchStatus, Prisma } from '@prisma/client';

const WIN_POINTS = 3;
const DRAW_POINTS = 1;

interface TeamStats {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  goalDiff: number;
}

/**
 * Recomputes the standings table of a tournament from its FINISHED matches.
 * Used when an admin loads a match result so the table stays in sync with the
 * played matches. Teams without finished matches are kept with 0 points so the
 * table always shows every participant.
 */
export async function recomputeStandings(tournamentId: string): Promise<number> {
  const matches = await prisma.match.findMany({
    where: {
      tournamentId,
      status: MatchStatus.FINISHED,
      homeScore: { not: null },
      awayScore: { not: null },
    },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
    },
  });

  const existing = await prisma.standing.findMany({
    where: { tournamentId },
    select: { teamId: true },
  });

  const teamIds = new Set<string>();
  for (const m of matches) {
    teamIds.add(m.homeTeamId);
    teamIds.add(m.awayTeamId);
  }
  for (const s of existing) teamIds.add(s.teamId);

  const stats = new Map<string, TeamStats>();
  for (const teamId of teamIds) {
    stats.set(teamId, {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      goalDiff: 0,
    });
  }

  for (const m of matches) {
    const home = stats.get(m.homeTeamId);
    const away = stats.get(m.awayTeamId);
    if (!home || !away) continue;

    const homeScore = m.homeScore!;
    const awayScore = m.awayScore!;

    home.played++;
    away.played++;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.won++;
      home.points += WIN_POINTS;
      away.lost++;
    } else if (homeScore < awayScore) {
      away.won++;
      away.points += WIN_POINTS;
      home.lost++;
    } else {
      home.drawn++;
      home.points += DRAW_POINTS;
      away.drawn++;
      away.points += DRAW_POINTS;
    }
  }

  const rows = [...stats.values()]
    .sort(
      (a, b) =>
        b.points - a.points ||
        (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
        b.goalsFor - a.goalsFor ||
        a.teamId.localeCompare(b.teamId)
    )
    .map((s) => ({
      teamId: s.teamId,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      goalDiff: s.goalsFor - s.goalsAgainst,
      points: s.points,
    }));

  const operations: Prisma.PrismaPromise<unknown>[] = [];
  rows.forEach((row, index) => {
    const { teamId, ...data } = row;
    operations.push(
      prisma.standing.upsert({
        where: { tournamentId_teamId: { tournamentId, teamId } },
        create: { tournamentId, teamId, position: index + 1, ...data },
        update: { position: index + 1, ...data },
      })
    );
  });
  await prisma.$transaction(operations);

  return rows.length;
}