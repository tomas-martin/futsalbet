import * as cheerio from 'cheerio';
import prisma from '../config/database';
import { MatchStatus } from '@prisma/client';
import { BetSettlementService } from './betSettlement.service';

const SCOREFY_BASE = 'https://scorefy.app';
const TOUR_ID = 'FFM-P-M-FSP-C-2026';
const TOUR_URL = `${SCOREFY_BASE}/futsal/mendoza/fefusa-mendoza/${TOUR_ID}`;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-AR,es;q=0.9',
};

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} para ${url}`);
  return res.text();
}

// ===========================
// SCRAPE RESULTADOS
// ===========================
async function scrapeResults(): Promise<Array<{
  homeTeam: string; awayTeam: string;
  homeScore: number; awayScore: number;
  round: string; date: string;
}>> {
  const html = await fetchPage(`${TOUR_URL}/results`);
  const $ = cheerio.load(html);
  const results: any[] = [];

  let currentRound = '';

  // Buscar jornadas y partidos
  $('span').each((_, el) => {
    const text = $(el).text().trim();
    if (text.startsWith('Jornada:')) {
      currentRound = text.replace('Jornada:', 'Jornada').trim();
    }
  });

  // Buscar contenedores de partido con resultado
  $('div').each((_, el) => {
    const container = $(el);
    // Buscar marcadores — cuando hay dos números separados por vs
    const spans = container.find('span.text-2xl, span.text-3xl');
    if (spans.length >= 2) {
      const scores = spans.map((_, s) => $(s).text().trim()).get().filter(s => /^\d+$/.test(s));
      if (scores.length >= 2) {
        const teamLinks = container.find('a[href*="/team-home"] span.text-\\[12px\\], a[href*="/team-home"] span');
        const teams = teamLinks.map((_, t) => $(t).text().trim()).get().filter(t => t.length > 1 && t.length < 40);
        if (teams.length >= 2 && scores.length >= 2) {
          results.push({
            homeTeam: teams[0],
            awayTeam: teams[1],
            homeScore: parseInt(scores[0]),
            awayScore: parseInt(scores[1]),
            round: currentRound,
            date: new Date().toISOString(),
          });
        }
      }
    }
  });

  return results;
}

// ===========================
// SCRAPE STANDINGS
// ===========================
async function scrapeStandings(): Promise<Array<{
  position: number; teamName: string; logoUrl: string;
  points: number; played: number; won: number; drawn: number;
  lost: number; goalsFor: number; goalsAgainst: number;
}>> {
  const html = await fetchPage(`${TOUR_URL}/standings`);
  const $ = cheerio.load(html);
  const standings: any[] = [];

  // La tabla tiene filas tr con datos
  $('tbody tr').each((_, row) => {
    const tds = $(row).find('td');
    if (tds.length < 9) return;

    const posText = $(tds[0]).text().trim();
    const pos = parseInt(posText);
    if (isNaN(pos)) return;

    const logoImg = $(tds[1]).find('img');
    const logoUrl = logoImg.attr('src') || '';

    const teamName = $(tds[2]).find('div div').first().text().trim() ||
                     $(tds[2]).text().trim();

    const pts = parseInt($(tds[3]).text().trim()) || 0;
    const pj = parseInt($(tds[4]).text().trim()) || 0;
    const pg = parseInt($(tds[5]).text().trim()) || 0;
    const pe = parseInt($(tds[6]).text().trim()) || 0;
    const pp = parseInt($(tds[7]).text().trim()) || 0;
    const gf = parseInt($(tds[8]).text().trim()) || 0;
    const gc = parseInt($(tds[9]).text().trim()) || 0;

    if (teamName) {
      standings.push({ position: pos, teamName, logoUrl, points: pts, played: pj, won: pg, drawn: pe, lost: pp, goalsFor: gf, goalsAgainst: gc });
    }
  });

  return standings;
}

// ===========================
// SCRAPE FIXTURE (próximos)
// ===========================
async function scrapeFixture(): Promise<Array<{
  homeTeam: string; awayTeam: string;
  homeLogo: string; awayLogo: string;
  date: string; time: string; venue: string; round: string;
}>> {
  const html = await fetchPage(`${TOUR_URL}/fixture`);
  const $ = cheerio.load(html);
  const fixtures: any[] = [];
  let currentRound = '';

  // Encontrar jornadas
  $('span').each((_, el) => {
    const text = $(el).text().trim();
    if (text.startsWith('Jornada:')) {
      currentRound = `Jornada ${text.replace('Jornada:', '').trim()}`;
    }
  });

  // Cada partido es un div con estructura conocida
  // Buscamos los que tienen fecha (span con formato "14/aug")
  const matchCards = $('div.rounded-3xl');
  matchCards.each((_, card) => {
    const dateSpan = $(card).find('span').filter((_, s) => /\d+\/\w+/.test($(s).text())).first();
    const timeSpan = $(card).find('span').filter((_, s) => /\d+:\d+/.test($(s).text())).first();
    const venueSpan = $(card).find('span.break-words').first();
    const teamLinks = $(card).find('a[href*="/team-home"]');

    if (teamLinks.length >= 2) {
      const homeLink = $(teamLinks[0]);
      const awayLink = $(teamLinks[1]);

      const homeName = homeLink.find('span').text().trim();
      const awayName = awayLink.find('span').text().trim();
      const homeLogo = homeLink.find('img').attr('src') || '';
      const awayLogo = awayLink.find('img').attr('src') || '';

      // Solo agregar si tiene "-" en marcador (partido no jugado)
      const scoreSpans = $(card).find('span.text-2xl, span.text-3xl');
      const isDash = scoreSpans.filter((_, s) => $(s).text().trim() === '-').length >= 2;

      if (homeName && awayName && isDash) {
        fixtures.push({
          homeTeam: homeName,
          awayTeam: awayName,
          homeLogo,
          awayLogo,
          date: dateSpan.text().trim(),
          time: timeSpan.text().trim(),
          venue: venueSpan.text().trim(),
          round: currentRound,
        });
      }
    }
  });

  return fixtures;
}

// ===========================
// SYNC PRINCIPAL
// ===========================
export async function syncFromScorefy(): Promise<{
  success: boolean;
  message: string;
  stats: Record<string, number>;
}> {
  const stats = { resultsUpdated: 0, standingsUpdated: 0, fixturesAdded: 0, betsSettled: 0, errors: 0 };

  try {
    // Obtener el torneo en BD
    const tournament = await prisma.tournament.findFirst({
      where: { slug: 'fefusa-fsp-clausura-2026' },
      include: { categories: true },
    });

    if (!tournament) {
      return { success: false, message: 'Torneo no encontrado en BD. Ejecuta el seed primero.', stats };
    }

    const category = tournament.categories[0];

    // ---- 1. SYNC STANDINGS ----
    try {
      const standings = await scrapeStandings();
      console.log(`📊 Scraped ${standings.length} posiciones de Scorefy`);

      for (const s of standings) {
        // Buscar equipo por nombre (fuzzy match)
        const team = await prisma.team.findFirst({
          where: {
            OR: [
              { name: { contains: s.teamName, mode: 'insensitive' } },
              { name: { contains: s.teamName.split(' ')[0], mode: 'insensitive' } },
            ],
          },
        });

        if (!team) {
          console.warn(`⚠️ Equipo no encontrado: ${s.teamName}`);
          continue;
        }

        // Actualizar logo del equipo si cambió
        if (s.logoUrl && !team.logoUrl?.includes(s.logoUrl.split('/').pop()!)) {
          await prisma.team.update({ where: { id: team.id }, data: { logoUrl: s.logoUrl } });
        }

        // Upsert standing
        const existing = await prisma.standing.findFirst({
          where: { tournamentId: tournament.id, teamId: team.id },
        });

        const standingData = {
          position: s.position,
          points: s.points,
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDiff: s.goalsFor - s.goalsAgainst,
        };

        if (existing) {
          await prisma.standing.update({ where: { id: existing.id }, data: standingData });
        } else {
          await prisma.standing.create({
            data: { ...standingData, tournamentId: tournament.id, teamId: team.id },
          });
        }
        stats.standingsUpdated++;
      }
    } catch (e: any) {
      console.error('❌ Error scrapeando standings:', e.message);
      stats.errors++;
    }

    // ---- 2. SYNC RESULTS (partidos finalizados) ----
    try {
      const results = await scrapeResults();
      console.log(`⚽ Scraped ${results.length} resultados de Scorefy`);

      for (const r of results) {
        const homeTeam = await prisma.team.findFirst({
          where: { name: { contains: r.homeTeam.split(' ')[0], mode: 'insensitive' } },
        });
        const awayTeam = await prisma.team.findFirst({
          where: { name: { contains: r.awayTeam.split(' ')[0], mode: 'insensitive' } },
        });

        if (!homeTeam || !awayTeam) continue;

        // Buscar partido existente que coincida
        const existingMatch = await prisma.match.findFirst({
          where: {
            tournamentId: tournament.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            status: { not: MatchStatus.FINISHED },
          },
        });

        if (existingMatch) {
          // Actualizar resultado
          await prisma.match.update({
            where: { id: existingMatch.id },
            data: {
              homeScore: r.homeScore,
              awayScore: r.awayScore,
              status: MatchStatus.FINISHED,
            },
          });

          // Liquidar apuestas
          const settlement = await BetSettlementService.settleMatch(existingMatch.id);
          stats.betsSettled += settlement.settled;
          stats.resultsUpdated++;
          console.log(`✅ Resultado actualizado: ${r.homeTeam} ${r.homeScore}-${r.awayScore} ${r.awayTeam}`);
        }
      }
    } catch (e: any) {
      console.error('❌ Error scrapeando resultados:', e.message);
      stats.errors++;
    }

    // ---- 3. SYNC FIXTURE (próximos partidos) ----
    try {
      const fixtures = await scrapeFixture();
      console.log(`📅 Scraped ${fixtures.length} próximos partidos de Scorefy`);

      for (const f of fixtures) {
        const homeTeam = await prisma.team.findFirst({
          where: { name: { contains: f.homeTeam.split(' ')[0], mode: 'insensitive' } },
        });
        const awayTeam = await prisma.team.findFirst({
          where: { name: { contains: f.awayTeam.split(' ')[0], mode: 'insensitive' } },
        });

        if (!homeTeam || !awayTeam) continue;

        // Verificar si ya existe
        const exists = await prisma.match.findFirst({
          where: {
            tournamentId: tournament.id,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            status: MatchStatus.SCHEDULED,
          },
        });

        if (!exists) {
          // Parsear fecha (formato "14/aug")
          let scheduledAt = new Date();
          try {
            const [day, monthStr] = f.date.split('/');
            const months: Record<string, number> = {
              jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
              jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
            };
            const month = months[monthStr.toLowerCase()] ?? 7;
            const [hours, minutes] = (f.time || '21:00').split(':').map(Number);
            scheduledAt = new Date(2026, month, parseInt(day), hours + 3, minutes || 0); // +3 para UTC-3
          } catch {
            // usar fecha default
          }

          const newMatch = await prisma.match.create({
            data: {
              tournamentId: tournament.id,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              scheduledAt,
              venue: f.venue || 'Por confirmar',
              round: f.round || 'Jornada por confirmar',
              status: MatchStatus.SCHEDULED,
            },
          });

          // Crear mercados básicos
          const market1x2 = await prisma.market.create({
            data: {
              matchId: newMatch.id,
              type: 'MATCH_WINNER',
              name: 'Resultado Final',
              status: 'OPEN',
            },
          });
          await prisma.marketOption.createMany({
            data: [
              { marketId: market1x2.id, label: 'Local',     value: 'HOME', odds: parseFloat((1.7 + Math.random() * 0.8).toFixed(2)), isActive: true },
              { marketId: market1x2.id, label: 'Empate',    value: 'DRAW', odds: parseFloat((3.0 + Math.random() * 0.5).toFixed(2)), isActive: true },
              { marketId: market1x2.id, label: 'Visitante', value: 'AWAY', odds: parseFloat((2.0 + Math.random() * 1.0).toFixed(2)), isActive: true },
            ],
          });

          stats.fixturesAdded++;
          console.log(`📅 Nuevo partido: ${f.homeTeam} vs ${f.awayTeam} (${f.round})`);
        }
      }
    } catch (e: any) {
      console.error('❌ Error scrapeando fixture:', e.message);
      stats.errors++;
    }

    console.log('✅ Sync con Scorefy completado:', stats);
    return {
      success: true,
      message: `Sync completado: ${stats.resultsUpdated} resultados, ${stats.standingsUpdated} posiciones, ${stats.fixturesAdded} partidos nuevos, ${stats.betsSettled} apuestas liquidadas`,
      stats,
    };

  } catch (e: any) {
    console.error('❌ Error general en sync:', e);
    return { success: false, message: e.message, stats };
  }
}
