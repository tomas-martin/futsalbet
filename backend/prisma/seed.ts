import { PrismaClient, MatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed REAL — FEFUSA Mendoza Primera FSP Clausura 2026...');

  // ===========================
  // LIMPIAR BD (orden correcto por FK)
  // ===========================
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.match.deleteMany();
  await prisma.standing.deleteMany();
  await prisma.categoryTeam.deleteMany();
  await prisma.category.deleteMany();
  await prisma.favoriteTeam.deleteMany();
  await prisma.favoriteTournament.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.user.deleteMany();

  // ===========================
  // USUARIOS (los logins van por Supabase Auth)
  // ===========================
  const admin = await prisma.user.create({
    data: {
      email: 'admin@futsalbet.com',
      username: 'admin',
      displayName: 'Administrador',
      role: 'ADMIN',
    },
  });

  const usuario = await prisma.user.create({
    data: {
      email: 'usuario@futsalbet.com',
      username: 'usuario1',
      displayName: 'Usuario Demo',
    },
  });

  console.log('✅ Usuarios creados');

  // ===========================
  // TORNEO
  // ===========================
  const tournament = await prisma.tournament.create({
    data: {
      name: 'FEFUSA Mendoza — Primera FSP Clausura 2026',
      slug: 'fefusa-fsp-clausura-2026',
      sport: 'futsal',
      country: 'Argentina',
      region: 'Mendoza',
      organizer: 'FEFUSA Mendoza',
      season: '2026',
      logoUrl: 'https://cdn.scorefy.app/tournaments/shield/FFM-P-M-FSP-C-2026.png',
      isActive: true,
      source: 'scorefy',
      externalId: 'FFM-P-M-FSP-C-2026',
    },
  });

  const category = await prisma.category.create({
    data: {
      tournamentId: tournament.id,
      name: 'Primera FSP',
      slug: 'primera-fsp',
      gender: 'masculino',
    },
  });

  console.log('✅ Torneo y categoría creados');

  // ===========================
  // 16 EQUIPOS REALES con logos de Scorefy
  // ===========================
  const teamsData = [
    { name: 'Alemán',                  shortName: 'ALE', slug: 'aleman',                  logoUrl: 'https://cdn.scorefy.app/teams/shield/buqhdbuybepnrwfj45861sfmv.png' },
    { name: 'Don Orione',              shortName: 'DOR', slug: 'don-orione',               logoUrl: 'https://cdn.scorefy.app/teams/shield/xxvykydpifsapfau72439crkk.png' },
    { name: 'Godoy Cruz',              shortName: 'GCR', slug: 'godoy-cruz',               logoUrl: 'https://cdn.scorefy.app/teams/shield/tpuenmmsfepzkuvs52687qkrz.png' },
    { name: 'Jockey Club',             shortName: 'JOC', slug: 'jockey-club',              logoUrl: 'https://cdn.scorefy.app/teams/shield/xiixkzqhypqkmtyr19648wlcf.png' },
    { name: 'Andes Talleres',          shortName: 'AND', slug: 'andes-talleres',           logoUrl: 'https://cdn.scorefy.app/teams/shield/tziicpsffzkwooln63257wnaj.png' },
    { name: 'Regatas',                 shortName: 'REG', slug: 'regatas',                  logoUrl: 'https://cdn.scorefy.app/teams/shield/adrithlvwtdhgcxm44467psde.png' },
    { name: 'Muni San Martín',         shortName: 'MSM', slug: 'muni-san-martin',          logoUrl: 'https://cdn.scorefy.app/teams/shield/clv9y14tc0002s5sdcij3kdes.png' },
    { name: 'Villa Hipódromo',         shortName: 'VHI', slug: 'villa-hipodromo',          logoUrl: 'https://cdn.scorefy.app/teams/shield/wejbvnpjfddprayi56851nywm.png' },
    { name: 'Cementista',              shortName: 'CEM', slug: 'cementista',               logoUrl: 'https://cdn.scorefy.app/teams/shield/niujlcyjulnsrfss48567ijaa.png' },
    { name: 'Independiente Rivadavia', shortName: 'IND', slug: 'independiente-rivadavia',  logoUrl: 'https://cdn.scorefy.app/teams/shield/jlmvlskhdofdgywx21537tyml.png' },
    { name: 'Vistalba La Colonia',     shortName: 'VIS', slug: 'vistalba-la-colonia',      logoUrl: 'https://cdn.scorefy.app/teams/shield/qcovjxoltlivasyy94560eqge.png' },
    { name: 'Don Bosco',               shortName: 'BOC', slug: 'don-bosco',                logoUrl: 'https://cdn.scorefy.app/teams/shield/evgubysfaryqquxp91003epne.png' },
    { name: 'CUC',                     shortName: 'CUC', slug: 'cuc',                      logoUrl: 'https://cdn.scorefy.app/teams/shield/tythronuthqkvmdl94637zbol.png' },
    { name: 'UMAZA',                   shortName: 'UMA', slug: 'umaza',                    logoUrl: 'https://cdn.scorefy.app/teams/shield/rvrkcfvivhratbxd30828eoll.png' },
    { name: 'Banco Nación',            shortName: 'BNA', slug: 'banco-nacion',             logoUrl: 'https://cdn.scorefy.app/teams/shield/iqsonebbiywvoxzr63562kwcg.png' },
    { name: 'COP',                     shortName: 'COP', slug: 'cop',                      logoUrl: 'https://cdn.scorefy.app/teams/shield/uuouhvydksjxykxe23230jxen.png' },
  ];

  const teams: Record<string, any> = {};
  for (const t of teamsData) {
    const team = await prisma.team.create({
      data: {
        name: t.name,
        shortName: t.shortName,
        slug: t.slug,
        logoUrl: t.logoUrl,
        city: 'Mendoza',
        country: 'Argentina',
        region: 'Mendoza',
        source: 'scorefy',
      },
    });
    teams[t.slug] = team;
    await prisma.categoryTeam.create({ data: { teamId: team.id, categoryId: category.id } });
  }
  console.log('✅ 16 equipos reales creados con logos de Scorefy');

  // ===========================
  // TABLA DE POSICIONES (datos reales jornada 2)
  // ===========================
  const standingsData = [
    { slug: 'aleman',                  pos: 1,  pts: 6, pj: 2, pg: 2, pe: 0, pp: 0, gf: 11, gc: 3  },
    { slug: 'don-orione',              pos: 2,  pts: 6, pj: 2, pg: 2, pe: 0, pp: 0, gf: 10, gc: 2  },
    { slug: 'godoy-cruz',              pos: 3,  pts: 6, pj: 2, pg: 2, pe: 0, pp: 0, gf: 12, gc: 5  },
    { slug: 'jockey-club',             pos: 4,  pts: 6, pj: 2, pg: 2, pe: 0, pp: 0, gf: 10, gc: 4  },
    { slug: 'andes-talleres',          pos: 5,  pts: 6, pj: 2, pg: 2, pe: 0, pp: 0, gf: 5,  gc: 2  },
    { slug: 'regatas',                 pos: 6,  pts: 4, pj: 2, pg: 1, pe: 1, pp: 0, gf: 7,  gc: 5  },
    { slug: 'muni-san-martin',         pos: 7,  pts: 4, pj: 2, pg: 1, pe: 1, pp: 0, gf: 7,  gc: 6  },
    { slug: 'villa-hipodromo',         pos: 8,  pts: 3, pj: 2, pg: 1, pe: 0, pp: 1, gf: 4,  gc: 4  },
    { slug: 'cementista',              pos: 9,  pts: 3, pj: 2, pg: 1, pe: 0, pp: 1, gf: 6,  gc: 3  },
    { slug: 'independiente-rivadavia', pos: 10, pts: 1, pj: 2, pg: 0, pe: 1, pp: 1, gf: 3,  gc: 8  },
    { slug: 'vistalba-la-colonia',     pos: 11, pts: 1, pj: 2, pg: 0, pe: 1, pp: 1, gf: 4,  gc: 7  },
    { slug: 'don-bosco',               pos: 12, pts: 0, pj: 2, pg: 0, pe: 0, pp: 2, gf: 2,  gc: 9  },
    { slug: 'cuc',                     pos: 13, pts: 0, pj: 2, pg: 0, pe: 0, pp: 2, gf: 3,  gc: 10 },
    { slug: 'umaza',                   pos: 14, pts: 0, pj: 2, pg: 0, pe: 0, pp: 2, gf: 3,  gc: 11 },
    { slug: 'banco-nacion',            pos: 15, pts: 0, pj: 2, pg: 0, pe: 0, pp: 2, gf: 1,  gc: 8  },
    { slug: 'cop',                     pos: 16, pts: 0, pj: 2, pg: 0, pe: 0, pp: 2, gf: 2,  gc: 12 },
  ];

  for (const s of standingsData) {
    await prisma.standing.create({
      data: {
        tournamentId: tournament.id,
        teamId: teams[s.slug].id,
        position: s.pos,
        points: s.pts,
        played: s.pj,
        won: s.pg,
        drawn: s.pe,
        lost: s.pp,
        goalsFor: s.gf,
        goalsAgainst: s.gc,
        goalDiff: s.gf - s.gc,
      },
    });
  }
  console.log('✅ Tabla de posiciones cargada');

  // ===========================
  // HELPER: crear partido
  // ===========================
  async function createMatch(
    homeSlug: string, awaySlug: string,
    venue: string, round: string,
    date: Date, status: MatchStatus,
    homeScore?: number, awayScore?: number
  ) {
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homeTeamId: teams[homeSlug].id,
        awayTeamId: teams[awaySlug].id,
        scheduledAt: date,
        venue,
        round,
        status,
        homeScore: homeScore ?? null,
        awayScore: awayScore ?? null,
        source: 'scorefy',
      },
    });

    return match;
  }

  // ===========================
  // JORNADA 1 — Finalizados
  // ===========================
  const j1 = (h: string, m: string) => new Date(`2026-07-31T${h}:${m}:00-03:00`);
  await createMatch('aleman',                  'cuc',                 'Colegio Alemán',          'Jornada 1', j1('21','00'), MatchStatus.FINISHED, 7, 1);
  await createMatch('don-orione',              'umaza',               'Don Orione',               'Jornada 1', j1('21','30'), MatchStatus.FINISHED, 6, 1);
  await createMatch('godoy-cruz',              'banco-nacion',        'ETIEC',                    'Jornada 1', j1('21','30'), MatchStatus.FINISHED, 8, 0);
  await createMatch('jockey-club',             'cop',                 'Jockey Club',              'Jornada 1', j1('22','00'), MatchStatus.FINISHED, 7, 1);
  await createMatch('andes-talleres',          'don-bosco',           'Don Bosco',                'Jornada 1', j1('22','00'), MatchStatus.FINISHED, 4, 1);
  await createMatch('regatas',                 'independiente-rivadavia', 'Regatas (Parque)',     'Jornada 1', j1('21','00'), MatchStatus.FINISHED, 3, 3);
  await createMatch('muni-san-martin',         'vistalba-la-colonia', 'Muni San Martín',          'Jornada 1', j1('21','30'), MatchStatus.FINISHED, 4, 4);
  await createMatch('villa-hipodromo',         'cementista',          'Villa Hipódromo',          'Jornada 1', j1('21','30'), MatchStatus.FINISHED, 2, 4);

  console.log('✅ Jornada 1 creada');

  // ===========================
  // JORNADA 2 — Finalizados
  // ===========================
  const j2 = (h: string, m: string) => new Date(`2026-08-07T${h}:${m}:00-03:00`);
  await createMatch('cuc',                     'godoy-cruz',          'Camping Cerveceros',       'Jornada 2', j2('21','30'), MatchStatus.FINISHED, 2, 4);
  await createMatch('umaza',                   'aleman',              'UMAZA',                    'Jornada 2', j2('21','30'), MatchStatus.FINISHED, 2, 4);
  await createMatch('banco-nacion',            'jockey-club',         'Club Banco Nación',        'Jornada 2', j2('21','30'), MatchStatus.FINISHED, 1, 3);
  await createMatch('cop',                     'andes-talleres',      'ETIEC',                    'Jornada 2', j2('22','00'), MatchStatus.FINISHED, 1, 1);
  await createMatch('don-bosco',               'don-orione',          'Don Bosco',                'Jornada 2', j2('21','30'), MatchStatus.FINISHED, 1, 4);
  await createMatch('independiente-rivadavia', 'villa-hipodromo',     'Independiente Rivadavia',  'Jornada 2', j2('21','30'), MatchStatus.FINISHED, 0, 2);
  await createMatch('vistalba-la-colonia',     'muni-san-martin',     'Vistalba La Colonia',      'Jornada 2', j2('21','30'), MatchStatus.FINISHED, 0, 3);
  await createMatch('cementista',              'regatas',             'Cementista',               'Jornada 2', j2('21','00'), MatchStatus.FINISHED, 2, 4);

  console.log('✅ Jornada 2 creada');

  // ===========================
  // JORNADA 3 — Próximos (14/Aug 2026)
  // ===========================
  const j3 = (h: string, m: string) => new Date(`2026-08-14T${h}:${m}:00-03:00`);
  await createMatch('regatas',                 'cementista',          'Regatas (Parque)',          'Jornada 3', j3('21','00'), MatchStatus.SCHEDULED);
  await createMatch('vistalba-la-colonia',     'don-orione',          'Vistalba La Colonia',      'Jornada 3', j3('21','30'), MatchStatus.SCHEDULED);
  await createMatch('don-bosco',               'andes-talleres',      'Don Bosco',                'Jornada 3', j3('21','30'), MatchStatus.SCHEDULED);
  await createMatch('cuc',                     'umaza',               'Camping Cerveceros',       'Jornada 3', j3('21','30'), MatchStatus.SCHEDULED);
  await createMatch('independiente-rivadavia', 'muni-san-martin',     'Independiente Rivadavia',  'Jornada 3', j3('21','30'), MatchStatus.SCHEDULED);
  await createMatch('villa-hipodromo',         'jockey-club',         'Parque de los Niños',      'Jornada 3', j3('21','30'), MatchStatus.SCHEDULED);
  await createMatch('banco-nacion',            'aleman',              'Club Banco Nación',        'Jornada 3', j3('21','30'), MatchStatus.SCHEDULED);
  await createMatch('cop',                     'godoy-cruz',          'ETIEC',                    'Jornada 3', j3('22','00'), MatchStatus.SCHEDULED);

  console.log('✅ Jornada 3 creada (8 partidos próximos para el prode)');

  // ===========================
  // NOTIFICACIONES
  // ===========================
  await prisma.notification.create({
    data: {
      userId: usuario.id,
      title: '¡Bienvenido a FutsalBet!',
      message: 'Tu cuenta fue creada. ¡Armá tus pronósticos del prode de la FEFUSA!',
      type: 'SYSTEM',
    },
  });
  await prisma.notification.create({
    data: {
      userId: usuario.id,
      title: '🏆 Jornada 3 disponible',
      message: '8 partidos el jueves 14/Ago. ¡Ya podés pronosticar!',
      type: 'SYSTEM',
    },
  });

  console.log(`
🎉 Seed completado exitosamente!

🏆 FEFUSA Mendoza — Primera FSP Clausura 2026
   • 16 equipos reales con logos de Scorefy
   • Jornadas 1 y 2: 16 partidos finalizados
   • Jornada 3: 8 partidos próximos para el prode
  `);
}

main()
  .catch((e) => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });