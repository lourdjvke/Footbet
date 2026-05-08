export interface Team {
  id: string;
  name: string;
  shortName: string;
  badge: string | null;
  fanart?: string;
  stadium?: string;
  country?: {
    alpha2: string;
    name?: string;
  };
  teamColors?: {
    primary: string;
    secondary: string;
  };
}

export interface Match {
  id: string;
  match_id?: string;
  home_id?: string;
  away_id?: string;
  isSofascore?: boolean;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  stadium: string;
  homeScore?: number;
  awayScore?: number;
  status: 'upcoming' | 'live' | 'finished';
  statusDescription?: string;
  tournamentName?: string;
  minute?: number;
  statistics?: any[];
  lineup?: any;
  rawGoals?: any[];
  homeSystem?: string;
  awaySystem?: string;
}

export interface StandingTeam extends Team {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  probability: number;
}

export const mapSofaMatch = (m: any): Match => {
  // Use the root-level 'id' field — the Sofascore event ID that appears after
  // 'crowdsourcingDataDisplayEnabled' in the API response. Use != null so that
  // a valid ID of 0 is not skipped. Only fall back if e.id is truly absent.
  const rootId = m.id != null ? m.id : (m.match_id ?? m.matchId ?? "");
  const eventId = String(rootId);
  
  // Extract and normalize team IDs
  const homeTeamId = String(m.homeTeam?.id || m.match_hometeam_id || m.home_id || "");
  const awayTeamId = String(m.awayTeam?.id || m.match_awayteam_id || m.away_id || "");

  return {
    id: eventId,
    match_id: eventId,
    home_id: homeTeamId,
    away_id: awayTeamId,
    isSofascore: true,
    homeTeam: {
      id: homeTeamId,
      name: m.homeTeam?.name || m.match_hometeam_name || "Home Team",
      shortName: m.homeTeam?.shortName || m.homeTeam?.name?.substring(0, 3).toUpperCase() || m.match_hometeam_name?.substring(0, 3).toUpperCase() || "HOM",
      badge: m.homeTeam?.id ? `https://api.sofascore.app/api/v1/team/${m.homeTeam.id}/image` : (m.team_home_badge || null),
      country: m.homeTeam?.country ? { alpha2: m.homeTeam.country.alpha2, name: m.homeTeam.country.name } : undefined,
      teamColors: m.homeTeam?.teamColors ? { primary: m.homeTeam.teamColors.primary, secondary: m.homeTeam.teamColors.secondary } : undefined
    },
    awayTeam: {
      id: awayTeamId,
      name: m.awayTeam?.name || m.match_awayteam_name || "Away Team",
      shortName: m.awayTeam?.shortName || m.awayTeam?.name?.substring(0, 3).toUpperCase() || m.match_awayteam_name?.substring(0, 3).toUpperCase() || "AWY",
      badge: m.awayTeam?.id ? `https://api.sofascore.app/api/v1/team/${m.awayTeam.id}/image` : (m.team_away_badge || null),
      country: m.awayTeam?.country ? { alpha2: m.awayTeam.country.alpha2, name: m.awayTeam.country.name } : undefined,
      teamColors: m.awayTeam?.teamColors ? { primary: m.awayTeam.teamColors.primary, secondary: m.awayTeam.teamColors.secondary } : undefined
    },
    date: new Date(m.startTimestamp * 1000).toLocaleDateString(),
    time: new Date(m.startTimestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    stadium: m.tournament?.name || m.venue?.name || "Stadium",
    tournamentName: m.tournament?.name,
    homeScore: (m.homeScore?.display ?? m.homeScore?.current ?? 0),
    awayScore: (m.awayScore?.display ?? m.awayScore?.current ?? 0),
    status: m.status?.type === 'inprogress' ? 'live' : (m.status?.type === 'finished' ? 'finished' : 'upcoming'),
    statusDescription: m.status?.description,
    minute: (() => {
       if (m.status?.description === 'Halftime') return 45;
       if (m.status?.type !== 'inprogress' || !m.time?.currentPeriodStartTimestamp) return 0;
       const elapsed = Math.floor((Date.now() / 1000 - m.time.currentPeriodStartTimestamp) / 60);
       const base = m.status?.description === '2nd half' ? 45 : 0;
       return Math.min(90, base + elapsed);
    })(),
    rawGoals: [],
    statistics: []
  };
};
