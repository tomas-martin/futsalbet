import * as cheerio from 'cheerio';
import prisma from '../config/database';
import { MatchStatus, Prisma, Team } from '@prisma/client';
import { PredictionSettlementService } from './predictionSettlement.service';
import { recomputeStandings } from './standing.service';

const SCOREFY_BASE = 'https://scorefy.app';
const SCOREFY_CDN = 'https://cdn.scorefy.app';
const TOUR_ID = process.env.SCOREFY_TOUR_ID || 'FFM-P-M-FSP-C-2026';
const TOUR_SLUG = process.env.SCOREFY_TOURNAMENT_SLUG || 'fefusa-fsp-clausura-2026';
const TOUR_URL = `${SCOREFY_BASE}/futsal/mendoza/fefusa-mendoza/${TOUR_ID}`;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-AR,es;q=0.9',
};

type ScorefyTeam = {
  id: string;
  logo?: string;
  name: string;
  slug?: string;
  goals?: string;
};

type ScorefyMatch = {
  id: string;
  date?: string;
  time?: string;
  stadium?: string;
  stadiumLocation?: string;
  round?: number | string;
  teams: ScorefyTeam[];
  statusId?: number;
  isBlocked?: boolean;
  isPlaceholder?: boolean;
  dateOriginal?: string;
};

type ScorefyStanding = {
  position: number;
  teamName: string;
  logoUrl: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
};

type ParsedMatch = {
  externalId: string;
  homeTeam: ScorefyTeam;
  awayTeam: ScorefyTeam;
  scheduledAt: Date;
  venue: string;
  round: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  scorefyStatusId?: number;
};

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value: string): string {
  return normalizeName(value).replace(/\s+/g, '-');
}

function shortName(value: string): string {
  const parts = normalizeName(value).split(' ').filter(Boolean);
  const initials = parts.map((part) => part[0]).join('');
  return (initials.length >= 3 ? initials : normalizeName(value).replace(/\s+/g, '')).slice(0, 3).toUpperCase();
}

function teamLogoUrl(team: ScorefyTeam): string {
  if (team.logo?.startsWith('http')) return team.logo;
  return `${SCOREFY_CDN}/teams/shield/${team.id}.png`;
}

function extractEscapedObjects(html: string, marker: string): string[] {
  const objects: string[] = [];
  let cursor = 0;

  while (cursor < html.length) {
    const markerIndex = html.indexOf(marker, cursor);
    if (markerIndex === -1) break;

    const start = html.indexOf('{', markerIndex + marker.length);
    if (start === -1) break;

    let depth = 0;
    let end = -1;

    for (let i = start; i < html.length; i++) {
      const char = html[i];
      if (char === '{') depth++;
      if (char === '}') depth--;

      if (depth === 0) {
        end = i + 1;
        break;
      }
    }

    if (end === -1) break;
    objects.push(html.slice(start, end));
    cursor = end;
  }

  return objects;
}

function parseEscapedObject<T>(escapedObject: string): T {
  const json = escapedObject.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  return JSON.parse(json, (_key, value) => (value === '$undefined' ? undefined : value));
}

function parseScorefyDate(match: ScorefyMatch): Date {
  if (match.dateOriginal?.startsWith('$D')) {
    const parsed = new Date(match.dateOriginal.slice(2));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const now = new Date();
  const [dayText, monthText] = String(match.date || '').split('/');
  const [hourText, minuteText] = String(match.time || '00:00').split(':');
  const monthMap: Record<string, number> = {
    jan: 0,
    ene: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    abr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    ago: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
    dic: 11,
  };
  const day = Number(dayText) || now.getDate();
  const month = monthMap[String(monthText || '').toLowerCase()] ?? now.getMonth();
  const hours = Number(hourText) || 0;
  const minutes = Number(minuteText) || 0;

  return new Date(Date.UTC(Number(process.env.SCOREFY_SEASON || '2026'), month, day, hours + 3, minutes));
}

function parseScore(value: string | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function mapStatus(match: ScorefyMatch): MatchStatus {
  const homeScore = parseScore(match.teams[0]?.goals);
  const awayScore = parseScore(match.teams[1]?.goals);
  if (homeScore !== null && awayScore !== null) return MatchStatus.FINISHED;
  if (match.statusId === 57) return MatchStatus.FINISHED;
  if (match.isBlocked) return MatchStatus.POSTPONED;
  return MatchStatus.SCHEDULED;
}

async function scrapeScorefyMatches(path: 'fixture' | 'results'): Promise<ParsedMatch[]> {
  const html = await fetchPage(`${TOUR_URL}/${path}`);
  const rawMatches = extractEscapedObjects(html, '\\"match\\":');
  const byId = new Map<string, ParsedMatch>();

  for (const raw of rawMatches) {
    const scorefyMatch = parseEscapedObject<ScorefyMatch>(raw);
    if (!scorefyMatch.id || scorefyMatch.teams.length < 2 || scorefyMatch.isPlaceholder) continue;

    const homeTeam = scorefyMatch.teams[0];
    const awayTeam = scorefyMatch.teams[1];
    const homeScore = parseScore(homeTeam.goals);
    const awayScore = parseScore(awayTeam.goals);
    const status = path === 'results' ? MatchStatus.FINISHED : mapStatus(scorefyMatch);

    byId.set(scorefyMatch.id, {
      externalId: scorefyMatch.id,
      homeTeam,
      awayTeam,
      scheduledAt: parseScorefyDate(scorefyMatch),
      venue: scorefyMatch.stadium || 'Por confirmar',
      round: scorefyMatch.round ? `Jornada ${scorefyMatch.round}` : 'Jornada por confirmar',
      status,
      homeScore,
      awayScore,
      scorefyStatusId: scorefyMatch.statusId,
    });
  }

  return [...byId.values()];
}

async function scrapeStandings(): Promise<ScorefyStanding[]> {
  const html = await fetchPage(`${TOUR_URL}/standings`);
  const $ = cheerio.load(html);
  const standings: ScorefyStanding[] = [];

  $('tbody tr').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length < 10) return;

    const position = Number($(tds[0]).text().trim());
    if (!Number.isFinite(position)) return;

    const teamName = $(tds[2]).text().trim();
    if (!teamName) return;

    standings.push({
      position,
      teamName,
      logoUrl: $(tds[1]).find('img').attr('src') || '',
      points: Number($(tds[3]).text().trim()) || 0,
      played: Number($(tds[4]).text().trim()) || 0,
      won: Number($(tds[5]).text().trim()) || 0,
      drawn: Number($(tds[6]).text().trim()) || 0,
      lost: Number($(tds[7]).text().trim()) || 0,
      goalsFor: Number($(tds[8]).text().trim()) || 0,
      goalsAgainst: Number($(tds[9]).text().trim()) || 0,
    });
  });

  return standings;
}

async function loadTeamCache(): Promise<Team[]> {
  return prisma.team.findMany();
}

function findCachedTeam(cache: Team[], scorefyTeam: Pick<ScorefyTeam, 'id' | 'name'> & { logoUrl?: string }): Team | undefined {
  const normalized = normalizeName(scorefyTeam.name);
  return cache.find((team) => {
    if (team.externalId === scorefyTeam.id) return true;
    if (scorefyTeam.id && team.logoUrl?.includes(`${scorefyTeam.id}.png`)) return true;
    if (normalizeName(team.name) === normalized) return true;
    if (team.shortName && normalizeName(team.shortName) === normalized) return true;
    return false;
  });
}

async function uniqueTeamSlug(baseName: string): Promise<string> {
  const base = slugify(baseName) || 'equipo';
  let candidate = base;
  let suffix = 2;

  while (await prisma.team.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }

  return candidate;
}

async function ensureTeam(scorefyTeam: ScorefyTeam, categoryId: string, cache: Team[]): Promise<Team> {
  const logoUrl = teamLogoUrl(scorefyTeam);
  let team = findCachedTeam(cache, scorefyTeam);

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: scorefyTeam.name,
        shortName: shortName(scorefyTeam.name),
        slug: await uniqueTeamSlug(scorefyTeam.slug || scorefyTeam.name),
        logoUrl,
        city: 'Mendoza',
        country: 'Argentina',
        region: 'Mendoza',
        source: 'scorefy',
        externalId: scorefyTeam.id,
      },
    });
    cache.push(team);
  } else {
    const data: Prisma.TeamUpdateInput = {};
    if (team.externalId !== scorefyTeam.id) data.externalId = scorefyTeam.id;
    if (team.name !== scorefyTeam.name) data.name = scorefyTeam.name;
    if (logoUrl && team.logoUrl !== logoUrl) data.logoUrl = logoUrl;
    if (team.source !== 'scorefy') data.source = 'scorefy';

    if (Object.keys(data).length > 0) {
      const updatedTeam = await prisma.team.update({ where: { id: team.id }, data });
      const index = cache.findIndex((cached) => cached.id === updatedTeam.id);
      if (index >= 0) cache[index] = updatedTeam;
      team = updatedTeam;
    }
  }

  await prisma.categoryTeam.upsert({
    where: { categoryId_teamId: { categoryId, teamId: team.id } },
    update: {},
    create: { categoryId, teamId: team.id },
  });

  return team;
}

async function ensureTeamFromStanding(standing: ScorefyStanding, categoryId: string, cache: Team[]): Promise<Team | null> {
  const idFromLogo = standing.logoUrl.match(/\/([^/]+)\.png$/)?.[1];
  const pseudoTeam: ScorefyTeam = {
    id: idFromLogo || slugify(standing.teamName),
    name: standing.teamName,
    logo: standing.logoUrl,
  };
  return ensureTeam(pseudoTeam, categoryId, cache);
}

async function upsertMatch(parsed: ParsedMatch, tournamentId: string, categoryId: string, cache: Team[]): Promise<{
  matchId: string;
  created: boolean;
  changed: boolean;
}> {
  const [homeTeam, awayTeam] = await Promise.all([
    ensureTeam(parsed.homeTeam, categoryId, cache),
    ensureTeam(parsed.awayTeam, categoryId, cache),
  ]);

  let match = await prisma.match.findUnique({ where: { externalId: parsed.externalId } });
  if (!match) {
    match = await prisma.match.findFirst({
      where: {
        tournamentId,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        round: parsed.round,
      },
    });
  }

  const data = {
    tournamentId,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    scheduledAt: parsed.scheduledAt,
    venue: parsed.venue,
    round: parsed.round,
    status: parsed.status,
    homeScore: parsed.homeScore,
    awayScore: parsed.awayScore,
    externalId: parsed.externalId,
    source: 'scorefy',
    extraInfo: parsed.scorefyStatusId ? `scorefy_status:${parsed.scorefyStatusId}` : undefined,
  };

  if (!match) {
    const created = await prisma.match.create({ data });
    return { matchId: created.id, created: true, changed: true };
  }

  const changed =
    match.homeTeamId !== data.homeTeamId ||
    match.awayTeamId !== data.awayTeamId ||
    match.scheduledAt.getTime() !== data.scheduledAt.getTime() ||
    match.venue !== data.venue ||
    match.round !== data.round ||
    match.status !== data.status ||
    match.homeScore !== data.homeScore ||
    match.awayScore !== data.awayScore ||
    match.externalId !== data.externalId ||
    match.source !== data.source;

  if (changed) {
    await prisma.match.update({ where: { id: match.id }, data });
  }

  return { matchId: match.id, created: false, changed };
}

export async function syncFromScorefy(): Promise<{
  success: boolean;
  message: string;
  stats: Record<string, number>;
}> {
  const stats = {
    standingsUpdated: 0,
    matchesCreated: 0,
    matchesUpdated: 0,
    resultsUpdated: 0,
    fixturesUpdated: 0,
    predictionsSettled: 0,
    errors: 0,
  };

  try {
    const tournament = await prisma.tournament.findFirst({
      where: { OR: [{ externalId: TOUR_ID }, { slug: TOUR_SLUG }] },
      include: { categories: true },
    });

    if (!tournament) {
      return { success: false, message: 'Tournament not found. Run the seed first.', stats };
    }

    const category = tournament.categories[0];
    if (!category) {
      return { success: false, message: 'Tournament category not found.', stats };
    }

    const teamCache = await loadTeamCache();

    const standings = await scrapeStandings();
    for (const standing of standings) {
      const team = await ensureTeamFromStanding(standing, category.id, teamCache);
      if (!team) continue;

      await prisma.standing.upsert({
        where: { tournamentId_teamId: { tournamentId: tournament.id, teamId: team.id } },
        update: {
          position: standing.position,
          points: standing.points,
          played: standing.played,
          won: standing.won,
          drawn: standing.drawn,
          lost: standing.lost,
          goalsFor: standing.goalsFor,
          goalsAgainst: standing.goalsAgainst,
          goalDiff: standing.goalsFor - standing.goalsAgainst,
        },
        create: {
          tournamentId: tournament.id,
          teamId: team.id,
          position: standing.position,
          points: standing.points,
          played: standing.played,
          won: standing.won,
          drawn: standing.drawn,
          lost: standing.lost,
          goalsFor: standing.goalsFor,
          goalsAgainst: standing.goalsAgainst,
          goalDiff: standing.goalsFor - standing.goalsAgainst,
        },
      });
      stats.standingsUpdated++;
    }

    const [fixtureMatches, resultMatches] = await Promise.all([
      scrapeScorefyMatches('fixture'),
      scrapeScorefyMatches('results'),
    ]);

    for (const parsed of fixtureMatches) {
      const result = await upsertMatch(parsed, tournament.id, category.id, teamCache);
      if (result.created) stats.matchesCreated++;
      if (result.changed) stats.fixturesUpdated++;
    }

    for (const parsed of resultMatches) {
      const result = await upsertMatch(parsed, tournament.id, category.id, teamCache);
      if (result.created) stats.matchesCreated++;
      if (result.changed) stats.resultsUpdated++;

      const match = await prisma.match.findUnique({ where: { id: result.matchId } });
      if (match?.status === MatchStatus.FINISHED && match.homeScore !== null && match.awayScore !== null) {
        const settlement = await PredictionSettlementService.settlePredictions(match.id);
        stats.predictionsSettled += settlement.settled;
      }
    }

    // Recompute the table from the finished matches so it stays in sync even
    // when the scraped standings page lags behind the loaded results.
    stats.standingsUpdated = await recomputeStandings(tournament.id);

    const message = `Sync completed: ${stats.standingsUpdated} standings, ${stats.fixturesUpdated} fixture updates, ${stats.resultsUpdated} result updates, ${stats.matchesCreated} new matches, ${stats.predictionsSettled} predictions settled`;
    console.log(message, stats);
    return { success: true, message, stats };
  } catch (error: any) {
    console.error('Scorefy sync failed:', error);
    stats.errors++;
    return { success: false, message: error.message, stats };
  }
}
