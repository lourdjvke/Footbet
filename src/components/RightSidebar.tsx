import { useState } from "react";
import { useSportsData } from "../lib/useSportsData";
import { Maximize2, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/utils";

export function RightSidebar() {
  const { liveMatch, allStandings } = useSportsData();
  const [activeTab, setActiveTab] = useState("Lineup");
  const [activeGroup, setActiveGroup] = useState("Premier League");

  const standings = allStandings && allStandings[activeGroup] ? allStandings[activeGroup] : (allStandings ? Object.values(allStandings)[0] || [] : []);

  return (
    <div className="flex flex-col gap-6 w-full lg:w-[320px] xl:w-[360px] shrink-0">
      
      {/* Live Matches */}
      <div className="glass-card p-5 relative overflow-hidden group">
         <div className="absolute top-4 right-4 text-text-muted hover:text-white cursor-pointer bg-white/5 p-1.5 rounded-full z-10 transition-colors">
            <Maximize2 className="w-4 h-4" />
         </div>

         <h2 className="text-lg font-medium mb-1">Live Matches</h2>
         <p className="text-sm border-white/20 pb-4 mb-4 font-medium flex flex-col items-center justify-center text-white/80 border-b border-dashed">
            <span>First Stage <span className="text-white/40 mx-2">•</span> {activeGroup}</span>
            <span className="text-xs text-text-muted mt-1 font-normal">{liveMatch.stadium}</span>
         </p>

         {/* Match Score */}
         <div className="flex items-center justify-between px-2 mb-6">
            <div className="flex flex-col items-center gap-2 relative w-20">
               <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                 <img src={liveMatch.homeTeam?.badge} alt={liveMatch.homeTeam?.name} className="w-12 h-12 object-cover rounded-sm" />
               </div>
               <span className="text-sm font-semibold text-center truncate w-full">{liveMatch.homeTeam?.shortName}</span>
            </div>

            <div className="flex flex-col items-center justify-center -mt-6">
               <div className="text-3xl font-bold tracking-widest text-white">
                 {liveMatch.homeScore} - {liveMatch.awayScore}
               </div>
               <div className="px-3 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold mt-1 border border-green-500/30">
                  {liveMatch.minute}:02
               </div>
            </div>

            <div className="flex flex-col items-center gap-2 relative w-20">
               <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                 <img src={liveMatch.awayTeam?.badge} alt={liveMatch.awayTeam?.name} className="w-12 h-12 object-cover rounded-sm" />
               </div>
               <span className="text-sm font-semibold text-center truncate w-full">{liveMatch.awayTeam?.shortName}</span>
            </div>
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
                         <span className="font-bold text-blue-400">{liveMatch.lineup?.home?.coach?.[0]?.lineup_player || "4-3-3"}</span>
                      </div>
                      <div className="w-[1px] h-6 bg-white/10" />
                      <div className="flex flex-col items-end gap-1">
                         <span className="text-[10px] text-text-muted uppercase">System</span>
                         <span className="font-bold text-orange-400">{liveMatch.lineup?.away?.coach?.[0]?.lineup_player || "4-2-3-1"}</span>
                      </div>
                   </div>
                   <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                      {liveMatch.lineup?.home?.starting_lineups?.slice(0, 5).map((p: any, idx: number) => (
                         <div key={p.player_key} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                               <span className="text-blue-400 font-mono w-4">{p.lineup_number}</span>
                               <span className="text-white/80">{p.lineup_player}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-white/80">{liveMatch.lineup?.away?.starting_lineups?.[idx]?.lineup_player}</span>
                               <span className="text-orange-400 font-mono w-4 text-right">{liveMatch.lineup?.away?.starting_lineups?.[idx]?.lineup_number}</span>
                            </div>
                         </div>
                      ))}
                      {(!liveMatch.lineup) && (
                         <div className="text-center text-text-muted italic py-4">Lineups pending confirmation</div>
                      )}
                   </div>
                </div>
            )}
            {activeTab === "Statistics" && (
                <div className="w-full flex flex-col gap-3 text-xs max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                   {liveMatch.statistics && liveMatch.statistics.length > 0 ? (
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
                   <p><span className="font-semibold text-blue-400">{liveMatch.homeTeam.shortName}</span> has higher xG (1.82) compared to <span className="font-semibold text-orange-400">{liveMatch.awayTeam.shortName}</span> (0.95).</p>
                   <p className="mt-2 text-[10px] text-text-muted">Recommended bet: Over 2.5 goals</p>
                </div>
            )}
         </div>

         {/* Tabs */}
         <div className="flex items-center justify-between mb-5 bg-black/20 p-1 rounded-full border border-white/5">
            <Tab label="Timeline" active={activeTab === "Timeline"} onClick={() => setActiveTab("Timeline")} />
            <Tab label="Lineup" active={activeTab === "Lineup"} onClick={() => setActiveTab("Lineup")} />
            <Tab label="Statistics" active={activeTab === "Statistics"} onClick={() => setActiveTab("Statistics")} />
            <Tab label="Insights" active={activeTab === "Insights"} onClick={() => setActiveTab("Insights")} />
         </div>

         {/* Watch Button */}
         <button className="w-full relative overflow-hidden rounded-xl bg-blue-600 text-white font-semibold py-3.5 transition-all hover:bg-blue-500 active:scale-[0.98]">
            <div className="relative z-10 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Watch Now
            </div>
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,rgba(0,0,0,0.1)_4px,rgba(0,0,0,0.1)_8px)]" />
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
                        <img src={team.badge} alt={team.name} className="w-5 h-5 rounded-full bg-white/10 object-cover border border-white/10" />
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
         active ? "bg-orange-500/20 text-orange-400 border border-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.1)]" : "text-text-muted hover:text-white hover:bg-white/5"
      )}>
         {label}
      </button>
   )
}

interface StatBarProps {
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
