import { useState } from "react";
import { useSportsData } from "../lib/useSportsData";

export function CenterFeed() {
  const { upcomingMatches, allStandings, heroImage } = useSportsData();
  const [activeGroup, setActiveGroup] = useState("Premier League");

  const standings = allStandings && allStandings[activeGroup] ? allStandings[activeGroup] : (allStandings ? Object.values(allStandings)[0] || [] : []);

  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      
      {/* Hero Image Section */}
      <div className="relative w-full h-[320px] rounded-2xl overflow-hidden glass-card group border border-white/10">
        <img 
          src={heroImage} 
          alt="Featured Match Hero" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-black/40 to-transparent" />
        
        {/* Pagination Dots mocked at bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-white transition-opacity" />
           <div className="w-1.5 h-1.5 rounded-full bg-white/40 mix-blend-overlay cursor-pointer hover:bg-white" />
           <div className="w-1.5 h-1.5 rounded-full bg-white/40 mix-blend-overlay cursor-pointer hover:bg-white" />
        </div>
      </div>

      {/* Simulator / Overview Section */}
      <div className="glass-card p-5 flex flex-col xl:flex-row gap-6">
         {/* Left Side: Upcoming Matches */}
         <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2 text-text-muted">
                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                 <span className="text-xs uppercase tracking-wider font-semibold">Match Simulation Overview</span>
              </div>
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

            <h3 className="text-lg font-medium mb-4">Upcoming Matches</h3>
            
            {upcomingMatches.length === 0 && (
               <div className="text-sm text-text-muted p-4 text-center border border-white/5 rounded-xl bg-white/5">
                  Loading matches...
               </div>
            )}
            {upcomingMatches.map(match => (
              <div key={match.id} className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-4 mb-4 last:mb-0">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col items-center gap-2 w-16">
                       <img src={match.homeTeam?.badge} alt={match.homeTeam?.name} className="w-12 h-12 rounded-full object-cover bg-white/10 p-1" />
                       <span className="text-xs font-semibold text-center leading-tight truncate w-full">{match.homeTeam?.shortName}</span>
                    </div>
                    <span className="text-xl font-bold text-white/50 flex-shrink-0 mx-2">VS</span>
                    <div className="flex flex-col items-center gap-2 w-16">
                       <img src={match.awayTeam?.badge} alt={match.awayTeam?.name} className="w-12 h-12 rounded-full object-cover bg-white/10 p-1" />
                       <span className="text-xs font-semibold text-center leading-tight truncate w-full">{match.awayTeam?.shortName}</span>
                    </div>
                 </div>

                 <div className="flex justify-between items-end border-t border-white/10 pt-3">
                    <div>
                      <div className="text-sm font-medium">{match.date}</div>
                      <div className="text-xs text-text-muted">{match.time}</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      {match.stadium} 
                    </div>
                 </div>

                 {/* Mock simulation footer bar */}
                 <div className="absolute bottom-0 left-0 right-0 h-[3px] flex">
                    <div className="bg-blue-500 h-full w-[40%]" />
                    <div className="bg-gray-500 h-full w-[20%]" />
                    <div className="bg-red-500 h-full w-[40%]" />
                 </div>
              </div>
            ))}
         </div>

         {/* Right Side: Simulated Standing */}
         <div className="flex-[0.8] flex flex-col">
            <h3 className="text-lg font-medium mb-4 xl:mt-[38px]">Standings Snapshot</h3>
            <div className="flex flex-col gap-3">
               {standings.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                     <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <img src={team.badge} alt={team.name} className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0 bg-white/10" />
                        <span className="text-sm font-medium truncate">{team.name}</span>
                     </div>
                     <div className="flex items-center gap-2 text-sm shrink-0 ml-2">
                        <span className="text-white font-medium whitespace-nowrap">{team.points} <span className="text-[10px] text-text-muted">pts</span></span>
                        <span className="text-text-muted w-[1px] h-3 bg-white/20" />
                        <span className="font-semibold text-right w-10 text-blue-400">{Math.round(team.probability)}%</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}
