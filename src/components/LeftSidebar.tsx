import { useState } from "react";
import { useSportsData } from "../lib/useSportsData";
import { cn } from "../lib/utils";
import { ChevronRight, Target, Activity } from "lucide-react";

export function LeftSidebar() {
  const { mvp, allStandings } = useSportsData();
  const [activeGroup, setActiveGroup] = useState("Premier League");

  const standings = allStandings && allStandings[activeGroup] ? allStandings[activeGroup] : (allStandings ? Object.values(allStandings)[0] || [] : []);

  return (
    <div className="flex flex-col gap-6 w-full lg:w-[320px] shrink-0">
      
      {/* Dashboard Info Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Match Dashboard</h1>
        <p className="text-sm text-text-muted">Real time statistical analysis powered by data points</p>
      </div>

      {/* Overview Module */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Overview <span className="text-sm text-text-muted font-normal ml-1">Today</span></h2>
          <button className="text-xs text-text-muted hover:text-white">See all</button>
        </div>

        {/* MVP Card */}
        <div className="relative overflow-hidden rounded-xl bg-orange-900/40 border border-orange-500/20 p-4 mb-4 flex items-center justify-between group cursor-pointer hover:bg-orange-900/50 transition-colors">
          <div className="relative z-10 flex-1">
            <div className="text-xs text-orange-200/80 mb-1 font-medium tracking-wide">— MVP Of The Day</div>
            <h3 className="font-semibold text-white mb-0.5">{mvp.name}</h3>
            <p className="text-xs text-orange-200/60 mb-2 truncate max-w-[120px]">{mvp.description}</p>
            <div className="flex items-center gap-2 text-xs">
              <img src={mvp.teamBadge} className="w-3 h-3 rounded-sm object-cover bg-white/10" alt="badge" />
              <span className="text-white truncate max-w-[100px]">{mvp.team}</span>
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center">
             <div className="w-14 h-14 rounded-full border-2 border-orange-500/30 overflow-hidden bg-black/20 p-0.5 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                <img src={mvp.image} alt={mvp.name} className="w-full h-full object-cover rounded-full" />
             </div>
             <div className="bg-orange-500 text-[10px] font-bold text-white px-2 py-0.5 rounded-full -mt-2 relative z-10">
                {mvp.score}
             </div>
          </div>
          {/* Subtle background glow effect */}
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-500/20 blur-2xl rounded-full pointer-events-none" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatBox icon={<Target className="w-3 h-3"/>} title="Matches" value="8" subValue="4 Upcoming" />
          <StatBox title="Goals" value="23" subValue="2.9 Per match" isAccent />
          <StatBox icon={<Activity className="w-3 h-3"/>} title="Match Upsets" value="2" subValue="30% Win probability" />
          <StatBox title="Pressing Intensity" value="9.4" subValue="average" highlightSubValue="6.1 press peak" />
        </div>
      </div>

      {/* Predictions Module */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Match Prediction</h2>
          <button className="text-xs text-text-muted hover:text-white">See all</button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium">Qualification Probability</h3>
            <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               Update 2 min ago
            </div>
          </div>
          <div className="relative">
               <select 
                 className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 flex items-center gap-1 hover:bg-white/10 transition-colors appearance-none cursor-pointer pr-5 focus:outline-none focus:ring-1 focus:ring-white/20"
                 value={activeGroup}
                 onChange={(e) => setActiveGroup(e.target.value)}
               >
                   {Object.keys(allStandings).map((groupName) => (
                      <option key={groupName} value={groupName}>{groupName.replace("Group", "Grp")}</option>
                   ))}
               </select>
               <ChevronRight className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
            </div>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          {standings.slice(0, 2).map((team) => (
             <ProbabilityRow key={team.id} name={team.name} flag={team.badge} percent={team.probability} trend="up" />
          ))}
          {standings.length === 0 && (
             <div className="text-center text-text-muted text-sm py-4">No data</div>
          )}
        </div>
      </div>

    </div>
  )
}

function StatBox({ title, icon, value, subValue, highlightSubValue, isAccent }: any) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-2">
        {title} {icon && icon}
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-lg font-semibold">{value}</span>
        {isAccent && <span className="text-xs text-text-muted">Goals</span>}
        {!isAccent && title.includes("Upsets") && <span className="text-xs text-text-muted">Upsets</span>}
      </div>
      <div className="text-[10px] text-text-muted">
         {subValue} <br/> {highlightSubValue && <span className="text-green-400 mt-0.5 block">{highlightSubValue}</span>}
      </div>
    </div>
  )
}

function ProbabilityRow({ name, flag, percent, trend }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src={flag} alt={name} className="w-6 h-6 rounded-full object-cover border border-white/10" />
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-3 flex-1 px-4 max-w-[120px]">
        {/* Mock wave chart */}
        <div className="h-1.5 w-full rounded-full bg-white/10 relative overflow-hidden">
           <div className="absolute left-0 top-0 bottom-0 bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <span className="text-sm font-bold w-9 text-right">{Math.round(percent)}%</span>
    </div>
  )
}
