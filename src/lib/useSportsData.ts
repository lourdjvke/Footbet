import { useState, useEffect } from 'react';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  badge: string | null;
  fanart?: string;
  stadium?: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  stadium: string;
  homeScore?: number;
  awayScore?: number;
  status: 'upcoming' | 'live' | 'finished';
  minute?: number;
  statistics?: any[];
  lineup?: any;
  rawGoals?: any[];
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
  const [progress, setProgress] = useState(globalSportsDataCache ? 100 : 0);

  const [liveMatch, setLiveMatch] = useState<Match>(globalSportsDataCache?.liveMatch || {
    id: '1',
    homeTeam: FALLBACK_TEAMS.canada,
    awayTeam: FALLBACK_TEAMS.qatar,
    date: 'Today',
    time: 'Live',
    stadium: 'Allianz Arena',
    homeScore: 0,
    awayScore: 0,
    status: 'live',
    minute: 0
  });

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

  useEffect(() => {
    let mounted = true;

    if (globalSportsDataCache && !globalFetchPromise) {
      return;
    }

    const fetchRealData = async () => {
      try {
        setLoading(true);
        setProgress(5);

        const LEAGUES = [
          { id: '152', name: 'Premier League' },
          { id: '175', name: 'Bundesliga' },
          { id: '235', name: 'Eredivisie' },
          { id: '3',   name: 'Champions League' }
        ];

        const standingsMap: Record<string, StandingTeam[]> = {};
        
        // Use dynamic dates for events
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const fromDate = tomorrow.toISOString().split('T')[0];
        
        const nextMonth = new Date(now);
        nextMonth.setMonth(now.getMonth() + 1);
        const toDate = nextMonth.toISOString().split('T')[0];
        
        // Fetch standings for all leagues
        for (let i = 0; i < LEAGUES.length; i++) {
          const l = LEAGUES[i];
          try {
             const res = await fetch(`/api/football?action=get_standings&league_id=${l.id}`);
             const data = await res.json();
             
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
                  probability: Math.round(50 + (Math.random() * 40)) // Round probability to avoid long decimals
               }));
             }
          } catch (e) {
            console.warn(`Failed to fetch standings for ${l.name}`);
          }
          setProgress(10 + ((i + 1) / LEAGUES.length) * 40);
        }

        // Fetch matches (upcoming events for next month)
        let allMatchesData: any[] = [];
        for (const l of LEAGUES) {
          const res = await fetch(`/api/football?action=get_events&from=${fromDate}&to=${toDate}&league_id=${l.id}`);
          const data = await res.json();
          if (Array.isArray(data)) {
            allMatchesData = [...allMatchesData, ...data];
          }
          if (allMatchesData.length > 20) break;
        }

        if (!mounted) return;

        // Sort by date to get recent/live matches
        allMatchesData.sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

        const mappedMatches: Match[] = allMatchesData.slice(0, 10).map((m: any) => ({
          id: m.match_id,
          homeTeam: {
            id: m.match_hometeam_id,
            name: m.match_hometeam_name,
            shortName: m.match_hometeam_name.substring(0, 3).toUpperCase(),
            badge: m.team_home_badge || null
          },
          awayTeam: {
            id: m.match_awayteam_id,
            name: m.match_awayteam_name,
            shortName: m.match_awayteam_name.substring(0, 3).toUpperCase(),
            badge: m.team_away_badge || null
          },
          date: m.match_date,
          time: m.match_time,
          stadium: m.match_stadium || "Stadium",
          homeScore: Number(m.match_hometeam_score),
          awayScore: Number(m.match_awayteam_score),
          status: m.match_live === "1" ? 'live' : (m.match_status === "Finished" || new Date(m.match_date) < new Date(now.toISOString().split('T')[0]) ? 'finished' : 'upcoming'),
          minute: Number(m.match_status.replace("'", "")) || 0,
          rawGoals: m.goalscorer || []
        }));

        let live = mappedMatches.find(m => m.status === 'live') || mappedMatches[0];
        
        // Fetch detailed stats and lineups for the picked "main/live" match
        if (live && live.id) {
           try {
              const [resStats, resLineups] = await Promise.all([
                 fetch(`/api/football?action=get_statistics&match_id=${live.id}`),
                 fetch(`/api/football?action=get_lineups&match_id=${live.id}`)
              ]);
              const statsData = await resStats.json();
              const lineupsData = await resLineups.json();
              
              if (statsData && statsData[live.id]) {
                 live.statistics = statsData[live.id].statistics;
              }
              if (lineupsData && lineupsData[live.id]) {
                 live.lineup = lineupsData[live.id].lineup;
              }
           } catch (e) {
              console.warn("Match details fetch failed", e);
           }
        }

        const upcoming = mappedMatches.filter(m => m.id !== live?.id).slice(0, 5);

        // Map MVP from top scorers
        let newMvp = {
          name: "Lamine Yamal",
          description: `Key Midfielder (Barcelona)`,
          team: "Barcelona",
          teamBadge: "https://apiv3.apifootball.com/badges/97_barcelona.jpg",
          age: 18,
          score: 94,
          image: "https://images.unsplash.com/photo-1623345805780-8f01f714e65f?q=80&w=300&auto=format&fit=crop"
        };

        try {
           const resScorers = await fetch(`/api/football?action=get_topscorers&league_id=${LEAGUES[0].id}`);
           const scorersData = await resScorers.json();
           if (Array.isArray(scorersData) && scorersData.length > 0) {
              const top = scorersData[0];
              newMvp = {
                 name: top.player_name,
                 description: `Top Scorer (${top.goals} Goals)`,
                 team: top.team_name,
                 teamBadge: standingsMap[LEAGUES[0].name]?.find(t => t.name === top.team_name)?.badge || null,
                 age: 24, // Age not in this endpoint
                 score: 90 + Math.min(9, top.goals),
                 image: "https://images.unsplash.com/photo-1543326132-8353dee5f577?q=80&w=300&auto=format&fit=crop"
              };
           }
        } catch (e) {
           console.warn("MVP fetch failed", e);
        }

        const cache = {
          liveMatch: live || mappedMatches[0],
          upcomingMatches: upcoming,
          allStandings: standingsMap,
          heroImage: live?.homeTeam?.badge || "https://images.unsplash.com/photo-1574629810360-1e5b8d009fc2?q=80&w=1200&auto=format&fit=crop",
          mvp: newMvp
        };

        globalSportsDataCache = cache;
        setLiveMatch(cache.liveMatch);
        setUpcomingMatches(cache.upcomingMatches);
        setAllStandings(cache.allStandings);
        setHeroImage(cache.heroImage);
        setMvp(cache.mvp);

        setProgress(100);
      } catch (err) {
        console.error("Data Fetch Error:", err);
      } finally {
        if (mounted) {
          setTimeout(() => setLoading(false), 500);
        }
      }
    };

    fetchRealData();
    return () => { mounted = false; };
  }, []);

  return {
    loading,
    progress,
    liveMatch,
    upcomingMatches,
    allStandings,
    heroImage,
    mvp
  };
}
