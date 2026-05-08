/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { TopNav } from "./components/TopNav";
import { ArrowRight } from "lucide-react";
import { LeftSidebar } from "./components/LeftSidebar";
import { CenterFeed } from "./components/CenterFeed";
import { RightSidebar } from "./components/RightSidebar";
import { WorldCupPage } from "./components/WorldCupPage";
import { AdminDashboard } from "./components/AdminDashboard";
import { WalletPage } from "./components/WalletPage";
import { SportsDataProvider, useSportsData } from "./lib/useSportsData";
import { Search as SearchIcon, X } from "lucide-react";

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { standingsLoaded } = useSportsData();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isAdminPage = location.pathname === "/admin";
  const currentPage = location.pathname.includes("WC26") || location.pathname.includes("world-cup") ? "world-cup" : location.pathname.includes("wallet") ? "wallet" : isAdminPage ? "admin" : "dashboard";

  const mainRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mainRef.current) mainRef.current.scrollTop = 0;
    }, 10);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col overflow-hidden selection:bg-blue-500/30">
      {/* Preloader - Only shows if standings not loaded and NOT on admin page */}
      {!standingsLoaded && !isAdminPage && (
        <div className="fixed inset-0 z-[100] bg-dark-bg/80 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"/>
               <p className="text-white/60 font-medium tracking-wide animate-pulse">Loading Sports Hub...</p>
            </div>
        </div>
      )}

      {!isAdminPage && (
        <TopNav 
          onMenuClick={() => setMobileMenuOpen(true)} 
          currentPage={currentPage as any}
          onNavigate={(page) => {
             if (page === "search") {
                setIsSearchOpen(true);
                return;
             }
             navigate(page === "world-cup" ? "/WC26" : page === "wallet" ? "/wallet" : "/");
          }}
        />
      )}
      
      {/* Search Overlay (Desktop) */}
      {isSearchOpen && (
        <div className="hidden md:flex fixed inset-0 z-[100] bg-[#161618]/80 backdrop-blur-md items-start justify-center pt-32 px-6" onClick={() => setIsSearchOpen(false)}>
          <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-[24px] shadow-2xl overflow-hidden flex items-center px-4" onClick={e => e.stopPropagation()}>
             <SearchIcon className="w-6 h-6 text-blue-400 shrink-0" />
             <input autoFocus type="text" placeholder="Search for matches, teams, or players..." className="w-full bg-transparent border-none outline-none text-white text-lg px-4 py-6 placeholder:text-white/40" />
             <button onClick={() => setIsSearchOpen(false)} className="p-2 text-text-muted hover:text-white bg-white/5 rounded-full transition-colors shrink-0">
                <X className="w-5 h-5" />
             </button>
          </div>
        </div>
      )}

      <main ref={mainRef} className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar relative z-10">
        <div className={isAdminPage ? "" : "max-w-[1600px] mx-auto px-4 sm:px-6 py-6 h-full"}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/WC26" element={<WorldCupPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/world-cup" element={<Navigate to="/WC26" replace />} />
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
                  navigate("/WC26");
                  setMobileMenuOpen(false);
               }}
               className="flex items-center gap-2 text-blue-400 font-bold text-lg hover:translate-x-1 transition-transform w-fit"
            >
               WC26 <ArrowRight className="w-5 h-5" />
            </button>
            <LeftSidebar />
         </div>
      </div>

      {/* Mobile Sticky Bottom Nav */}
      {!isAdminPage && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <nav className="flex items-center bg-[#1a1a1c]/90 backdrop-blur-md rounded-full shadow-2xl overflow-hidden border border-white/10 h-[64px]">
            {isSearchOpen ? (
               <div className="flex w-full items-center px-4 gap-3 h-full animate-in slide-in-from-right duration-300">
                  <SearchIcon className="w-5 h-5 text-blue-400 shrink-0" />
                  <input type="text" autoFocus placeholder="Search matches..." className="bg-transparent border-none outline-none flex-1 text-sm text-white placeholder:text-white/40" />
                  <button onClick={() => setIsSearchOpen(false)} className="p-2 text-text-muted hover:text-white bg-white/5 rounded-full shrink-0"><X className="w-4 h-4" /></button>
               </div>
            ) : (
               <div className="flex w-full items-center gap-1 p-1.5 justify-between h-full animate-in slide-in-from-left duration-300">
                  <button 
                    onClick={() => navigate("/")}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-full text-[10px] font-medium transition-all min-w-[60px] ${currentPage === "dashboard" ? "bg-primary-blue/20 text-blue-400" : "text-text-muted hover:text-white"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span>Home</span>
                  </button>
                  <button 
                    onClick={() => navigate("/WC26")}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-full text-[10px] font-medium transition-all min-w-[60px] ${currentPage === "world-cup" ? "bg-primary-blue/20 text-blue-400" : "text-text-muted hover:text-white"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18.5 2h-13a6 6 0 0 0 12 0v7a6 6 0 0 0 12 0V2Z" transform="translate(-1,0)"/></svg>
                    <span>WC26</span>
                  </button>
                  <button 
                    onClick={() => navigate("/wallet")}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-full text-[10px] font-medium transition-all min-w-[60px] ${currentPage === "wallet" ? "bg-primary-blue/20 text-blue-400" : "text-text-muted hover:text-white"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>Wallet</span>
                  </button>
                  <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-full text-[10px] font-medium transition-all text-text-muted hover:text-white min-w-[60px]"
                  >
                    <SearchIcon width="18" height="18" />
                    <span>Search</span>
                  </button>
               </div>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <SportsDataProvider>
        <AppContent />
      </SportsDataProvider>
    </Router>
  );
}
