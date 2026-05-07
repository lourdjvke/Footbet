import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Calendar, Info, Users, ChevronRight, ArrowRight, BarChart2, Activity } from "lucide-react";
import { RotatingWorldCupIcon } from "./RotatingWorldCupIcon";
import { cn } from "../lib/utils";

interface Team {
  name: string;
  slug: string;
  shortName: string;
  id: number;
  nameCode?: string;
  country?: {
    alpha2: string;
    name: string;
  };
  teamColors?: {
    primary: string;
    secondary: string;
  };
}

interface WorldCupEvent {
  id: number;
  tournament: {
    groupName: string;
    groupSign: string;
  };
  homeTeam: Team;
  awayTeam: Team;
  startTimestamp: number;
  slug: string;
}

export function WorldCupPage() {
  const [activeTab, setActiveTab] = useState<"Overview" | "Matches" | "Standings">("Overview");
  const [selectedGroup, setSelectedGroup] = useState<string>("All Groups");
  const [events, setEvents] = useState<WorldCupEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/world-cup-events")
      .then(r => r.json())
      .then(data => {
        if (data && data.events) {
          setEvents(data.events);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch WC events:", err);
        setLoading(false);
      });
  }, []);

  const groups = ["All Groups", ...Array.from(new Set(events.map(e => e.tournament.groupName))).sort()];

  const filteredEvents = selectedGroup === "All Groups" 
    ? events 
    : events.filter(e => e.tournament.groupName === selectedGroup);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full flex flex-col gap-6"
    >
      {/* Header Profile Section */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 p-6 sm:p-8 bg-[#1c1c1e]">
         {/* Background Image with Global Overlay */}
         <div 
           className="absolute inset-0 bg-cover bg-center z-0" 
           style={{ backgroundImage: 'url("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRyX9wNvAS_AgsNrqFMx_3EgfhHKiAz6QaqJ5cVfiAs96-mfiupOJeJsfc&s=10")' }}
         />
         <div className="absolute inset-0 bg-black/70 z-0" />
         
         <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative z-10">
            <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-3xl bg-blue-600 flex items-center justify-center overflow-hidden border border-white/20">
               <RotatingWorldCupIcon className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
               <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                  <h1 className="text-2xl sm:text-4xl font-display font-bold tracking-tight">FIFA World Cup 2026</h1>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider w-fit mx-auto md:mx-0">Official Host</span>
               </div>
               <p className="text-text-muted max-w-2xl text-xs sm:text-base leading-relaxed line-clamp-3 md:line-clamp-none">
                  The monumental 23rd iteration of the global tournament. Hosted across Canada, Mexico, and the United States, 
                  defining a new era with an expanded 48-team roster.
               </p>
               
               <div className="flex items-center justify-center md:justify-start gap-6 sm:gap-8 mt-6 sm:mt-8">
                  <div className="flex flex-col">
                     <span className="text-2xl sm:text-3xl font-display font-bold tracking-tighter">48</span>
                     <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold">Teams</span>
                  </div>
                  <div className="w-px h-8 sm:h-10 bg-white/10" />
                  <div className="flex flex-col">
                     <span className="text-2xl sm:text-3xl font-display font-bold tracking-tighter">16</span>
                     <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold">Cities</span>
                  </div>
                  <div className="w-px h-8 sm:h-10 bg-white/10" />
                  <div className="flex flex-col">
                     <span className="text-2xl sm:text-3xl font-display font-bold tracking-tighter">104</span>
                     <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-bold">Matches</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Internal Tabs - Slidable on mobile */}
         <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 mt-8 w-full sm:w-fit overflow-x-auto no-scrollbar shrink-0 relative z-10">
            {["Overview", "Matches", "Standings"].map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                     "px-6 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                     activeTab === tab ? "bg-white/10 text-white shadow-lg" : "text-text-muted hover:text-white"
                  )}
               >
                  {tab}
               </button>
            ))}
         </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 flex flex-col gap-6 sm:gap-8">
                  <div className="flex items-center justify-between">
                     <h2 className="text-xl sm:text-2xl font-display font-bold">Featured Matches</h2>
                     <button 
                        onClick={() => setActiveTab("Matches")}
                        className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 sm:px-4 py-2 rounded-xl"
                     >
                        Full schedule <ArrowRight className="w-4 h-4" />
                     </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {loading ? (
                        [1,2].map(i => <div key={i} className="h-40 rounded-3xl bg-white/5 animate-pulse" />)
                     ) : (
                        events.slice(0, 2).map(event => (
                           <MatchCard key={event.id} event={event} />
                        ))
                     )}
                  </div>

                  <div className="flex flex-col gap-4 sm:gap-6">
                     <div className="flex items-center justify-between">
                        <h2 className="text-xl sm:text-2xl font-display font-bold">Cities</h2>
                        <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">16 Venues</span>
                     </div>
                     <HostCitiesCarousel />
                  </div>
               </div>

               <div className="flex flex-col gap-6 sm:gap-8">
                  <h2 className="text-xl sm:text-2xl font-display font-bold">Tournament Info</h2>
                  <div className="rounded-3xl bg-[#1c1c1e] border border-white/10 p-6 sm:p-8 flex flex-col gap-6 sm:gap-8">
                     <InfoItem icon={<Calendar className="w-5 h-5" />} label="Dates" value="Jun 11 - Jul 19, 2026" />
                     <InfoItem icon={<Users className="w-5 h-5" />} label="Associations" value="CONCACAF" />
                     <InfoItem icon={<Trophy className="w-5 h-5" />} label="Current Champion" value="Argentina" />
                  </div>
                  
                  <div className="rounded-3xl bg-blue-700 p-6 text-white">
                     <h4 className="font-bold text-base sm:text-lg mb-2">Watch Live</h4>
                     <p className="text-white/80 text-xs sm:text-sm mb-4">Registration for tickets is now open on the official FIFA platform. Don't miss out!</p>
                     <button className="w-full py-3 rounded-2xl bg-white text-blue-700 font-bold text-sm transition-all active:scale-95">
                        Register Interest
                     </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === "Matches" && (
            <div className="flex flex-col gap-6">
               {/* Glassmorphic Group Filters Carousel */}
               <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 mask-linear-r">
                  {groups.map((group) => (
                     <button
                        key={group}
                        onClick={() => setSelectedGroup(group)}
                        className={cn(
                           "px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
                           selectedGroup === group 
                              ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
                              : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                        )}
                     >
                        {group}
                     </button>
                  ))}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {loading ? (
                     [1,2,3,4,5,6].map(i => <div key={i} className="h-40 rounded-3xl bg-white/5 animate-pulse" />)
                  ) : (
                     filteredEvents.map(event => (
                        <MatchCard key={event.id} event={event} />
                     ))
                  )}
               </div>
               
               {filteredEvents.length === 0 && !loading && (
                  <div className="py-20 text-center flex flex-col items-center gap-4">
                     <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-white/20" />
                     </div>
                     <p className="text-text-muted">No matches scheduled for this group yet.</p>
                  </div>
               )}
            </div>
          )}

          {activeTab === "Standings" && (
            <div className="py-32 flex flex-col items-center justify-center text-center gap-6 rounded-3xl bg-white/5 border border-white/10 border-dashed">
               <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
                  <Activity className="w-10 h-10 text-blue-400" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold mb-2">Standings Coming Soon</h3>
                  <p className="text-text-muted max-w-xs mx-auto">Group standings will be generated once the tournament schedule is finalized.</p>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

interface MatchCardProps {
  event: WorldCupEvent;
  key?: React.Key;
}

function MatchCard({ event }: MatchCardProps) {
  const date = new Date(event.startTimestamp * 1000);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const getFlag = (alpha2?: string) => alpha2 ? `https://flagcdn.com/w80/${alpha2.toLowerCase()}.png` : null;

  return (
    <div className="group relative rounded-3xl bg-[#1c1c1e] border border-white/10 p-5 sm:p-6 hover:bg-[#222224] transition-all hover:border-white/20 overflow-hidden flex flex-col gap-4 sm:gap-6">
       <div className="flex items-center justify-center relative z-10">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors">
            {event.tournament.groupName}
          </span>
       </div>

       <div className="flex items-center justify-between gap-2 px-1 relative z-10">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-2 flex-1">
             <div className="relative">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10 overflow-hidden group-hover:border-blue-500/40 transition-all">
                   <img 
                      src={`https://api.sofascore.app/api/v1/team/${event.homeTeam.id}/image`} 
                      onError={(e) => {
                         const target = e.target as HTMLImageElement;
                         const flag = getFlag(event.homeTeam.country?.alpha2);
                         if (flag && target.src !== flag) target.src = flag;
                      }}
                      alt={event.homeTeam.shortName} 
                      className="w-full h-full object-cover" 
                   />
                </div>
                {event.homeTeam.country?.alpha2 && (
                   <img src={getFlag(event.homeTeam.country.alpha2)!} className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-dark-bg" alt="" />
                )}
             </div>
             <div className="flex flex-col items-center">
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{event.homeTeam.nameCode || event.homeTeam.shortName}</span>
                <span className="text-[8px] sm:text-[9px] text-text-muted font-medium truncate max-w-[60px] sm:max-w-[80px]">{event.homeTeam.name}</span>
             </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 min-w-[50px] sm:min-w-[60px]">
             <div className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] sm:text-[10px] font-bold text-blue-400 group-hover:bg-blue-500/20 transition-all uppercase">VS</div>
             <div className="flex flex-col items-center">
                <span className="text-[9px] sm:text-[10px] font-bold text-white/90">{dateStr}</span>
                <span className="text-[9px] sm:text-[10px] text-text-muted">{timeStr}</span>
             </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-2 flex-1">
             <div className="relative">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10 overflow-hidden group-hover:border-blue-500/40 transition-all">
                   <img 
                      src={`https://api.sofascore.app/api/v1/team/${event.awayTeam.id}/image`} 
                      onError={(e) => {
                         const target = e.target as HTMLImageElement;
                         const flag = getFlag(event.awayTeam.country?.alpha2);
                         if (flag && target.src !== flag) target.src = flag;
                      }}
                      alt={event.awayTeam.shortName} 
                      className="w-full h-full object-cover" 
                   />
                </div>
                {event.awayTeam.country?.alpha2 && (
                   <img src={getFlag(event.awayTeam.country.alpha2)!} className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-dark-bg" alt="" />
                )}
             </div>
             <div className="flex flex-col items-center">
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{event.awayTeam.nameCode || event.awayTeam.shortName}</span>
                <span className="text-[8px] sm:text-[9px] text-text-muted font-medium truncate max-w-[60px] sm:max-w-[80px]">{event.awayTeam.name}</span>
             </div>
          </div>
       </div>
    </div>
  );
}

function HostCitiesCarousel() {
  const cities = ["Mexico City", "Miami", "Toronto", "Los Angeles", "Vancouver", "New York", "Dallas", "Atlanta", "Guadalajara", "Houston", "Kansas City", "Monterrey", "Philadelphia", "San Francisco", "Seattle", "Boston"];
  
  return (
    <div className="relative w-full overflow-hidden py-2 group">
      <motion.div 
        className="flex gap-3 sm:gap-4 w-fit"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ 
          duration: 35, 
          ease: "linear", 
          repeat: Infinity 
        }}
      >
        {[...cities, ...cities].map((city, i) => (
          <div 
            key={`${city}-${i}`}
            className="px-4 py-3 sm:px-6 sm:py-4 rounded-2xl sm:rounded-3xl bg-[#1c1c1e] border border-white/10 whitespace-nowrap text-xs sm:text-sm font-medium hover:bg-[#222224] hover:border-white/20 transition-all cursor-default"
          >
            {city}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
       <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
          {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 text-blue-400" })}
       </div>
       <div className="flex flex-col">
          <span className="text-xs text-text-muted font-medium mb-0.5">{label}</span>
          <span className="text-sm font-semibold text-white/90">{value}</span>
       </div>
    </div>
  );
}
