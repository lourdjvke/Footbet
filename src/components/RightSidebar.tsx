import { useState, useEffect } from "react";
import { useSportsData } from "../lib/useSportsData";
import { Maximize2, ChevronLeft, ChevronRight, RefreshCw, Copy, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

import { fetchWithCacheAndProxy } from "../lib/fetcher";

export function RightSidebar() {
  const { allLiveMatches, allStandings, refreshing, liveMatchesLoading, refresh, loading } = useSportsData();
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("Lineup");
  const [activeGroup, setActiveGroup] = useState("Premier League");
  const [lineup, setLineup] = useState<any>(null);
  const [loadingLineup, setLoadingLineup] = useState(false);
  const [lineupError, setLineupError] = useState<string | null>(null);
  
  const [statistics, setStatistics] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [odds, setOdds] = useState<any>(null);
  const [loadingOdds, setLoadingOdds] = useState(false);
  
  const [copied, setCopied] = useState(false);

  // Derive liveMatch from index but guard against empty list
  const liveMatch = allLiveMatches.length > 0 ? (allLiveMatches[currentMatchIndex] || allLiveMatches[0]) : null;

  // Emergency ID fixer: if the current match is Sofascore but ID is suspiciously short
  // we try to find a match with the same team names in the full list that has a proper ID
  useEffect(() => {
    if (liveMatch && liveMatch.isSofascore && liveMatch.id.length < 5) {
       console.warn(`[DATA] Short ID for match: ${liveMatch.homeTeam.name} vs ${liveMatch.awayTeam.name}`);
    }
  }, [liveMatch?.id]);

  const copyId = () => {
    if (liveMatch?.id) {
       navigator.clipboard.writeText(liveMatch.id);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    // Reset index if matches decrease
    if (currentMatchIndex >= allLiveMatches.length && allLiveMatches.length > 0) {
      setCurrentMatchIndex(0);
    }
  }, [allLiveMatches.length, currentMatchIndex]);

  useEffect(() => {
    if (activeTab === "Lineup" && liveMatch?.id && liveMatch.isSofascore) {
       // Validate ID: Sofascore IDs are typically long numbers
       const numericId = parseInt(liveMatch.id);
       if (isNaN(numericId) || liveMatch.id.length < 5) {
          setLineupError("Invalid Match ID for Lineup");
          setLoadingLineup(false);
          return;
       }
       setLineup(null);
       setLineupError(null);
       setLoadingLineup(true);
       const targetUrl = `https://www.sofascore.com/api/v1/event/${liveMatch.id}/lineups`;
       const cachePath = `lineups/${liveMatch.id}`;
       let isSubscribed = true;
       import("firebase/database").then(({ ref, onValue }) => {
         import("../lib/firebase").then(({ rtdb }) => {
           if (!rtdb || !isSubscribed) return;
           const unsubscribe = onValue(ref(rtdb, cachePath), (snapshot) => {
             if (snapshot.exists()) {
                const data = snapshot.val().payload;
                if (data && !data.error) setLineup(data);
                else if (data?.error) setLineupError(String(data.error));
                setLoadingLineup(false);
             }
           });
           fetchWithCacheAndProxy(targetUrl, cachePath, 30 * 60 * 1000).then(data => {
             if (!isSubscribed) return;
             if (!data) setLineup({});
             else if (data.error) setLineupError(String(data.error));
             else setLineup(data);
             setLoadingLineup(false);
           }).catch(e => {
             if (!isSubscribed) return;
             if (!lineup) setLineupError(e.message);
             setLoadingLineup(false);
           });
           return () => { isSubscribed = false; unsubscribe(); };
         });
       });
    }
  }, [activeTab, liveMatch?.id]);

  useEffect(() => {
    if (activeTab === "Statistics" && liveMatch?.id && liveMatch.isSofascore) {
       if (liveMatch.id.length < 8) return;
       setStatistics(null);
       setLoadingStats(true);
       const targetUrl = `https://www.sofascore.com/api/v1/event/${liveMatch.id}/statistics`;
       const cachePath = `statistics/${liveMatch.id}`;
       let isSubscribed = true;
       import("firebase/database").then(({ ref, onValue }) => {
         import("../lib/firebase").then(({ rtdb }) => {
           if (!rtdb || !isSubscribed) return;
           const unsubscribe = onValue(ref(rtdb, cachePath), (snapshot) => {
             if (snapshot.exists()) {
                const data = snapshot.val().payload;
                if (data && data.statistics) setStatistics(data.statistics);
                setLoadingStats(false);
             }
           });
           fetchWithCacheAndProxy(targetUrl, cachePath, 30 * 60 * 1000).then(data => {
             if (!isSubscribed) return;
             if (data && data.statistics) setStatistics(data.statistics);
             setLoadingStats(false);
           }).catch(() => {
             if (!isSubscribed) return;
             setLoadingStats(false);
           });
           return () => { isSubscribed = false; unsubscribe(); };
         });
       });
    }
  }, [activeTab, liveMatch?.id]);

  useEffect(() => {
    if (activeTab === "Insights" && liveMatch?.id && liveMatch.isSofascore) {
       if (liveMatch.id.length < 8) return;
       setOdds(null);
       setLoadingOdds(true);
       // Sofascore standard odds url
       const targetUrl = `https://www.sofascore.com/api/v1/event/${liveMatch.id}/odds/1/all`;
       const cachePath = `odds/${liveMatch.id}`;
       let isSubscribed = true;
       import("firebase/database").then(({ ref, onValue }) => {
         import("../lib/firebase").then(({ rtdb }) => {
           if (!rtdb || !isSubscribed) return;
           const unsubscribe = onValue(ref(rtdb, cachePath), (snapshot) => {
             if (snapshot.exists()) {
                const data = snapshot.val().payload;
                if (data && data.markets) setOdds(data.markets);
                setLoadingOdds(false);
             }
           });
           fetchWithCacheAndProxy(targetUrl, cachePath, 30 * 60 * 1000).then(data => {
             if (!isSubscribed) return;
             if (data && data.markets) setOdds(data.markets);
             setLoadingOdds(false);
           }).catch(() => {
             if (!isSubscribed) return;
             setLoadingOdds(false);
           });
           return () => { isSubscribed = false; unsubscribe(); };
         });
       });
    }
  }, [activeTab, liveMatch?.id]);

  if (!liveMatch) {
    return (
      <div className="flex flex-col gap-6 w-full lg:w-[320px] xl:w-[360px] shrink-0">
        <div className="glass-card p-5 group min-h-[200px] flex flex-col items-center justify-center relative overflow-hidden">
          <h2 className="text-lg font-medium absolute top-5 left-5">Live Matches</h2>
          
          {liveMatchesLoading ? (
             <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="text-sm text-text-muted">Fetching live matches...</span>
             </div>
          ) : (
             <div className="flex flex-col items-center gap-4">
                <div className="text-center text-text-muted italic text-sm">No live matches available</div>
                <button 
                   onClick={() => refresh?.()}
                   className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors"
                >
                   REFRESH <RefreshCw className="w-3.5 h-3.5" />
                </button>
             </div>
          )}
        </div>
      </div>
    );
  }

  const nextMatch = () => {
    setCurrentMatchIndex((prev) => (prev + 1) % allLiveMatches.length);
  };

  const prevMatch = () => {
    setCurrentMatchIndex((prev) => (prev - 1 + allLiveMatches.length) % allLiveMatches.length);
  };

  const standings = allStandings && allStandings[activeGroup] ? allStandings[activeGroup] : (allStandings ? Object.values(allStandings)[0] || [] : []);

  return (
    <div className="flex flex-col gap-6 w-full lg:w-[320px] xl:w-[360px] shrink-0">
      
      {/* Live Matches */}
      <div className="glass-card p-5 relative overflow-hidden group">
         <button 
            onClick={copyId}
            className="absolute top-4 right-4 py-1.5 px-2.5 rounded-lg bg-black/40 border border-white/5 z-20 group/copy active:scale-95 transition-all"
         >
            <div className="flex items-center gap-1.5">
               <span className="text-[9px] font-bold text-white/40 group-hover/copy:text-white/70 transition-colors uppercase tracking-tight">
                  {copied ? "Copied" : `MTH ID: ${liveMatch.id}`}
               </span>
               {copied ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-white/20 group-hover/copy:text-white/50" />}
            </div>
         </button>

         <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-medium">Live Matches</h2>
            {refreshing && (
               <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 mr-16">
                  <RefreshCw className="w-3 h-3 text-white/40 animate-spin" />
               </div>
            )}
         </div>
         <p className="text-sm border-white/20 pb-4 mb-4 font-medium flex flex-col items-center justify-center text-white/80 border-b border-dashed">
            <span>First Stage <span className="text-white/40 mx-2">•</span> {activeGroup}</span>
            <span className="text-xs text-text-muted mt-1 font-normal">{liveMatch.stadium}</span>
         </p>

         {/* Match Score */}
         <div className="flex items-center justify-between px-2 mb-6 relative">
            {allLiveMatches.length > 1 && (
               <>
                 <button 
                   onClick={prevMatch}
                   className="absolute left-0 lg:-left-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 p-2 rounded-full text-white hover:text-blue-400 transition-all border border-white/10"
                 >
                   <ChevronLeft className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={nextMatch}
                   className="absolute right-0 lg:-right-2 top-1/2 -translate-y-1/2 z-20 bg-black/60 hover:bg-black/80 p-2 rounded-full text-white hover:text-blue-400 transition-all border border-white/10"
                 >
                   <ChevronRight className="w-4 h-4" />
                 </button>
               </>
            )}
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={liveMatch.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between w-full"
              >
                <div className="flex flex-col items-center gap-2 relative w-20">
                   <div 
                     className="w-16 h-16 rounded-full overflow-hidden border border-white/20 flex items-center justify-center p-0.5"
                     style={{ backgroundColor: liveMatch.homeTeam?.teamColors?.primary || 'rgba(255,255,255,0.05)' }}
                   >
                     {liveMatch.homeTeam?.country?.alpha2 ? (
                       <img 
                         src={`https://flagcdn.com/${liveMatch.homeTeam.country.alpha2.toLowerCase()}.svg`} 
                         alt={liveMatch.homeTeam?.name} 
                         className="w-full h-full object-cover scale-110" 
                         referrerPolicy="no-referrer"
                       />
                     ) : (
                       <img src={liveMatch.homeTeam?.badge} alt={liveMatch.homeTeam?.name} className="w-12 h-12 object-contain rounded-sm" referrerPolicy="no-referrer" />
                     )}
                   </div>
                   <span className="text-sm font-semibold text-center truncate w-full">{liveMatch.homeTeam?.shortName}</span>
                </div>

                <div className="flex flex-col items-center justify-center -mt-6">
                   <div className="text-3xl font-bold tracking-widest text-white">
                     {liveMatch.homeScore} - {liveMatch.awayScore}
                   </div>
                   <div className="px-3 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] uppercase font-bold mt-1.5 border border-green-500/20 tracking-wider">
                      {liveMatch.statusDescription || (liveMatch.minute ? `${liveMatch.minute}'` : 'Live')}
                   </div>
                </div>

                <div className="flex flex-col items-center gap-2 relative w-20">
                   <div 
                     className="w-16 h-16 rounded-full overflow-hidden border border-white/20 flex items-center justify-center p-0.5"
                     style={{ backgroundColor: liveMatch.awayTeam?.teamColors?.primary || 'rgba(255,255,255,0.05)' }}
                   >
                     {liveMatch.awayTeam?.country?.alpha2 ? (
                       <img 
                         src={`https://flagcdn.com/${liveMatch.awayTeam.country.alpha2.toLowerCase()}.svg`} 
                         alt={liveMatch.awayTeam?.name} 
                         className="w-full h-full object-cover scale-110" 
                         referrerPolicy="no-referrer"
                       />
                     ) : (
                       <img src={liveMatch.awayTeam?.badge} alt={liveMatch.awayTeam?.name} className="w-12 h-12 object-contain rounded-sm" referrerPolicy="no-referrer" />
                     )}
                   </div>
                   <span className="text-sm font-semibold text-center truncate w-full">{liveMatch.awayTeam?.shortName}</span>
                </div>
              </motion.div>
            </AnimatePresence>
         </div>

         {/* Dynamic Tabs Content */}
         <div className="min-h-[100px] flex items-center justify-center mb-6 px-1">
            {activeTab === "Timeline" && (
                <div className="flex flex-col gap-3 w-full text-xs max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                   {liveMatch.rawGoals && liveMatch.rawGoals.length > 0 ? (
                     liveMatch.rawGoals.map((goal: any, i: number) => {
                        const isHome = goal.scoreTeam1 > (liveMatch.rawGoals[i-1]?.scoreTeam1 || 0);
                        return (
                          <div key={goal.goalID} className={cn("flex items-center gap-2", isHome ? "flex-row" : "flex-row-reverse")}>
                             <div className={cn("px-2 py-0.5 rounded bg-white/5 border border-white/10", isHome ? "text-blue-400" : "text-orange-400")}>
                                {goal.matchMinute}'
                             </div>
                             <div className="flex flex-col flex-1">
                                <div className={cn("font-medium", isHome ? "text-left" : "text-right")}>{goal.goalGetterName}</div>
                                <div className={cn("text-[10px] text-text-muted", isHome ? "text-left" : "text-right")}>
                                   {goal.scoreTeam1} - {goal.scoreTeam2}
                                </div>
                             </div>
                             <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          </div>
                        )
                     })
                   ) : (
                     <div className="text-text-muted italic">No major events yet</div>
                   )}
                </div>
            )}
            {activeTab === "Lineup" && (
                <div className="flex flex-col gap-4 w-full">
                   <div className="flex justify-between items-center text-xs px-2">
                      <div className="flex flex-col items-start gap-1">
                         <span className="text-[10px] text-text-muted uppercase">System</span>
                         <span className="font-bold text-blue-400">{liveMatch.homeSystem || "4-3-3"}</span>
                      </div>
                      <div className="w-[1px] h-6 bg-white/10" />
                      <div className="flex flex-col items-end gap-1">
                         <span className="text-[10px] text-text-muted uppercase">System</span>
                         <span className="font-bold text-orange-400">{liveMatch.awaySystem || "4-2-3-1"}</span>
                      </div>
                   </div>
                   <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                      {loadingLineup ? (
                         <div className="text-center text-text-muted py-4 flex flex-col items-center gap-2">
                           <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                           <span>Loading Lineups...</span>
                         </div>
                      ) : lineupError ? (
                          <div className="text-center py-8">
                             <div className="text-text-muted text-xs italic">Lineup not available for match</div>
                          </div>
                      ) : lineup && lineup.home && lineup.home.players ? (
                         lineup.home.players.slice(0, 5).map((p: any, idx: number) => (
                            <div key={p.player.id} className="flex items-center justify-between text-[11px]">
                               <div className="flex items-center gap-2">
                                  <span className="text-blue-400 font-mono w-4">{p.shirtNumber}</span>
                                  <span className="text-white/80">{p.player.shortName}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <span className="text-white/80">{lineup.away?.players?.[idx]?.player?.shortName || '-'}</span>
                                  <span className="text-orange-400 font-mono w-4 text-right">{lineup.away?.players?.[idx]?.shirtNumber || '-'}</span>
                               </div>
                            </div>
                         ))
                      ) : lineup ? (
                         <div className="text-center py-4">
                            <div className="text-orange-400 text-[10px] mb-1 font-bold uppercase">Unexpected Data Format</div>
                            <pre className="text-[8px] text-white/30 text-left overflow-x-auto p-2 bg-black/20 rounded">
                               {JSON.stringify(lineup, null, 2).substring(0, 300)}...
                            </pre>
                         </div>
                      ) : (
                         <div className="text-center text-text-muted italic py-4">Lineups pending confirmation</div>
                      )}
                   </div>
                </div>
            )}
            {activeTab === "Statistics" && (
                <div className="w-full flex flex-col gap-3 text-xs max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                   {loadingStats ? (
                      <div className="text-center py-4 flex flex-col items-center gap-2">
                         <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                         <span className="text-text-muted">Loading Statistics...</span>
                      </div>
                   ) : statistics && statistics.length > 0 && statistics[0].groups ? (
                      statistics[0].groups.map((group: any) => (
                         group.statisticsItems?.slice(0, 3).map((stat: any, index: number) => (
                           <StatBar 
                              key={`${stat.name}-${index}`} 
                              label={String(stat.name)} 
                              left={parseFloat(String(stat.home).replace('%','')) || 0} 
                              right={parseFloat(String(stat.away).replace('%','')) || 0} 
                           />
                         ))
                      )).flat().slice(0, 5)
                   ) : liveMatch.statistics && liveMatch.statistics.length > 0 ? (
                      liveMatch.statistics.map((stat: any, index: number) => (
                         <StatBar 
                            key={`${stat.type}-${index}`} 
                            label={String(stat.type)} 
                            left={parseInt(String(stat.home)) || 0} 
                            right={parseInt(String(stat.away)) || 0} 
                         />
                      ))
                   ) : (
                      <>
                        <StatBar label="Possession" left={50} right={50} />
                        <StatBar label="Shots" left={0} right={0} />
                        <div className="text-center text-text-muted italic py-2">Waiting for stats...</div>
                      </>
                   )}
                </div>
            )}
            {activeTab === "Insights" && (
                <div className="text-xs text-center w-full text-white/80 px-4 leading-relaxed">
                   {loadingOdds ? (
                      <div className="text-center py-4 flex flex-col items-center gap-2">
                         <div className="w-4 h-4 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                         <span className="text-text-muted">Loading Odds...</span>
                      </div>
                   ) : odds && odds.length > 0 ? (
                      <div className="flex flex-col gap-3">
                         {odds.slice(0, 2).map((market: any, idx: number) => (
                            <div key={idx} className="bg-black/20 p-2 rounded-lg border border-white/5">
                               <div className="text-[10px] text-text-muted uppercase mb-1.5">{market.marketName}</div>
                               <div className="flex justify-center gap-2">
                                  {market.choices?.map((choice: any, cI: number) => (
                                     <div key={cI} className="px-2 py-1 bg-white/5 rounded flex-1 flex justify-between items-center text-[10px]">
                                        <span className="text-white/60">{choice.name}</span>
                                        <span className="text-orange-400 font-bold">{choice.fractionalValue || choice.initialFractionalValue}</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <>
                         <p><span className="font-semibold text-blue-400">{liveMatch.homeTeam?.shortName || ''}</span> vs <span className="font-semibold text-orange-400">{liveMatch.awayTeam?.shortName || ''}</span></p>
                         <p className="mt-2 text-[10px] text-text-muted">Live odds fetching or unavailable</p>
                      </>
                   )}
                </div>
            )}
         </div>

         {/* Tabs */}
         <div className="flex items-center justify-between mb-4 bg-black/20 p-1 rounded-full border border-white/5">
            <Tab label="Timeline" active={activeTab === "Timeline"} onClick={() => setActiveTab("Timeline")} />
            <Tab label="Lineup" active={activeTab === "Lineup"} onClick={() => setActiveTab("Lineup")} />
            <Tab label="Stats" active={activeTab === "Statistics"} onClick={() => setActiveTab("Statistics")} />
            <Tab label="Insights" active={activeTab === "Insights"} onClick={() => setActiveTab("Insights")} />
         </div>

         {allLiveMatches.length > 1 && (
           <div className="flex justify-center gap-1.5 mb-4">
             {allLiveMatches.map((_, i) => (
               <div 
                 key={i} 
                 className={cn(
                   "w-1 h-1 rounded-full transition-all duration-300",
                   i === currentMatchIndex ? "bg-blue-500 w-3" : "bg-white/10"
                 )} 
               />
             ))}
           </div>
         )}

         {/* Watch Button */}
          <button className="w-full relative overflow-hidden rounded-xl bg-blue-600 text-white font-semibold py-3.5 transition-all hover:bg-blue-500 active:scale-[0.98]">
            <div className="relative z-10 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Watch Now
            </div>
         </button>
      </div>

      {/* Group Standing Table */}
      <div className="glass-card p-5">
         <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-medium">Group Standing</h2>
            <div className="relative">
               <select 
                 className="text-xs bg-white/5 border border-white/10 rounded px-3 py-1.5 flex items-center gap-1 hover:bg-white/10 transition-colors appearance-none cursor-pointer pr-6 focus:outline-none focus:ring-1 focus:ring-white/20"
                 value={activeGroup}
                 onChange={(e) => setActiveGroup(e.target.value)}
               >
                 {allStandings && Object.keys(allStandings).map((groupName) => (
                    <option key={groupName} value={groupName}>{groupName}</option>
                 ))}
               </select>
               <svg className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </div>
         </div>

         <div className="w-full">
            <div className="flex items-center text-xs text-text-muted border-b border-white/10 pb-2 mb-3">
               <div className="w-6 text-center">P</div>
               <div className="flex-1 ml-2">Team</div>
               <div className="w-6 text-center">W</div>
               <div className="w-6 text-center">D</div>
               <div className="w-6 text-center">L</div>
               <div className="w-8 text-center font-semibold">Pts</div>
            </div>

            <div className="flex flex-col gap-1">
               {standings.map((team, index) => (
                  <div key={team.id} className="flex items-center text-sm py-2 hover:bg-white/5 rounded px-1 transition-colors">
                     <div className="w-6 text-center text-text-muted font-medium">{index + 1}</div>
                     <div className="flex-1 flex items-center gap-2 ml-2 overflow-hidden">
                        <img src={team.badge} alt={team.name} className="w-5 h-5 rounded-full bg-white/10 object-cover border border-white/10" referrerPolicy="no-referrer" />
                        <span className="truncate flex-1">{team.name}</span>
                     </div>
                     <div className="w-6 text-center">{team.won}</div>
                     <div className="w-6 text-center">{team.drawn}</div>
                     <div className="w-6 text-center">{team.lost}</div>
                     <div className="w-8 text-center font-semibold">{team.points}</div>
                  </div>
               ))}
               {standings.length === 0 && (
                  <div className="text-center text-text-muted text-sm py-4">No data</div>
               )}
            </div>
         </div>
      </div>
    </div>
  )
}

function Tab({ label, active, onClick }: { label: string, active?: boolean, onClick: () => void }) {
   return (
      <button 
         onClick={onClick}
         className={cn(
         "px-3 py-1.5 text-xs font-medium rounded-full transition-all flex-1 text-center",
         active ? "bg-orange-500/20 text-orange-400 border border-orange-500/10" : "text-text-muted hover:text-white hover:bg-white/5"
      )}>
         {label}
      </button>
   )
}

interface StatBarProps {
   key?: string;
   label: string;
   left: number;
   right: number;
}

function StatBar({ label, left, right }: StatBarProps) {
   const total = (left + right) || 1;
   const leftPct = (left / total) * 100;
   return (
      <div className="w-full flex flex-col gap-1.5">
         <div className="flex justify-between items-center text-[10px] text-text-muted uppercase tracking-wider font-semibold">
            <span>{left}{label.includes('%') ? '' : ''}</span>
            <span className="text-white/60">{label}</span>
            <span>{right}</span>
         </div>
         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
            <div style={{ width: `${leftPct}%` }} className="h-full bg-blue-500" />
            <div style={{ width: `${100 - leftPct}%` }} className="h-full bg-orange-500" />
         </div>
      </div>
   )
}
