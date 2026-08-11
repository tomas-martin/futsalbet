import { DataSourceAdapter, ExternalTournament, ExternalTeam, ExternalMatch, ExternalStanding } from './DataSourceAdapter';

export class DemoDataSource implements DataSourceAdapter {
  sourceName = 'DemoAuthorizedProvider';

  async fetchTournaments(): Promise<ExternalTournament[]> {
    return [
      {
        externalId: 'FFM-P-M-FSP-C-2026',
        name: 'FEFUSA Mendoza — Primera Clausura 2026',
        slug: 'fefusa-mendoza-primera-clausura-2026',
        season: '2026',
        sport: 'futsal',
        country: 'Argentina',
        region: 'Mendoza',
        organizer: 'FEFUSA Mendoza',
        logoUrl: 'https://cdn.scorefy.app/organizations/clv9y0n5g000dz5h25dzv1uj4.png',
      },
    ];
  }

  async fetchTeams(_tournamentExternalId: string): Promise<ExternalTeam[]> {
    return [
      { externalId: 'aleman-fefusa', name: 'Aleman', slug: 'aleman', shortName: 'ALE', logoUrl: 'https://cdn.scorefy.app/teams/shield/buqhdbuybepnrwfj45861sfmv.png' },
      { externalId: 'don-orione-fefusa', name: 'Don Orione', slug: 'don-orione', shortName: 'DON', logoUrl: 'https://cdn.scorefy.app/teams/shield/xxvykydpifsapfau72439crkk.png' },
      { externalId: 'godoy-cruz-futsal-mendoza', name: 'Godoy Cruz', slug: 'godoy-cruz', shortName: 'GOD', logoUrl: 'https://cdn.scorefy.app/teams/shield/tpuenmmsfepzkuvs52687qkrz.png' },
      { externalId: 'jockey-club-fefusa', name: 'Jockey Club', slug: 'jockey-club', shortName: 'JOC', logoUrl: 'https://cdn.scorefy.app/teams/shield/xiixkzqhypqkmtyr19648wlcf.png' },
      { externalId: 'andes-talleres-futsal-mendoza', name: 'Andes Talleres', slug: 'andes-talleres', shortName: 'AND', logoUrl: 'https://cdn.scorefy.app/teams/shield/tziicpsffzkwooln63257wnaj.png' },
      { externalId: 'regatas-futsal-mendoza', name: 'Regatas', slug: 'regatas', shortName: 'REG', logoUrl: 'https://cdn.scorefy.app/teams/shield/adrithlvwtdhgcxm44467psde.png' },
      { externalId: 'muni-san-martin-futsal', name: 'Muni San Martin', slug: 'muni-san-martin', shortName: 'MSM', logoUrl: 'https://cdn.scorefy.app/teams/shield/clv9y14tc0002s5sdcij3kdes.png' },
      { externalId: 'villa-hipodromo-fefusa', name: 'Villa Hipodromo', slug: 'villa-hipodromo', shortName: 'VH', logoUrl: 'https://cdn.scorefy.app/teams/shield/wejbvnpjfddprayi56851nywm.png' },
      { externalId: 'cementista-fefusa', name: 'Cementista', slug: 'cementista', shortName: 'CEM', logoUrl: 'https://cdn.scorefy.app/teams/shield/niujlcyjulnsrfss48567ijaa.png' },
      { externalId: 'independiente-rivadavia-futsal-mendoza', name: 'Independiente Rivadavia', slug: 'independiente-rivadavia', shortName: 'IND', logoUrl: 'https://cdn.scorefy.app/teams/shield/jlmvlskhdofdgywx21537tyml.png' },
    ];
  }

  async fetchMatches(tournamentExternalId: string): Promise<ExternalMatch[]> {
    const now = new Date();
    return [
      {
        externalId: 'match-ext-101',
        tournamentExternalId,
        homeTeamExternalId: 'godoy-cruz-futsal-mendoza',
        awayTeamExternalId: 'jockey-club-fefusa',
        scheduledAt: new Date(now.getTime() + 48 * 3600 * 1000),
        venue: 'Estadio Godoy Cruz',
        round: 'Fecha 3',
        status: 'SCHEDULED',
      },
      {
        externalId: 'match-ext-102',
        tournamentExternalId,
        homeTeamExternalId: 'aleman-fefusa',
        awayTeamExternalId: 'don-orione-fefusa',
        scheduledAt: new Date(now.getTime() + 72 * 3600 * 1000),
        venue: 'Club Aleman',
        round: 'Fecha 3',
        status: 'SCHEDULED',
      },
    ];
  }

  async fetchStandings(tournamentExternalId: string): Promise<ExternalStanding[]> {
    return [
      { tournamentExternalId, teamExternalId: 'aleman-fefusa', position: 1, played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 11, goalsAgainst: 3, points: 6 },
      { tournamentExternalId, teamExternalId: 'don-orione-fefusa', position: 2, played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 10, goalsAgainst: 2, points: 6 },
      { tournamentExternalId, teamExternalId: 'godoy-cruz-futsal-mendoza', position: 3, played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 12, goalsAgainst: 5, points: 6 },
      { tournamentExternalId, teamExternalId: 'jockey-club-fefusa', position: 4, played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 10, goalsAgainst: 4, points: 6 },
    ];
  }
}
