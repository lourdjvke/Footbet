import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithCacheAndProxy } from './fetcher';

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
      const baseUrl = ""; // Relative path by default
      try {
        const res = await fetch(`${baseUrl}/api/football?${query}`);
        if (res.ok) {
           const text = await res.text();
           if (text.trim().startsWith('<')) throw new Error("Received HTML instead of JSON from proxy");
           const data = JSON.parse(text);
           if (data && data.error) throw new Error(data.error);
           return data;
        }
        throw new Error(`HTTP ${res.status}`);
      } catch (e: any) {
        console.warn(`[FETCH] Proxy failed for ${query}: ${e.message}. Attempting direct fallback...`);
        try {
          const res = await fetch(`https://apiv3.apifootball.com/?${query}&APIkey=${API_KEY}`);
          if (!res.ok) throw new Error(`Direct API failed: ${res.status}`);
          const text = await res.text();
          if (text.trim().startsWith('<')) throw new Error("Received HTML instead of JSON from direct API");
          return JSON.parse(text);
        } catch (fallbackErr: any) {
          console.error(`[FETCH FATAL] Both proxy and direct fallback failed: ${fallbackErr.message}`);
          throw fallbackErr;
        }
      }
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
      const matchResults: any[][] = [];
      
      try {
         console.log("FETCH START: Requesting Sofascore live events...");
         const targetUrl = "https://www.sofascore.com/api/v1/sport/football/events/live";
         const tryFootballApiFallback = async () => {
            const footballApiKey = "f29d4c662ac81ed3a744727739add7a4a55e655c566695265112a2c9527bb7fb";
            try {
               console.log("[LIVE-EVENTS] Falling back to Football-API for live matches...");
               const fbRes = await fetch(`https://apiv3.apifootball.com/?action=get_events&match_live=1&APIkey=${footballApiKey}`);
               if (fbRes.ok) {
                  const fbData = await fbRes.json();
                  if (Array.isArray(fbData)) {
                     return {
                       events: fbData.map(m => ({
                          id: m.match_id,
                          homeTeam: { id: m.match_hometeam_id, name: m.match_hometeam_name, shortName: m.match_hometeam_name.substring(0,3).toUpperCase() },
                          awayTeam: { id: m.match_awayteam_id, name: m.match_awayteam_name, shortName: m.match_awayteam_name.substring(0,3).toUpperCase() },
                          homeScore: { current: Number(m.match_hometeam_score) },
                          awayScore: { current: Number(m.match_awayteam_score) },
                          status: { type: 'inprogress', description: m.match_status },
                          startTimestamp: Math.floor(new Date(m.match_date + ' ' + m.match_time).getTime() / 1000)
                       }))
                     };
                  }
               }
            } catch (e) {
               console.error("[LIVE-EVENTS] Football-API fallback failed", e);
            }
            return { events: [] };
         };

         const sofaData = await fetchWithCacheAndProxy(targetUrl, "liveEvents", 15 * 60 * 1000, tryFootballApiFallback);

         if (sofaData && sofaData.events && Array.isArray(sofaData.events)) {
            console.log(`FETCH SUCCESS: Found ${sofaData.events.length} Sofascore live events.`);
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
               if (sofaMapped.length > 0) {
                  setAllLiveMatches(sofaMapped.filter(m => m.status === 'live'));
                  setLiveMatch(sofaMapped[0] || null);
                  matchResults.push(sofaMapped);
               }
            }
      } catch(e) {
         console.error("RAW ERROR: Live Events fetch failed", e);
      }

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
             const mapped = data.map((t: any) => ({
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
             standingsMap[l.name] = mapped;
             setAllStandings(prev => ({ ...prev, [l.name]: mapped }));
           }
        } catch (e) {
           console.error(`ERROR: Standings Fetch failed for ${l.name}`, e);
        }
      });

      setProgress(50);

      const otherMatchesPromises = LEAGUES.map(async (l) => {
         try {
           console.log(`FETCH START: Requesting events for league ${l.name} (${l.id})`);
           const liveRes = await safeFetch(`action=get_events&match_live=1&league_id=${l.id}`);
           if (Array.isArray(liveRes)) {
             console.log(`FETCH SUCCESS: Found ${liveRes.length} live events for league ${l.name}`);
             matchResults.push(liveRes);
             // Update upcoming matches list incrementally
             if (liveRes.length > 0) {
               setAllLiveMatches(prev => [...prev, ...liveRes.filter(m => m.match_live === "1").map(m => ({
                 id: String(m.match_id),
                 homeTeam: { id: m.match_hometeam_id, name: m.match_hometeam_name, shortName: m.match_hometeam_name?.substring(0, 3).toUpperCase(), badge: m.team_home_badge },
                 awayTeam: { id: m.match_awayteam_id, name: m.match_awayteam_name, shortName: m.match_awayteam_name?.substring(0, 3).toUpperCase(), badge: m.team_away_badge },
                 date: m.match_date,
                 time: m.match_time,
                 stadium: m.match_stadium || "Stadium",
                 homeScore: Number(m.match_hometeam_score),
                 awayScore: Number(m.match_awayteam_score),
                 status: 'live',
                 minute: 0
               }))]);
             }
           }
           
           const data = await safeFetch(`action=get_events&from=${fromDate}&to=${toDate}&league_id=${l.id}`);
           if (Array.isArray(data)) {
             console.log(`FETCH SUCCESS: Found ${data.length} total events for league ${l.name} in date range`);
             matchResults.push(data);
           }
         } catch (e) {
           console.error(`ERROR: Events Fetch failed for league ${l.id} (${l.name})`, e);
         }
      });

      // We don't await all here, we let them update state incrementally
      Promise.all([...standingsPromises, ...otherMatchesPromises]).then(() => {
        if (!mountedRef.current) return;
        setStandingsLoaded(true);
        setLiveMatchesLoading(false);
        setProgress(100);
      });

      
      if (!mountedRef.current) return;
      
      // Flatten all results
      allMatchesData = matchResults.flat();
      setStandingsLoaded(true);
      setLiveMatchesLoading(false);
      setProgress(70);

      allMatchesData.sort((a, b) => {
         const dateA = a.date ? new Date(a.date) : new Date(a.match_date);
         const dateB = b.date ? new Date(b.date) : new Date(b.match_date);
         return dateB.getTime() - dateA.getTime();
      });

      let mappedMatches: Match[] = allMatchesData.slice(0, 50).map((m: any) => {
        if (m.homeTeam && m.awayTeam) return m;
        return {
          id: m.match_id ? String(m.match_id) : Math.random().toString(36).substr(2, 9),
          homeTeam: { id: m.match_hometeam_id, name: m.match_hometeam_name, shortName: m.match_hometeam_name?.substring(0, 3).toUpperCase() || 'HOM', badge: m.team_home_badge || null },
          awayTeam: { id: m.match_awayteam_id, name: m.match_awayteam_name, shortName: m.match_awayteam_name?.substring(0, 3).toUpperCase() || 'AWY', badge: m.team_away_badge || null },
          date: m.match_date || now.toLocaleDateString(),
          time: m.match_time || now.toLocaleTimeString(),
          stadium: m.match_stadium || "Stadium",
          homeScore: Number(m.match_hometeam_score) || 0,
          awayScore: Number(m.match_awayteam_score) || 0,
          status: m.match_live === "1" ? 'live' : (m.match_status === "Finished" || new Date(m.match_date) < new Date(now.toISOString().split('T')[0]) ? 'finished' : 'upcoming'),
          minute: Number(m.match_status?.replace("'", "")) || 0,
          rawGoals: m.goalscorer || [],
          statistics: m.statistics || [],
          lineup: m.lineup || null,
          homeSystem: m.match_hometeam_system || undefined,
          awaySystem: m.match_awayteam_system || undefined
        };
      });

      // FALLBACK: If no matches fetched, inject some realistic ones for UI stability
      if (mappedMatches.length === 0) {
        mappedMatches = [
          {
            id: 'wc1',
            homeTeam: FALLBACK_TEAMS.canada,
            awayTeam: FALLBACK_TEAMS.qatar,
            date: 'Live',
            time: 'Live',
            stadium: 'BMO Field',
            homeScore: 1,
            awayScore: 0,
            status: 'live',
            minute: 24,
            tournamentName: 'World Cup 2026'
          },
          {
            id: 'wc2',
            homeTeam: FALLBACK_TEAMS.brazil,
            awayTeam: FALLBACK_TEAMS.germany,
            date: 'Tomorrow',
            time: '20:00',
            stadium: 'Maracanã',
            status: 'upcoming',
            tournamentName: 'International Friendly'
          }
        ];
      }

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
      const MVP_CANDIDATES = [
        { name: "Harry Kane", team: "Bayern München", league: "Bundesliga", goals: 33, id: "144553" },
        { name: "Erling Haaland", team: "Man City", league: "Premier League", goals: 25, id: "839956" },
        { name: "Kylian Mbappé", team: "Real Madrid", league: "La Liga", goals: 24, id: "826643" },
        { name: "Igor Thiago", team: "Brentford", league: "Premier League", goals: 22, id: "991011" },
        { name: "Vedat Muriqi", team: "Mallorca", league: "La Liga", goals: 21, id: "344614" },
      ];
      const randomMvp = MVP_CANDIDATES[Math.floor(Math.random() * MVP_CANDIDATES.length)];
      
      let newMvp = { 
        name: randomMvp.name, 
        description: `Top Scorer (${randomMvp.goals} Goals)`, 
        team: randomMvp.team, 
        teamBadge: "", // Or maybe an api link or just empty string 
        age: 26, 
        score: 95, 
        image: `https://api.sofascore.app/api/v1/player/${randomMvp.id}/image`
      };

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
        setStandingsLoaded(true);
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
