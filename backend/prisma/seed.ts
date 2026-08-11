import { PrismaClient, Role, MatchStatus, MarketType, MarketStatus, TransactionType, SelectionResult, BetStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de FutsalBet...');

  // ===========================
  // USUARIOS
  // ===========================
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const userPassword = await bcrypt.hash('User123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@futsalbet.com' },
    update: {},
    create: {
      email: 'admin@futsalbet.com',
      username: 'admin',
      passwordHash: adminPassword,
      displayName: 'Administrador',
      role: Role.ADMIN,
      isActive: true,
      isVerified: true,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'usuario@futsalbet.com' },
    update: {},
    create: {
      email: 'usuario@futsalbet.com',
      username: 'usuario_demo',
      passwordHash: userPassword,
      displayName: 'Usuario Demo',
      role: Role.USER,
      isActive: true,
      isVerified: true,
    },
  });

  // Usuarios demo adicionales
  const demoUsers = [
    { email: 'juan@demo.com', username: 'juan_mendoza', displayName: 'Juan Mendoza' },
    { email: 'maria@demo.com', username: 'maria_futsal', displayName: 'María García' },
    { email: 'tomas@demo.com', username: 'tomas_bet', displayName: 'Tomás López' },
    { email: 'lucas@demo.com', username: 'lucas_gol', displayName: 'Lucas Fernández' },
    { email: 'sofia@demo.com', username: 'sofia_pro', displayName: 'Sofía Martínez' },
    { email: 'pedro@demo.com', username: 'pedro_fan', displayName: 'Pedro Sánchez' },
    { email: 'ana@demo.com', username: 'ana_deportes', displayName: 'Ana Rodríguez' },
    { email: 'carlos@demo.com', username: 'carlos_futsal', displayName: 'Carlos Pérez' },
    { email: 'laura@demo.com', username: 'laura_bet', displayName: 'Laura González' },
    { email: 'diego@demo.com', username: 'diego_goles', displayName: 'Diego Flores' },
  ];

  const createdDemoUsers = [];
  for (const du of demoUsers) {
    const u = await prisma.user.upsert({
      where: { email: du.email },
      update: {},
      create: {
        email: du.email,
        username: du.username,
        displayName: du.displayName,
        passwordHash: userPassword,
        role: Role.USER,
        isActive: true,
        isVerified: true,
      },
    });
    createdDemoUsers.push(u);
  }

  // ===========================
  // WALLETS (con puntos iniciales)
  // ===========================
  const INITIAL_POINTS = 1000;

  async function createWalletWithBonus(userId: string, bonus: number = INITIAL_POINTS) {
    const existing = await prisma.virtualWallet.findUnique({ where: { userId } });
    if (existing) return existing;

    const wallet = await prisma.virtualWallet.create({
      data: {
        userId,
        balance: bonus,
        totalWon: 0,
        totalLost: 0,
        totalBet: 0,
      },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.INITIAL_BONUS,
        amount: bonus,
        balanceBefore: 0,
        balanceAfter: bonus,
        description: `Bono de bienvenida: ${bonus} puntos virtuales`,
      },
    });

    return wallet;
  }

  await createWalletWithBonus(admin.id, 5000);
  await createWalletWithBonus(user1.id, INITIAL_POINTS);

  const demoBalances = [8450, 7920, 7350, 6800, 6200, 5950, 5100, 4800, 4200, 3900];
  for (let i = 0; i < createdDemoUsers.length; i++) {
    await createWalletWithBonus(createdDemoUsers[i].id, demoBalances[i]);
  }

  console.log('✅ Usuarios y wallets creados');

  // ===========================
  // TORNEO
  // ===========================
  const tournament = await prisma.tournament.upsert({
    where: { slug: 'fefusa-mendoza-primera-clausura-2026' },
    update: {},
    create: {
      name: 'FEFUSA Mendoza — Primera Clausura 2026',
      slug: 'fefusa-mendoza-primera-clausura-2026',
      season: '2026',
      sport: 'futsal',
      country: 'Argentina',
      region: 'Mendoza',
      organizer: 'FEFUSA Mendoza',
      logoUrl: 'https://cdn.scorefy.app/organizations/clv9y0n5g000dz5h25dzv1uj4.png',
      description: 'Torneo Clausura de Primera División de Futsal Mendoza, organizado por FEFUSA.',
      isActive: true,
      externalId: 'FFM-P-M-FSP-C-2026',
      source: 'demo',
    },
  });

  const category = await prisma.category.upsert({
    where: { tournamentId_slug: { tournamentId: tournament.id, slug: 'primera-fsp' } },
    update: {},
    create: {
      tournamentId: tournament.id,
      name: 'Primera FSP',
      slug: 'primera-fsp',
      gender: 'masculino',
      division: 'Primera',
    },
  });

  console.log('✅ Torneo y categoría creados');

  // ===========================
  // EQUIPOS (basados en datos públicos FEFUSA Mendoza 2026)
  // ===========================
  const teamsData = [
    { name: 'Aleman', slug: 'aleman', shortName: 'ALE', logoUrl: 'https://cdn.scorefy.app/teams/shield/buqhdbuybepnrwfj45861sfmv.png', externalId: 'aleman-fefusa' },
    { name: 'Don Orione', slug: 'don-orione', shortName: 'DON', logoUrl: 'https://cdn.scorefy.app/teams/shield/xxvykydpifsapfau72439crkk.png', externalId: 'don-orione-fefusa' },
    { name: 'Godoy Cruz', slug: 'godoy-cruz', shortName: 'GOD', logoUrl: 'https://cdn.scorefy.app/teams/shield/tpuenmmsfepzkuvs52687qkrz.png', externalId: 'godoy-cruz-futsal-mendoza' },
    { name: 'Jockey Club', slug: 'jockey-club', shortName: 'JOC', logoUrl: 'https://cdn.scorefy.app/teams/shield/xiixkzqhypqkmtyr19648wlcf.png', externalId: 'jockey-club-fefusa' },
    { name: 'Andes Talleres', slug: 'andes-talleres', shortName: 'AND', logoUrl: 'https://cdn.scorefy.app/teams/shield/tziicpsffzkwooln63257wnaj.png', externalId: 'andes-talleres-futsal-mendoza' },
    { name: 'Regatas', slug: 'regatas', shortName: 'REG', logoUrl: 'https://cdn.scorefy.app/teams/shield/adrithlvwtdhgcxm44467psde.png', externalId: 'regatas-futsal-mendoza' },
    { name: 'Muni San Martin', slug: 'muni-san-martin', shortName: 'MSM', logoUrl: 'https://cdn.scorefy.app/teams/shield/clv9y14tc0002s5sdcij3kdes.png', externalId: 'muni-san-martin-futsal' },
    { name: 'Villa Hipodromo', slug: 'villa-hipodromo', shortName: 'VH', logoUrl: 'https://cdn.scorefy.app/teams/shield/wejbvnpjfddprayi56851nywm.png', externalId: 'villa-hipodromo-fefusa' },
    { name: 'Cementista', slug: 'cementista', shortName: 'CEM', logoUrl: 'https://cdn.scorefy.app/teams/shield/niujlcyjulnsrfss48567ijaa.png', externalId: 'cementista-fefusa' },
    { name: 'Independiente Rivadavia', slug: 'independiente-rivadavia', shortName: 'IND', logoUrl: 'https://cdn.scorefy.app/teams/shield/jlmvlskhdofdgywx21537tyml.png', externalId: 'independiente-rivadavia-futsal-mendoza' },
    { name: 'Tenis Club', slug: 'tenis-club', shortName: 'TEN', logoUrl: 'https://cdn.scorefy.app/teams/shield/iqsonebbiywvoxzr63562kwcg.png', externalId: 'tenis-club-fefusa' },
    { name: 'Ferro', slug: 'ferro', shortName: 'FER', logoUrl: 'https://cdn.scorefy.app/teams/shield/uuouhvydksjxykxe23230jxen.png', externalId: 'ferro-fefusa' },
  ];

  const teams: Record<string, any> = {};
  for (const td of teamsData) {
    const t = await prisma.team.upsert({
      where: { slug: td.slug },
      update: {},
      create: {
        name: td.name,
        slug: td.slug,
        shortName: td.shortName,
        logoUrl: td.logoUrl,
        city: 'Mendoza',
        country: 'Argentina',
        region: 'Mendoza',
        isActive: true,
        externalId: td.externalId,
        source: 'demo',
      },
    });
    teams[td.slug] = t;

    // Asociar al torneo
    await prisma.categoryTeam.upsert({
      where: { categoryId_teamId: { categoryId: category.id, teamId: t.id } },
      update: {},
      create: { categoryId: category.id, teamId: t.id },
    });
  }

  console.log('✅ Equipos creados');

  // ===========================
  // TABLA DE POSICIONES (basada en datos reales Scorefy)
  // ===========================
  const standingsData = [
    { slug: 'aleman', pos: 1, pl: 2, w: 2, d: 0, l: 0, gf: 11, gc: 3, pts: 6 },
    { slug: 'don-orione', pos: 2, pl: 2, w: 2, d: 0, l: 0, gf: 10, gc: 2, pts: 6 },
    { slug: 'godoy-cruz', pos: 3, pl: 2, w: 2, d: 0, l: 0, gf: 12, gc: 5, pts: 6 },
    { slug: 'jockey-club', pos: 4, pl: 2, w: 2, d: 0, l: 0, gf: 10, gc: 4, pts: 6 },
    { slug: 'andes-talleres', pos: 5, pl: 2, w: 2, d: 0, l: 0, gf: 5, gc: 2, pts: 6 },
    { slug: 'regatas', pos: 6, pl: 2, w: 1, d: 1, l: 0, gf: 7, gc: 5, pts: 4 },
    { slug: 'muni-san-martin', pos: 7, pl: 2, w: 1, d: 1, l: 0, gf: 7, gc: 6, pts: 4 },
    { slug: 'villa-hipodromo', pos: 8, pl: 2, w: 1, d: 0, l: 1, gf: 4, gc: 4, pts: 3 },
    { slug: 'cementista', pos: 9, pl: 2, w: 1, d: 0, l: 1, gf: 6, gc: 3, pts: 3 },
    { slug: 'independiente-rivadavia', pos: 10, pl: 2, w: 0, d: 1, l: 1, gf: 3, gc: 6, pts: 1 },
    { slug: 'tenis-club', pos: 11, pl: 2, w: 0, d: 1, l: 1, gf: 4, gc: 7, pts: 1 },
    { slug: 'ferro', pos: 12, pl: 2, w: 0, d: 0, l: 2, gf: 2, gc: 10, pts: 0 },
  ];

  for (const s of standingsData) {
    await prisma.standing.upsert({
      where: { tournamentId_teamId: { tournamentId: tournament.id, teamId: teams[s.slug].id } },
      update: { position: s.pos, played: s.pl, won: s.w, drawn: s.d, lost: s.l, goalsFor: s.gf, goalsAgainst: s.gc, goalDiff: s.gf - s.gc, points: s.pts },
      create: {
        tournamentId: tournament.id,
        teamId: teams[s.slug].id,
        position: s.pos,
        played: s.pl,
        won: s.w,
        drawn: s.d,
        lost: s.l,
        goalsFor: s.gf,
        goalsAgainst: s.gc,
        goalDiff: s.gf - s.gc,
        points: s.pts,
      },
    });
  }

  console.log('✅ Tabla de posiciones creada');

  // ===========================
  // PARTIDOS (5 finalizados, 3 próximos, 1 en vivo)
  // ===========================
  const now = new Date();

  // Partidos finalizados
  const finishedMatches = [
    {
      home: 'aleman', away: 'ferro', homeScore: 6, awayScore: 1,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), round: 'Fecha 1',
    },
    {
      home: 'don-orione', away: 'tenis-club', homeScore: 5, awayScore: 2,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), round: 'Fecha 1',
    },
    {
      home: 'godoy-cruz', away: 'independiente-rivadavia', homeScore: 7, awayScore: 2,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), round: 'Fecha 1',
    },
    {
      home: 'jockey-club', away: 'villa-hipodromo', homeScore: 5, awayScore: 2,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), round: 'Fecha 1',
    },
    {
      home: 'andes-talleres', away: 'cementista', homeScore: 3, awayScore: 1,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), round: 'Fecha 1',
    },
    {
      home: 'regatas', away: 'muni-san-martin', homeScore: 3, awayScore: 3,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), round: 'Fecha 1',
    },
  ];

  const createdFinishedMatches: any[] = [];
  for (const m of finishedMatches) {
    const existingMatch = await prisma.match.findFirst({
      where: { homeTeamId: teams[m.home].id, awayTeamId: teams[m.away].id, status: MatchStatus.FINISHED }
    });
    
    if (!existingMatch) {
      const match = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          homeTeamId: teams[m.home].id,
          awayTeamId: teams[m.away].id,
          scheduledAt: m.date,
          venue: 'Polideportivo Mendoza',
          round: m.round,
          status: MatchStatus.FINISHED,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          source: 'demo',
        },
      });
      createdFinishedMatches.push({ match, homeSlug: m.home, awaySlug: m.away, homeScore: m.homeScore, awayScore: m.awayScore });
    }
  }

  // Partido en vivo (para demo)
  let liveMatch = await prisma.match.findFirst({
    where: { status: MatchStatus.LIVE }
  });
  
  if (!liveMatch) {
    liveMatch = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homeTeamId: teams['aleman'].id,
        awayTeamId: teams['don-orione'].id,
        scheduledAt: new Date(now.getTime() - 20 * 60 * 1000),
        venue: 'Polideportivo Mendoza',
        round: 'Fecha 2',
        status: MatchStatus.LIVE,
        homeScore: 2,
        awayScore: 1,
        minute: 25,
        source: 'demo',
      },
    });

    // Eventos del partido en vivo
    await prisma.matchEvent.createMany({
      data: [
        { matchId: liveMatch.id, minute: 8, type: 'GOAL', teamId: teams['aleman'].id, playerName: 'Rodríguez', description: 'Gol de Rodríguez - Aleman' },
        { matchId: liveMatch.id, minute: 15, type: 'GOAL', teamId: teams['don-orione'].id, playerName: 'Gutiérrez', description: 'Gol de Gutiérrez - Don Orione' },
        { matchId: liveMatch.id, minute: 22, type: 'GOAL', teamId: teams['aleman'].id, playerName: 'Martínez', description: 'Gol de Martínez - Aleman' },
        { matchId: liveMatch.id, minute: 20, type: 'YELLOW_CARD', teamId: teams['don-orione'].id, playerName: 'López', description: 'Amarilla para López' },
      ],
    });
  }

  // Partidos próximos
  const upcomingMatchesData = [
    {
      home: 'godoy-cruz', away: 'jockey-club',
      date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), round: 'Fecha 2',
    },
    {
      home: 'regatas', away: 'cementista',
      date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), round: 'Fecha 2',
    },
    {
      home: 'andes-talleres', away: 'independiente-rivadavia',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), round: 'Fecha 2',
    },
  ];

  const createdUpcomingMatches: any[] = [];
  for (const m of upcomingMatchesData) {
    let match = await prisma.match.findFirst({
      where: { homeTeamId: teams[m.home].id, awayTeamId: teams[m.away].id, status: MatchStatus.SCHEDULED }
    });
    
    if (!match) {
      match = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          homeTeamId: teams[m.home].id,
          awayTeamId: teams[m.away].id,
          scheduledAt: m.date,
          venue: 'Polideportivo Mendoza',
          round: m.round,
          status: MatchStatus.SCHEDULED,
          source: 'demo',
        },
      });
    }
    createdUpcomingMatches.push({ match, homeSlug: m.home, awaySlug: m.away });
  }

  console.log('✅ Partidos creados');

  // ===========================
  // MERCADOS PARA PARTIDOS PRÓXIMOS Y EN VIVO
  // ===========================
  async function createMarketsForMatch(matchId: string, homeSlug: string, awaySlug: string, homeOdds: number, awayOdds: number) {
    // 1. Ganador
    const winnerMarket = await prisma.market.upsert({
      where: { matchId_type: { matchId, type: MarketType.MATCH_WINNER } },
      update: {},
      create: { matchId, type: MarketType.MATCH_WINNER, name: 'Ganador del partido', status: MarketStatus.OPEN },
    });

    await prisma.marketOption.createMany({
      skipDuplicates: true,
      data: [
        { marketId: winnerMarket.id, label: 'Local', value: 'HOME', odds: homeOdds },
        { marketId: winnerMarket.id, label: 'Empate', value: 'DRAW', odds: 3.20 },
        { marketId: winnerMarket.id, label: 'Visitante', value: 'AWAY', odds: awayOdds },
      ],
    });

    // 2. Doble oportunidad
    const dcMarket = await prisma.market.upsert({
      where: { matchId_type: { matchId, type: MarketType.DOUBLE_CHANCE } },
      update: {},
      create: { matchId, type: MarketType.DOUBLE_CHANCE, name: 'Doble oportunidad', status: MarketStatus.OPEN },
    });

    await prisma.marketOption.createMany({
      skipDuplicates: true,
      data: [
        { marketId: dcMarket.id, label: 'Local o Empate', value: 'HOME_DRAW', odds: 1.25 },
        { marketId: dcMarket.id, label: 'Local o Visitante', value: 'HOME_AWAY', odds: 1.15 },
        { marketId: dcMarket.id, label: 'Empate o Visitante', value: 'DRAW_AWAY', odds: 1.60 },
      ],
    });

    // 3. Más/Menos goles
    const ouMarket = await prisma.market.upsert({
      where: { matchId_type: { matchId, type: MarketType.OVER_UNDER } },
      update: {},
      create: { matchId, type: MarketType.OVER_UNDER, name: 'Más/Menos goles (3.5)', status: MarketStatus.OPEN },
    });

    await prisma.marketOption.createMany({
      skipDuplicates: true,
      data: [
        { marketId: ouMarket.id, label: 'Más de 3.5', value: 'OVER_3.5', odds: 1.65 },
        { marketId: ouMarket.id, label: 'Menos de 3.5', value: 'UNDER_3.5', odds: 2.20 },
      ],
    });

    // 4. Ambos equipos marcan
    const btsMarket = await prisma.market.upsert({
      where: { matchId_type: { matchId, type: MarketType.BOTH_TEAMS_SCORE } },
      update: {},
      create: { matchId, type: MarketType.BOTH_TEAMS_SCORE, name: 'Ambos equipos marcan', status: MarketStatus.OPEN },
    });

    await prisma.marketOption.createMany({
      skipDuplicates: true,
      data: [
        { marketId: btsMarket.id, label: 'Sí', value: 'YES', odds: 1.55 },
        { marketId: btsMarket.id, label: 'No', value: 'NO', odds: 2.40 },
      ],
    });

    // 5. Resultado exacto
    const esMarket = await prisma.market.upsert({
      where: { matchId_type: { matchId, type: MarketType.EXACT_SCORE } },
      update: {},
      create: { matchId, type: MarketType.EXACT_SCORE, name: 'Resultado exacto', status: MarketStatus.OPEN },
    });

    await prisma.marketOption.createMany({
      skipDuplicates: true,
      data: [
        { marketId: esMarket.id, label: '1-0', value: '1-0', odds: 6.50 },
        { marketId: esMarket.id, label: '2-1', value: '2-1', odds: 7.00 },
        { marketId: esMarket.id, label: '3-1', value: '3-1', odds: 7.50 },
        { marketId: esMarket.id, label: '3-2', value: '3-2', odds: 9.00 },
        { marketId: esMarket.id, label: '4-2', value: '4-2', odds: 11.00 },
        { marketId: esMarket.id, label: '4-1', value: '4-1', odds: 10.00 },
        { marketId: esMarket.id, label: '0-1', value: '0-1', odds: 8.00 },
        { marketId: esMarket.id, label: '1-2', value: '1-2', odds: 8.50 },
        { marketId: esMarket.id, label: '2-3', value: '2-3', odds: 9.50 },
        { marketId: esMarket.id, label: '1-1', value: '1-1', odds: 6.00 },
        { marketId: esMarket.id, label: '2-2', value: '2-2', odds: 7.00 },
        { marketId: esMarket.id, label: '3-3', value: '3-3', odds: 12.00 },
      ],
    });

    // 6. Primer equipo en marcar
    const ftsMarket = await prisma.market.upsert({
      where: { matchId_type: { matchId, type: MarketType.FIRST_TEAM_SCORE } },
      update: {},
      create: { matchId, type: MarketType.FIRST_TEAM_SCORE, name: 'Primer equipo en marcar', status: MarketStatus.OPEN },
    });

    await prisma.marketOption.createMany({
      skipDuplicates: true,
      data: [
        { marketId: ftsMarket.id, label: 'Local', value: 'HOME', odds: homeOdds - 0.1 },
        { marketId: ftsMarket.id, label: 'Visitante', value: 'AWAY', odds: awayOdds - 0.1 },
        { marketId: ftsMarket.id, label: 'Ninguno', value: 'NONE', odds: 12.00 },
      ],
    });
  }

  // Crear mercados para el partido en vivo
  await createMarketsForMatch(liveMatch.id, 'aleman', 'don-orione', 1.75, 2.10);

  // Crear mercados para partidos próximos
  const oddsMap: Record<string, [number, number]> = {
    'godoy-cruz-jockey-club': [1.80, 2.05],
    'regatas-cementista': [2.10, 1.90],
    'andes-talleres-independiente-rivadavia': [1.60, 2.80],
  };

  for (const um of createdUpcomingMatches) {
    const key = `${um.homeSlug}-${um.awaySlug}`;
    const odds = oddsMap[key] || [2.00, 2.00];
    await createMarketsForMatch(um.match.id, um.homeSlug, um.awaySlug, odds[0], odds[1]);
  }

  console.log('✅ Mercados y cuotas creados');

  // ===========================
  // MERCADOS RESUELTOS para partidos finalizados
  // ===========================
  for (const fm of createdFinishedMatches) {
    const homeWon = fm.homeScore > fm.awayScore;
    const awayWon = fm.awayScore > fm.homeScore;
    const totalGoals = fm.homeScore + fm.awayScore;

    // Crear mercados settled
    const winnerMarket = await prisma.market.create({
      data: {
        matchId: fm.match.id,
        type: MarketType.MATCH_WINNER,
        name: 'Ganador del partido',
        status: MarketStatus.SETTLED,
        settledAt: new Date(),
      },
    });

    await prisma.marketOption.createMany({
      data: [
        { marketId: winnerMarket.id, label: 'Local', value: 'HOME', odds: 1.80, result: homeWon ? SelectionResult.WON : SelectionResult.LOST },
        { marketId: winnerMarket.id, label: 'Empate', value: 'DRAW', odds: 3.20, result: !homeWon && !awayWon ? SelectionResult.WON : SelectionResult.LOST },
        { marketId: winnerMarket.id, label: 'Visitante', value: 'AWAY', odds: 2.10, result: awayWon ? SelectionResult.WON : SelectionResult.LOST },
      ],
    });

    const ouMarket = await prisma.market.create({
      data: {
        matchId: fm.match.id,
        type: MarketType.OVER_UNDER,
        name: 'Más/Menos goles (3.5)',
        status: MarketStatus.SETTLED,
        settledAt: new Date(),
      },
    });

    await prisma.marketOption.createMany({
      data: [
        { marketId: ouMarket.id, label: 'Más de 3.5', value: 'OVER_3.5', odds: 1.65, result: totalGoals > 3.5 ? SelectionResult.WON : SelectionResult.LOST },
        { marketId: ouMarket.id, label: 'Menos de 3.5', value: 'UNDER_3.5', odds: 2.20, result: totalGoals <= 3.5 ? SelectionResult.WON : SelectionResult.LOST },
      ],
    });
  }

  console.log('✅ Mercados de partidos finalizados creados');

  // ===========================
  // APUESTA DEMO (usuario demo con apuesta ganada)
  // ===========================
  const user1Wallet = await prisma.virtualWallet.findUnique({ where: { userId: user1.id } });
  if (user1Wallet && createdUpcomingMatches.length > 0) {
    const upcomingMatch = createdUpcomingMatches[0].match;
    const market = await prisma.market.findFirst({ where: { matchId: upcomingMatch.id, type: MarketType.MATCH_WINNER } });
    const homeOption = await prisma.marketOption.findFirst({ where: { marketId: market!.id, value: 'HOME' } });

    if (market && homeOption) {
      const stake = 100;
      const newBalance = Number(user1Wallet.balance) - stake;

      await prisma.walletTransaction.create({
        data: {
          walletId: user1Wallet.id,
          type: TransactionType.BET_PLACED,
          amount: -stake,
          balanceBefore: Number(user1Wallet.balance),
          balanceAfter: newBalance,
          description: 'Apuesta colocada — Partido próximo',
        },
      });

      await prisma.virtualWallet.update({
        where: { id: user1Wallet.id },
        data: { balance: newBalance, totalBet: { increment: stake } },
      });

      await prisma.bet.create({
        data: {
          userId: user1.id,
          totalOdds: Number(homeOption.odds),
          stakeAmount: stake,
          potentialPayout: stake * Number(homeOption.odds),
          status: BetStatus.PENDING,
          isCombined: false,
          selections: {
            create: [{
              marketOptionId: homeOption.id,
              odds: Number(homeOption.odds),
              result: SelectionResult.PENDING,
            }],
          },
        },
      });
    }
  }

  // ===========================
  // NOTIFICACIONES DEMO
  // ===========================
  await prisma.notification.createMany({
    skipDuplicates: false,
    data: [
      {
        userId: user1.id,
        title: '¡Bienvenido a FutsalBet!',
        message: 'Recibiste 1000 puntos virtuales de bienvenida. ¡Empieza a pronosticar!',
        type: 'SYSTEM',
        isRead: false,
      },
      {
        userId: user1.id,
        title: 'Nuevo partido disponible',
        message: 'Godoy Cruz vs Jockey Club — Hay mercados disponibles para pronosticar.',
        type: 'MATCH_START',
        isRead: false,
      },
    ],
  });

  console.log('✅ Notificaciones demo creadas');
  console.log('');
  console.log('🎉 ¡Seed completado exitosamente!');
  console.log('');
  console.log('👤 Credenciales de acceso:');
  console.log('   Admin: admin@futsalbet.com / Admin123!');
  console.log('   Usuario: usuario@futsalbet.com / User123!');
  console.log('');
  console.log('🏆 Torneo: FEFUSA Mendoza — Primera Clausura 2026');
  console.log(`🏟️  Equipos: ${teamsData.length}`);
  console.log('⚽ Partidos: 6 finalizados + 1 en vivo + 3 próximos');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
