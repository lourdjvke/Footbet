/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { TopNav } from "./components/TopNav";
import { ArrowRight } from "lucide-react";
import { LeftSidebar } from "./components/LeftSidebar";
import { CenterFeed } from "./components/CenterFeed";
import { RightSidebar } from "./components/RightSidebar";
import { WorldCupPage } from "./components/WorldCupPage";
import { useSportsData } from "./lib/useSportsData";

function Dashboard() {
  return (
    <div className="flex flex-col lg:flex-row xl:justify-between gap-6 xl:gap-8 h-full">
      <div className="hidden lg:block">
        <LeftSidebar />
      </div>
      <CenterFeed />
      <RightSidebar />
    </div>
  );
}

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { standingsLoaded, allLiveMatches } = useSportsData();
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPage = location.pathname.includes("world-cup") ? "world-cup" : "dashboard";

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col overflow-hidden selection:bg-blue-500/30">
      {/* Preloader - Only shows if standings not loaded */}
      {!standingsLoaded && (
        <div className="fixed inset-0 z-[100] bg-dark-bg/80 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"/>
               <p className="text-white/60 font-medium tracking-wide animate-pulse">Loading Sports Hub...</p>
            </div>
        </div>
      )}

      <TopNav 
        onMenuClick={() => setMobileMenuOpen(true)} 
        currentPage={currentPage as any}
        onNavigate={(page) => navigate(page === "world-cup" ? "/world-cup" : "/")}
      />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 h-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/world-cup" element={<WorldCupPage />} />
            <Route path="/WC26" element={<Navigate to="/world-cup" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Slide-out Menu */}
      <div className={`fixed inset-0 z-50 transition-opacity lg:hidden ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
         <div className={`absolute top-0 bottom-0 left-0 w-full bg-dark-bg p-6 overflow-y-auto transition-transform flex flex-col gap-6 shadow-2xl border-r border-white/10 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <button className="text-white ml-auto bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <button 
               onClick={() => {
                  navigate("/world-cup");
                  setMobileMenuOpen(false);
               }}
               className="flex items-center gap-2 text-blue-400 font-bold text-lg hover:translate-x-1 transition-transform w-fit"
            >
               WC26 <ArrowRight className="w-5 h-5" />
            </button>
            <LeftSidebar />
         </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
