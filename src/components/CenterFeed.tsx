import { useState, useEffect } from "react";
import { useSportsData } from "../lib/useSportsData";
import { motion, AnimatePresence } from "motion/react";

const HERO_IMAGES = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLcUUDQLJDCjUrO4a3bv-ZOJB6GGBRjgufSgeRQmEgjJ_38RUwoB8W8RU&s=10",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsaOHXJoqyoUdqgskosRu9nvCSajeQf3OdJxPBKKRtmm4AAESb_8o49xKg&s=10",
  "https://www.mancity.com/meta/media/guwnl2xg/liverpool-opta-a-lead.jpg"
];

export function CenterFeed() {
  const { upcomingMatches, allStandings } = useSportsData();
  const [activeGroup, setActiveGroup] = useState("Premier League");
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const standings = allStandings && allStandings[activeGroup] ? allStandings[activeGroup] : (allStandings ? Object.values(allStandings)[0] || [] : []);

  return (
    <div className="flex-1 flex flex-col gap-6 min-w-0">
      
      {/* Hero Image Section Slider */}
      <div className="relative w-full h-[320px] rounded-2xl overflow-hidden glass-card group border border-white/10">
        <AnimatePresence mode="wait">
          <motion.img 
            key={HERO_IMAGES[currentHeroIndex]}
            src={HERO_IMAGES[currentHeroIndex]} 
            alt="Featured Match Hero" 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Pagination Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
           {HERO_IMAGES.map((_, idx) => (
             <div 
               key={idx}
               onClick={() => setCurrentHeroIndex(idx)}
               className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${idx === currentHeroIndex ? "bg-blue-500 w-4" : "bg-white/40 hover:bg-white"}`} 
             />
           ))}
        </div>
      </div>

      {/* Simulator / Overview Section */}
      <div className="glass-card p-5 flex flex-col xl:flex-row gap-6">
         {/* Left Side: Upcoming Matches */}
         <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2 text-text-muted">
                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
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
                       <div 
                          className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center p-0.5 border border-white/20"
                          style={{ backgroundColor: match.homeTeam?.teamColors?.primary || 'rgba(255,255,255,0.1)' }}
                       >
                          {match.homeTeam?.country?.alpha2 ? (
                             <img src={`https://flagcdn.com/${match.homeTeam.country.alpha2.toLowerCase()}.svg`} alt={match.homeTeam?.name} className="w-full h-full object-cover scale-110" />
                          ) : (
                             <img src={match.homeTeam?.badge} alt={match.homeTeam?.name} className="w-10 h-10 object-contain" />
                          )}
                       </div>
                       <span className="text-xs font-semibold text-center leading-tight truncate w-full">{match.homeTeam?.shortName}</span>
                    </div>
                    <span className="text-xl font-bold text-white/50 flex-shrink-0 mx-2">VS</span>
                    <div className="flex flex-col items-center gap-2 w-16">
                       <div 
                          className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center p-0.5 border border-white/20"
                          style={{ backgroundColor: match.awayTeam?.teamColors?.primary || 'rgba(255,255,255,0.1)' }}
                       >
                          {match.awayTeam?.country?.alpha2 ? (
                             <img src={`https://flagcdn.com/${match.awayTeam.country.alpha2.toLowerCase()}.svg`} alt={match.awayTeam?.name} className="w-full h-full object-cover scale-110" />
                          ) : (
                             <img src={match.awayTeam?.badge} alt={match.awayTeam?.name} className="w-10 h-10 object-contain" />
                          )}
                       </div>
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
