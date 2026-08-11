export interface ExternalTournament {
  externalId: string;
  name: string;
  slug: string;
  season: string;
  sport: string;
  country: string;
  region: string;
  organizer: string;
  logoUrl?: string;
}

export interface ExternalTeam {
  externalId: string;
  name: string;
  slug: string;
  shortName?: string;
  logoUrl?: string;
}

export interface ExternalMatch {
  externalId: string;
  tournamentExternalId: string;
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  scheduledAt: Date;
  venue?: string;
  round?: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  homeScore?: number;
  awayScore?: number;
}

export interface ExternalStanding {
  tournamentExternalId: string;
  teamExternalId: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface DataSourceAdapter {
  sourceName: string;
  fetchTournaments(): Promise<ExternalTournament[]>;
  fetchTeams(tournamentExternalId: string): Promise<ExternalTeam[]>;
  fetchMatches(tournamentExternalId: string): Promise<ExternalMatch[]>;
  fetchStandings(tournamentExternalId: string): Promise<ExternalStanding[]>;
}
