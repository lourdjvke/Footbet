import React from "react";
import { Calendar, Home, Search, Settings, Trophy, Users, Wallet, Activity, BarChart2, Maximize2, Menu } from "lucide-react";
import { cn } from "../lib/utils";

import { RotatingWorldCupIcon } from "./RotatingWorldCupIcon";

export function TopNav({ 
  onMenuClick, 
  currentPage, 
  onNavigate 
}: { 
  onMenuClick?: () => void;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-dark-card">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-1 mr-1 text-text-muted hover:text-white transition-colors">
           <Menu className="w-5 h-5" />
        </button>
        <button onClick={() => onNavigate?.("dashboard")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
            <RotatingWorldCupIcon className="h-full w-auto object-cover max-w-none" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">Footbet</span>
        </button>
      </div>

      {/* Main Nav Pills - Hidden on mobile, sticky bottom on mobile later */}
      <nav className="hidden md:flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/10">
        <NavItem 
          active={currentPage === "dashboard"} 
          icon={<Home className="w-4 h-4" />} 
          label="Dashboard" 
          onClick={() => onNavigate?.("dashboard")}
        />
        <NavItem 
          active={currentPage === "world-cup"} 
          icon={<RotatingWorldCupIcon className="w-4 h-4 rounded-full object-cover" />} 
          label="World Cup" 
          onClick={() => onNavigate?.("world-cup")}
        />
        <NavItem 
          active={currentPage === "wallet"} 
          icon={<Wallet className="w-4 h-4" />} 
          label="Wallet" 
          onClick={() => onNavigate?.("wallet")}
        />
        <NavItem icon={<Settings className="w-4 h-4" />} />
      </nav>

      {/* Live / Match Toggle */}
      <div className="hidden lg:flex items-center bg-white/5 rounded-full p-1 border border-white/10">
         <button className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-transparent text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live
         </button>
         <button className="px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium text-white">
            Match
         </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        <div className="relative group hidden sm:block">
          <button className="p-2 text-text-muted hover:text-white transition-colors flex items-center">
            <Settings className="w-5 h-5" />
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-[#222224] border border-white/10 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
             <div className="p-2 flex flex-col gap-1">
                <a href="#" className="px-3 py-2 text-sm text-white/80 hover:bg-white/5 rounded-md hover:text-white transition-colors">Preferences</a>
                <a href="#" className="px-3 py-2 text-sm text-white/80 hover:bg-white/5 rounded-md hover:text-white transition-colors">Account Settings</a>
             </div>
          </div>
        </div>
        <div className="relative group border-l border-white/10 pl-2">
          <button className="flex items-center gap-2 text-left">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop" alt="User" className="w-8 h-8 rounded-full border border-white/20" />
            <div className="hidden xl:flex flex-col items-start pr-2">
              <span className="text-sm font-medium text-white leading-none">Matias Corea</span>
              <span className="text-xs text-text-muted mt-1">Realtor</span>
            </div>
            <svg className="w-4 h-4 text-text-muted hidden xl:block transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-[#222224] border border-white/10 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
             <div className="p-2 flex flex-col gap-1">
                <a href="#" className="px-3 py-2 text-sm text-white/80 hover:bg-white/5 rounded-md hover:text-white transition-colors flex items-center justify-between">Profile Configuration</a>
                <a href="#" className="px-3 py-2 text-sm text-white/80 hover:bg-white/5 rounded-md hover:text-white transition-colors text-red-400">Sign Out</a>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavItem({ active, icon, label, onClick }: { active?: boolean, icon: React.ReactNode, label?: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
        active ? "bg-primary-blue/20 text-blue-400" : "text-text-muted hover:text-white hover:bg-white/10"
      )}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
