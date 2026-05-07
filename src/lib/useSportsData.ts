import { useState, useEffect, useCallback, useRef } from 'react';

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

// Fallback data
const FALLBACK_TEAMS: Record<string, Team> = {
  canada: { id: 'can', name: 'Canada', shortName: 'CAN', badge: 'https://flagcdn.com/w160/ca.png' },
  qatar: { id: 'qat', name: 'Qatar', shortName: 'QAT', badge: 'https://flagcdn.com/w160/qa.png' },
  brazil: { id: 'bra', name: 'Brazil', shortName: 'BRA', badge: 'https://flagcdn.com/w160/br.png' },
  morocco: { id: 'mar', name: 'Morocco', shortName: 'MAR', badge: 'https://flagcdn.com/w160/ma.png' },
  scotland: { id: 'sco', name: 'Scotland', shortName: 'SCO', badge: 'https://flagcdn.com/w160/gb-sct.png' },
  spain: { id: 'esp', name: 'Spain', shortName: 'ESP', badge: 'https://flagcdn.com/w160/es.png' },
  france: { id: 'fra', name: 'France', shortName: 'FRA', badge: 'https://flagcdn.com/w160/fr.png' },
  germany: { id: 'ger', name: 'Germany', shortName: 'GER', badge: 'https://flagcdn.com/w160/de.png' },
};

// Module level cache to share data across components
let globalSportsDataCache: any = null;
let globalFetchPromise: Promise<any> | null = null;

export function useSportsData() {
  const [loading, setLoading] = useState(!globalSportsDataCache);
  const [standingsLoaded, setStandingsLoaded] = useState(!!globalSportsDataCache?.allStandings);
  const [liveMatchesLoading, setLiveMatchesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState(globalSportsDataCache ? 100 : 0);

  const [liveMatch, setLiveMatch] = useState<Match | null>(globalSportsDataCache?.liveMatch || null);

  const [allLiveMatches, setAllLiveMatches] = useState<Match[]>(globalSportsDataCache?.allLiveMatches || []);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>(globalSportsDataCache?.upcomingMatches || []);
  const [allStandings, setAllStandings] = useState<Record<string, StandingTeam[]>>(globalSportsDataCache?.allStandings || {});
  const [heroImage, setHeroImage] = useState(globalSportsDataCache?.heroImage || "https://images.unsplash.com/photo-1574629810360-1e5b8d009fc2?q=80&w=1200&auto=format&fit=crop");
  const [mvp, setMvp] = useState(globalSportsDataCache?.mvp || {
     name: "Harry Kane",
     description: "Top Scorer",
     team: "FC Bayern München",
     teamBadge: "https://upload.wikimedia.org/wikipedia/commons/1/1f/Logo_FC_Bayern_M%C3%BCnchen_%282002%E2%80%932017%29.svg",
     age: 31,
     score: 95,
     image: "https://images.unsplash.com/photo-1551280857-2b9bae120c51?q=80&w=300&auto=format&fit=crop"
  });

  const mountedRef = useRef(true);

  const fetchRealData = useCallback(async () => {
    const API_KEY = "f29d4c662ac81ed3a744727739add7a4a55e655c566695265112a2c9527bb7fb";

    const safeFetch = async (query: string) => {
      try {
        const res = await fetch(`/api/football?${query}`);
        if (res.ok) return await res.json();
      } catch (e) {}
      const res = await fetch(`https://apiv3.apifootball.com/?${query}&APIkey=${API_KEY}`);
      if (!res.ok) throw new Error(`API failed: ${res.status}`);
      return await res.json();
    };

    try {
      if (!globalSportsDataCache) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setLiveMatchesLoading(true);
      setProgress(5);

      let allMatchesData: any[] = [];
      
      try {
         const sofaRes = await fetch("/api/live-events");
         if (sofaRes.ok) {
            const sofaData = await sofaRes.json();
            if (sofaData && sofaData.events) {
               const sofaMapped: Match[] = sofaData.events.map((m: any) => ({
                  id: String(m.id),
                  isSofascore: true,
                  homeTeam: {
                    id: String(m.homeTeam.id),
                    name: m.homeTeam.name,
                    shortName: m.homeTeam.shortName || m.homeTeam.name.substring(0, 3).toUpperCase(),
                    badge: m.homeTeam.id ? `https://api.sofascore.app/api/v1/team/${m.homeTeam.id}/image` : null,
                    country: m.homeTeam.country ? { alpha2: m.homeTeam.country.alpha2, name: m.homeTeam.country.name } : undefined,
                    teamColors: m.homeTeam.teamColors ? { primary: m.homeTeam.teamColors.primary, secondary: m.homeTeam.teamColors.secondary } : undefined
                  },
                  awayTeam: {
                    id: String(m.awayTeam.id),
                    name: m.awayTeam.name,
                    shortName: m.awayTeam.shortName || m.awayTeam.name.substring(0, 3).toUpperCase(),
                    badge: m.awayTeam.id ? `https://api.sofascore.app/api/v1/team/${m.awayTeam.id}/image` : null,
                    country: m.awayTeam.country ? { alpha2: m.awayTeam.country.alpha2, name: m.awayTeam.country.name } : undefined,
                    teamColors: m.awayTeam.teamColors ? { primary: m.awayTeam.teamColors.primary, secondary: m.awayTeam.teamColors.secondary } : undefined
                  },
                   date: new Date(m.startTimestamp * 1000).toLocaleDateString(),
                   time: new Date(m.startTimestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  stadium: m.tournament?.name || "Stadium",
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
               }));
               if (sofaMapped.length > 0) allMatchesData = sofaMapped;
            }
         }
      } catch(e) {}

      setProgress(30);

      const LEAGUES = [
        { id: '152', name: 'Premier League' },
        { id: '175', name: 'Bundesliga' },
        { id: '244', name: 'Eredivisie' },
        { id: '3',   name: 'Champions League' }
      ];

      const standingsMap: Record<string, StandingTeam[]> = {};
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const fromDate = tomorrow.toISOString().split('T')[0];
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1);
      const toDate = nextMonth.toISOString().split('T')[0];
      
      const standingsPromises = LEAGUES.map(async (l) => {
        try {
           const data = await safeFetch(`action=get_standings&league_id=${l.id}`);
           if (Array.isArray(data)) {
             standingsMap[l.name] = data.map((t: any) => ({
                id: String(t.team_id),
                name: t.team_name,
                shortName: t.team_name.substring(0, 3).toUpperCase(),
                badge: t.team_badge || null,
                played: Number(t.overall_league_payed),
                won: Number(t.overall_league_W),
                drawn: Number(t.overall_league_D),
                lost: Number(t.overall_league_L),
                points: Number(t.overall_league_PTS),
                probability: Math.floor(50 + (Math.random() * 40)) 
             }));
           }
        } catch (e) {}
      });

      const otherMatchesPromises = LEAGUES.map(async (l) => {
         if (allMatchesData.length > 20) return;
         try {
           const liveRes = await safeFetch(`action=get_events&match_live=1&league_id=${l.id}`);
           if (Array.isArray(liveRes)) allMatchesData = [...allMatchesData, ...liveRes];
           const data = await safeFetch(`action=get_events&from=${fromDate}&to=${toDate}&league_id=${l.id}`);
           if (Array.isArray(data)) allMatchesData = [...allMatchesData, ...data];
         } catch (e) {}
      });

      await Promise.all([...standingsPromises, ...otherMatchesPromises]);
      
      if (!mountedRef.current) return;
      
      setStandingsLoaded(true);
      setLiveMatchesLoading(false);
      setProgress(70);

      allMatchesData.sort((a, b) => {
         const dateA = a.date ? new Date(a.date) : new Date(a.match_date);
         const dateB = b.date ? new Date(b.date) : new Date(b.match_date);
         return dateB.getTime() - dateA.getTime();
      });

      const mappedMatches: Match[] = allMatchesData.slice(0, 50).map((m: any) => {
        if (m.homeTeam && m.awayTeam) return m;
        return {
          id: m.match_id,
          homeTeam: { id: m.match_hometeam_id, name: m.match_hometeam_name, shortName: m.match_hometeam_name.substring(0, 3).toUpperCase(), badge: m.team_home_badge || null },
          awayTeam: { id: m.match_awayteam_id, name: m.match_awayteam_name, shortName: m.match_awayteam_name.substring(0, 3).toUpperCase(), badge: m.team_away_badge || null },
          date: m.match_date,
          time: m.match_time,
          stadium: m.match_stadium || "Stadium",
          homeScore: Number(m.match_hometeam_score),
          awayScore: Number(m.match_awayteam_score),
          status: m.match_live === "1" ? 'live' : (m.match_status === "Finished" || new Date(m.match_date) < new Date(now.toISOString().split('T')[0]) ? 'finished' : 'upcoming'),
          minute: Number(m.match_status.replace("'", "")) || 0,
          rawGoals: m.goalscorer || [],
          statistics: m.statistics || [],
          lineup: m.lineup || null,
          homeSystem: m.match_hometeam_system || undefined,
          awaySystem: m.match_awayteam_system || undefined
        };
      });

      let live = mappedMatches.find(m => m.status === 'live') || null;
      if (!live && mappedMatches.length > 0) live = mappedMatches[0];
      
      if (live && live.id) {
         try {
            const [statsData, lineupsData] = await Promise.all([
               safeFetch(`action=get_statistics&match_id=${live.id}`),
               safeFetch(`action=get_lineups&match_id=${live.id}`)
            ]);
            if (statsData?.[live.id]) live.statistics = statsData[live.id].statistics;
            if (lineupsData?.[live.id]) live.lineup = lineupsData[live.id].lineup;
         } catch (e) {}
      }

      const liveOnes = mappedMatches.filter(m => m.status === 'live');
      let newMvp = { name: "Lamine Yamal", description: `Key Midfielder (Barcelona)`, team: "Barcelona", teamBadge: "https://apiv3.apifootball.com/badges/97_barcelona.jpg", age: 18, score: 94, image: "https://images.unsplash.com/photo-1623345805780-8f01f714e65f?q=80&w=300&auto=format&fit=crop" };

      try {
         const scorersData = await safeFetch(`action=get_topscorers&league_id=${LEAGUES[0].id}`);
         if (Array.isArray(scorersData) && scorersData.length > 0) {
            const top = scorersData[0];
            newMvp = {
               name: top.player_name, description: `Top Scorer (${top.goals} Goals)`, team: top.team_name,
               teamBadge: standingsMap[LEAGUES[0].name]?.find(t => t.name === top.team_name)?.badge || null,
               age: 24, score: 90 + Math.min(9, top.goals), image: "https://images.unsplash.com/photo-1543326132-8353dee5f577?q=80&w=300&auto=format&fit=crop"
            };
         }
      } catch (e) {}

      const cache = {
        liveMatch: live,
        allLiveMatches: liveOnes,
        upcomingMatches: mappedMatches.filter(m => m.id !== live?.id).slice(0, 5),
        allStandings: standingsMap,
        heroImage: live?.homeTeam?.badge || "https://images.unsplash.com/photo-1574629810360-1e5b8d009fc2?q=80&w=1200&auto=format&fit=crop",
        mvp: newMvp
      };

      globalSportsDataCache = cache;
      setLiveMatch(cache.liveMatch);
      setAllLiveMatches(cache.allLiveMatches);
      setUpcomingMatches(cache.upcomingMatches);
      setAllStandings(cache.allStandings);
      setHeroImage(cache.heroImage);
      setMvp(cache.mvp);
      setProgress(100);
    } catch (err) {
      console.error("Data Fetch Error:", err);
    } finally {
      if (mountedRef.current) {
        setTimeout(() => {
          setLoading(false);
          setRefreshing(false);
        }, 500);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchRealData();

    const interval = setInterval(() => {
      fetchRealData();
    }, 60000);

    return () => { 
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchRealData]);

  return {
    loading,
    standingsLoaded,
    liveMatchesLoading,
    refreshing,
    progress,
    liveMatch,
    allLiveMatches,
    upcomingMatches,
    allStandings,
    heroImage,
    mvp,
    refresh: fetchRealData
  };
}
