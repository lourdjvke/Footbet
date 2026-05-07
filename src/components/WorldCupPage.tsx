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

function SkeletonMatchCard() {
  return (
    <div className="rounded-3xl bg-[#1c1c1e] border border-white/10 p-5 sm:p-6 overflow-hidden flex flex-col gap-6 animate-pulse">
       <div className="flex justify-center">
          <div className="h-2 w-16 bg-white/5 rounded-full" />
       </div>
       <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
             <div className="w-14 h-14 rounded-full bg-white/5 border-2 border-white/5" />
             <div className="h-3 w-12 bg-white/5 rounded mt-1" />
          </div>
          <div className="flex flex-col items-center gap-2">
             <div className="h-5 w-10 bg-white/10 rounded" />
             <div className="h-2 w-8 bg-white/5 rounded" />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
             <div className="w-14 h-14 rounded-full bg-white/5 border-2 border-white/5" />
             <div className="h-3 w-12 bg-white/5 rounded mt-1" />
          </div>
       </div>
    </div>
  );
}

export function WorldCupPage() {
  const [activeTab, setActiveTab] = useState<"Overview" | "Matches" | "Standings">("Overview");
  const [selectedGroup, setSelectedGroup] = useState<string>("All Groups");
  const [events, setEvents] = useState<WorldCupEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/world-cup-events")
      .then(r => {
         if (!r.ok) console.warn(`World Cup API status: ${r.status}`);
         return r.json();
      })
      .then(data => {
        if (data && data.events && data.events.length > 0) {
          setEvents(data.events);
        } else {
           console.log("Using massively expanded fallback World Cup 2026 opening matches...");
           const fallback: any[] = [
              // Group A
              { id: 101, tournament: { groupName: "Group A", groupSign: "A" }, homeTeam: { id: 4725, name: "Canada", slug: "canada", shortName: "CAN" }, awayTeam: { id: 4732, name: "Qatar", slug: "qatar", shortName: "QAT" }, startTimestamp: 1781280000, slug: "canada-qatar" },
              { id: 1010, tournament: { groupName: "Group A", groupSign: "A" }, homeTeam: { id: 4726, name: "France", slug: "france", shortName: "FRA" }, awayTeam: { id: 4727, name: "Nigeria", slug: "nigeria", shortName: "NGA" }, startTimestamp: 1781287200, slug: "france-nigeria" },
              { id: 1011, tournament: { groupName: "Group A", groupSign: "A" }, homeTeam: { id: 4728, name: "Brazil", slug: "brazil", shortName: "BRA" }, awayTeam: { id: 4729, name: "Norway", slug: "norway", shortName: "NOR" }, startTimestamp: 1781294400, slug: "brazil-norway" },
              { id: 1012, tournament: { groupName: "Group A", groupSign: "A" }, homeTeam: { id: 4725, name: "Canada", slug: "canada", shortName: "CAN" }, awayTeam: { id: 4728, name: "Brazil", slug: "brazil", shortName: "BRA" }, startTimestamp: 1781798400, slug: "canada-brazil" },
              
              // Group B
              { id: 102, tournament: { groupName: "Group B", groupSign: "B" }, homeTeam: { id: 4716, name: "Mexico", slug: "mexico", shortName: "MEX" }, awayTeam: { id: 4733, name: "Australia", slug: "australia", shortName: "AUS" }, startTimestamp: 1781366400, slug: "mexico-australia" },
              { id: 1020, tournament: { groupName: "Group B", groupSign: "B" }, homeTeam: { id: 4717, name: "South Korea", slug: "south-korea", shortName: "KOR" }, awayTeam: { id: 4718, name: "Egypt", slug: "egypt", shortName: "EGY" }, startTimestamp: 1781373600, slug: "south-korea-egypt" },
              { id: 1021, tournament: { groupName: "Group B", groupSign: "B" }, homeTeam: { id: 4719, name: "Spain", slug: "spain", shortName: "ESP" }, awayTeam: { id: 4720, name: "Japan", slug: "japan", shortName: "JPN" }, startTimestamp: 1781380800, slug: "spain-japan-early" },
              { id: 1022, tournament: { groupName: "Group B", groupSign: "B" }, homeTeam: { id: 4716, name: "Mexico", slug: "mexico", shortName: "MEX" }, awayTeam: { id: 4719, name: "Spain", slug: "spain", shortName: "ESP" }, startTimestamp: 1781884800, slug: "mexico-spain" },
              
              // Group C
              { id: 103, tournament: { groupName: "Group C", groupSign: "C" }, homeTeam: { id: 4711, name: "USA", slug: "usa", shortName: "USA" }, awayTeam: { id: 4734, name: "Morocco", slug: "morocco", shortName: "MAR" }, startTimestamp: 1781452800, slug: "usa-morocco" },
              { id: 1030, tournament: { groupName: "Group C", groupSign: "C" }, homeTeam: { id: 4712, name: "Netherlands", slug: "netherlands", shortName: "NED" }, awayTeam: { id: 4713, name: "Ecuador", slug: "ecuador", shortName: "ECU" }, startTimestamp: 1781460000, slug: "netherlands-ecuador" },
              { id: 1031, tournament: { groupName: "Group C", groupSign: "C" }, homeTeam: { id: 4714, name: "Argentina", slug: "argentina", shortName: "ARG" }, awayTeam: { id: 4715, name: "Poland", slug: "poland", shortName: "POL" }, startTimestamp: 1781467200, slug: "argentina-poland-early" },
              { id: 1032, tournament: { groupName: "Group C", groupSign: "C" }, homeTeam: { id: 4711, name: "USA", slug: "usa", shortName: "USA" }, awayTeam: { id: 4714, name: "Argentina", slug: "argentina", shortName: "ARG" }, startTimestamp: 1781971200, slug: "usa-argentina" },
              
              // Group D
              { id: 104, tournament: { groupName: "Group D", groupSign: "D" }, homeTeam: { id: 47141, name: "Portugal", slug: "portugal", shortName: "POR" }, awayTeam: { id: 47142, name: "Ghana", slug: "ghana", shortName: "GHA" }, startTimestamp: 1781539200, slug: "portugal-ghana" },
              { id: 1040, tournament: { groupName: "Group D", groupSign: "D" }, homeTeam: { id: 47161, name: "Saudi Arabia", slug: "saudi-arabia", shortName: "KSA" }, awayTeam: { id: 47162, name: "Tunisia", slug: "tunisia", shortName: "TUN" }, startTimestamp: 1781546400, slug: "saudi-arabia-tunisia" },
              { id: 1041, tournament: { groupName: "Group D", groupSign: "D" }, homeTeam: { id: 47163, name: "Uruguay", slug: "uruguay", shortName: "URU" }, awayTeam: { id: 47164, name: "Cameroon", slug: "cameroon", shortName: "CMR" }, startTimestamp: 1781553600, slug: "uruguay-cameroon" },
              
              // Group E
              { id: 105, tournament: { groupName: "Group E", groupSign: "E" }, homeTeam: { id: 4719, name: "Spain", slug: "spain", shortName: "ESP" }, awayTeam: { id: 4720, name: "Japan", slug: "japan", shortName: "JPN" }, startTimestamp: 1781625600, slug: "spain-japan" },
              { id: 1050, tournament: { groupName: "Group E", groupSign: "E" }, homeTeam: { id: 4721, name: "Costa Rica", slug: "costa-rica", shortName: "CRC" }, awayTeam: { id: 4722, name: "Germany", slug: "germany", shortName: "GER" }, startTimestamp: 1781632800, slug: "costa-rica-germany" },
              { id: 1051, tournament: { groupName: "Group E", groupSign: "E" }, homeTeam: { id: 4723, name: "Italy", slug: "italy", shortName: "ITA" }, awayTeam: { id: 4724, name: "Switzerland", slug: "switzerland", shortName: "SUI" }, startTimestamp: 1781640000, slug: "italy-switzerland" },
              
              // Group F
              { id: 106, tournament: { groupName: "Group F", groupSign: "F" }, homeTeam: { id: 4723, name: "Belgium", slug: "belgium", shortName: "BEL" }, awayTeam: { id: 4724, name: "Croatia", slug: "croatia", shortName: "CRO" }, startTimestamp: 1781712000, slug: "belgium-croatia" },
              { id: 1060, tournament: { groupName: "Group F", groupSign: "F" }, homeTeam: { id: 47251, name: "Senegal", slug: "senegal", shortName: "SEN" }, awayTeam: { id: 47252, name: "Serbia", slug: "serbia", shortName: "SRB" }, startTimestamp: 1781719200, slug: "senegal-serbia" },
              { id: 1061, tournament: { groupName: "Group F", groupSign: "F" }, homeTeam: { id: 47253, name: "England", slug: "england", shortName: "ENG" }, awayTeam: { id: 47254, name: "USA", slug: "usa", shortName: "USA" }, startTimestamp: 1781726400, slug: "england-usa" },
              
              // Group G
              { id: 107, tournament: { groupName: "Group G", groupSign: "G" }, homeTeam: { id: 4728, name: "Brazil", slug: "brazil", shortName: "BRA" }, awayTeam: { id: 4729, name: "Switzerland", slug: "switzerland", shortName: "SUI" }, startTimestamp: 1781798400, slug: "brazil-switzerland" },
              { id: 1070, tournament: { groupName: "Group G", groupSign: "G" }, homeTeam: { id: 4730, name: "Cameroon", slug: "cameroon", shortName: "CMR" }, awayTeam: { id: 4731, name: "Serbia", slug: "serbia", shortName: "SRB" }, startTimestamp: 1781805600, slug: "cameroon-serbia" },
              
              // Group H
              { id: 108, tournament: { groupName: "Group H", groupSign: "H" }, homeTeam: { id: 4735, name: "Portugal", slug: "portugal", shortName: "POR" }, awayTeam: { id: 4736, name: "Ghana", slug: "ghana", shortName: "GHA" }, startTimestamp: 1781884800, slug: "portugal-ghana" },
              { id: 1080, tournament: { groupName: "Group H", groupSign: "H" }, homeTeam: { id: 4737, name: "Uruguay", slug: "uruguay", shortName: "URU" }, awayTeam: { id: 4738, name: "South Korea", slug: "south-korea", shortName: "KOR" }, startTimestamp: 1781892000, slug: "uruguay-south-korea" }
           ];
           setEvents(fallback);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("RAW ERROR: World Cup fetch failed:", err);
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
                        [1,2].map(i => <SkeletonMatchCard key={i} />)
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
                     [1,2,3,4,5,6].map(i => <SkeletonMatchCard key={i} />)
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
