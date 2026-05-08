import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../lib/firebase';
import { Match, StandingTeam, mapSofaMatch, Team } from './sportsDataHelper';
import { fetchWithCacheAndProxy } from '../lib/fetcher';

interface SportsDataContextType {
  loading: boolean;
  standingsLoaded: boolean;
  liveMatchesLoading: boolean;
  refreshing: boolean;
  progress: number;
  liveMatch: Match | null;
  allLiveMatches: Match[];
  upcomingMatches: Match[];
  allStandings: Record<string, StandingTeam[]>;
  heroImage: string;
  mvp: any;
  refresh: () => Promise<void>;
}

const SportsDataContext = createContext<SportsDataContextType | undefined>(undefined);

const FALLBACK_TEAMS: Record<string, Team> = {
  canada: { id: 'can', name: 'Canada', shortName: 'CAN', badge: 'https://flagcdn.com/w160/ca.png' },
  qatar: { id: 'qat', name: 'Qatar', shortName: 'QAT', badge: 'https://flagcdn.com/w160/qa.png' },
};

export function SportsDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [standingsLoaded, setStandingsLoaded] = useState(false);
  const [liveMatchesLoading, setLiveMatchesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [liveMatch, setLiveMatch] = useState<Match | null>(null);
  const [allLiveMatches, setAllLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [allStandings, setAllStandings] = useState<Record<string, StandingTeam[]>>({});
  const [heroImage, setHeroImage] = useState("https://images.unsplash.com/photo-1574629810360-1e5b8d009fc2?q=80&w=1200&auto=format&fit=crop");
  const [mvp, setMvp] = useState({
     name: "Harry Kane",
     description: "Top Scorer",
     team: "FC Bayern München",
     teamBadge: "https://upload.wikimedia.org/wikipedia/commons/1/1f/Logo_FC_Bayern_M%C3%BCnchen_%282002%E2%80%932017%29.svg",
     age: 31,
     score: 95,
     image: "https://images.unsplash.com/photo-1551280857-2b9bae120c51?q=80&w=300&auto=format&fit=crop"
  });

  const mountedRef = useRef(true);
  const lastStateHashRef = useRef<string>("");

  const fetchRealData = useCallback(async () => {
    const API_KEY = "f29d4c662ac81ed3a744727739add7a4a55e655c566695265112a2c9527bb7fb";

    const safeFetch = async (query: string) => {
      const baseUrl = ""; 
      try {
        const res = await fetch(`${baseUrl}/api/football?${query}`);
        if (res.ok) {
           const text = await res.text();
           const data = JSON.parse(text);
           return data;
        }
        throw new Error(`HTTP ${res.status}`);
      } catch (e: any) {
        try {
          const res = await fetch(`https://apiv3.apifootball.com/?${query}&APIkey=${API_KEY}`);
          return await res.json();
        } catch (fallbackErr: any) {
          throw fallbackErr;
        }
      }
    };

    try {
      setRefreshing(true);
      setLiveMatchesLoading(true);

      let matchResults: any[][] = [];
      
      try {
         const targetUrl = "https://www.sofascore.com/api/v1/sport/football/events/live";
         const tryFootballApiFallback = async () => {
            try {
               const fbRes = await fetch(`https://apiv3.apifootball.com/?action=get_events&match_live=1&APIkey=${API_KEY}`);
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
               console.error("Football-API fallback failed", e);
            }
            return { events: [] };
         };

         const sofaData = await fetchWithCacheAndProxy(targetUrl, "liveEvents", 15 * 60 * 1000, tryFootballApiFallback);

         if (sofaData && sofaData.events && Array.isArray(sofaData.events)) {
            const sofaMapped: Match[] = sofaData.events.map(mapSofaMatch);
            if (sofaMapped.length > 0) {
               matchResults.push(sofaMapped);
            }
         }
      } catch(e) {
         console.error("Live Events fetch failed", e);
      }

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
           }
        } catch (e) {}
      });

      const otherMatchesPromises = LEAGUES.map(async (l) => {
         try {
           const liveRes = await safeFetch(`action=get_events&match_live=1&league_id=${l.id}`);
           if (Array.isArray(liveRes)) {
             const mappedLive = liveRes.map(m => ({
               id: String(m.match_id),
               homeTeam: { id: m.match_hometeam_id, name: m.match_hometeam_name, shortName: m.match_hometeam_name?.substring(0, 3).toUpperCase(), badge: m.team_home_badge },
               awayTeam: { id: m.match_awayteam_id, name: m.match_awayteam_name, shortName: m.match_awayteam_name?.substring(0, 3).toUpperCase(), badge: m.team_away_badge },
               date: m.match_date,
               time: m.match_time,
               stadium: m.match_stadium || "Stadium",
               homeScore: Number(m.match_hometeam_score),
               awayScore: Number(m.match_awayteam_score),
               status: 'live' as const,
               minute: 0
             }));
             matchResults.push(mappedLive);
           }
           
           const data = await safeFetch(`action=get_events&from=${fromDate}&to=${toDate}&league_id=${l.id}`);
           if (Array.isArray(data)) {
             matchResults.push(data);
           }
         } catch (e) {}
      });

      await Promise.all([...standingsPromises, ...otherMatchesPromises]);
      
      if (!mountedRef.current) return;
      
      const allMatchesData = matchResults.flat();
      allMatchesData.sort((a, b) => {
         const dateA = a.date ? new Date(a.date) : new Date(a.match_date);
         const dateB = b.date ? new Date(b.date) : new Date(b.match_date);
         return dateB.getTime() - dateA.getTime();
      });

      let mappedMatches: Match[] = allMatchesData.slice(0, 50).map((m: any) => {
        if (m.homeTeam && m.awayTeam && typeof m.homeTeam === 'object' && m.homeTeam.name) {
           return mapSofaMatch(m);
        }
        // STRICTLY extract the 'id' field DIRECTLY under the event object (root level)
        const eventRootId = m.id || m.match_id || m.matchId;
        const matchId = eventRootId ? String(eventRootId) : Math.random().toString(36).substr(2, 9);
        return {
          id: matchId,
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

      if (mappedMatches.length === 0) {
        mappedMatches = [{ id: 'wc1', homeTeam: FALLBACK_TEAMS.canada, awayTeam: FALLBACK_TEAMS.qatar, date: 'Live', time: 'Live', stadium: 'BMO Field', homeScore: 1, awayScore: 0, status: 'live', minute: 24, tournamentName: 'World Cup 2026' }];
      }

      const liveOnes = mappedMatches.filter(m => m.status === 'live');
      let live = liveOnes[0] || mappedMatches[0];
      
      const cache = {
        liveMatch: live,
        allLiveMatches: liveOnes,
        upcomingMatches: mappedMatches.filter(m => m.id !== live?.id).slice(0, 5),
        allStandings: standingsMap,
        heroImage: live?.homeTeam?.badge || "https://images.unsplash.com/photo-1574629810360-1e5b8d009fc2?q=80&w=1200&auto=format&fit=crop",
        mvp: { name: "Erling Haaland", description: "Top Player", team: "Man City", image: "https://api.sofascore.app/api/v1/player/839956/image" }
      };

      const hash = JSON.stringify(cache);
      if (hash !== lastStateHashRef.current) {
        lastStateHashRef.current = hash;
        setLiveMatch(cache.liveMatch);
        setAllLiveMatches(cache.allLiveMatches);
        setUpcomingMatches(cache.upcomingMatches);
        setAllStandings(cache.allStandings);
        setHeroImage(cache.heroImage);
        setMvp(cache.mvp);
      }
      
    } catch (err) {
      console.error("Data Fetch Error:", err);
    } finally {
      if (mountedRef.current) {
        setStandingsLoaded(true);
        setLoading(false);
        setRefreshing(false);
        setLiveMatchesLoading(false);
        setProgress(100);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    let unsubscribe: (() => void) | null = null;
    
    if (rtdb) {
      console.log("[FIREBASE] Setting up RTDB listener for 'liveEvents'...");
      const dbRef = ref(rtdb, "liveEvents");
      unsubscribe = onValue(dbRef, (snapshot) => {
        if (mountedRef.current) {
          if (snapshot.exists()) {
            const val = snapshot.val();
            console.log("[FIREBASE] RTDB update received for 'liveEvents'. Timestamp:", val.timestamp);
            const data = val.payload;
            
            if (data?.events && Array.isArray(data.events)) {
              console.log(`[FIREBASE] Received ${data.events.length} events from RTDB.`);
              const sofaMapped: Match[] = data.events.map(mapSofaMatch).filter(m => m.status === 'live');
              console.log(`[FIREBASE] Filtered ${sofaMapped.length} LIVE matches from RTDB.`);
              
              if (sofaMapped.length > 0) {
                setAllLiveMatches(prev => {
                   const nonSofa = prev.filter(m => !m.isSofascore);
                   const combined = [...sofaMapped, ...nonSofa];
                   const hasChanged = JSON.stringify(prev) !== JSON.stringify(combined);
                   if (hasChanged) console.log("[FIREBASE] Updating allLiveMatches from RTDB.");
                   return hasChanged ? combined : prev;
                });
                
                setLiveMatch(prev => {
                   const liveSofa = sofaMapped[0];
                   const hasChanged = JSON.stringify(prev) !== JSON.stringify(liveSofa);
                   if (hasChanged) console.log("[FIREBASE] Updating liveMatch from RTDB.");
                   return hasChanged ? liveSofa : prev;
                });
              }
            } else {
              console.log("[FIREBASE] RTDB 'liveEvents' payload contains no events array.");
            }
          } else {
            console.warn("[FIREBASE] Path 'liveEvents' is empty in RTDB.");
          }
        }
      }, (error) => {
        console.error("[FIREBASE] RTDB Listener Error:", error);
      });
    } else {
      console.warn("[FIREBASE] RTDB not initialized, skipping listener.");
    }

    fetchRealData();
    const interval = setInterval(fetchRealData, 60000);

    return () => { 
      mountedRef.current = false;
      if (unsubscribe) unsubscribe();
      clearInterval(interval);
    };
  }, [fetchRealData]);

  return (
    <SportsDataContext.Provider value={{
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
    }}>
      {children}
    </SportsDataContext.Provider>
  );
}

export function useSportsData() {
  const context = useContext(SportsDataContext);
  if (context === undefined) {
    throw new Error('useSportsData must be used within a SportsDataProvider');
  }
  return context;
}
