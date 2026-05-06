/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { TopNav } from "./components/TopNav";
import { LeftSidebar } from "./components/LeftSidebar";
import { CenterFeed } from "./components/CenterFeed";
import { RightSidebar } from "./components/RightSidebar";
import { useSportsData } from "./lib/useSportsData";

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { loading, progress } = useSportsData();

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col overflow-hidden selection:bg-blue-500/30">
      {/* Preloader */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-dark-bg/80 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"/>
               <p className="text-white/60 font-medium tracking-wide animate-pulse">Loading Live Data...</p>
            </div>
        </div>
      )}

      <TopNav onMenuClick={() => setMobileMenuOpen(true)} />
      
      {/* Main Dashboard Layout */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto no-scrollbar relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 h-full">
          <div className="flex flex-col lg:flex-row xl:justify-between gap-6 xl:gap-8 h-full">
            {/* Desktop Left Sidebar */}
            <div className="hidden lg:block">
              <LeftSidebar />
            </div>

            <CenterFeed />
            <RightSidebar />
          </div>
        </div>
      </main>

      {/* Mobile Slide-out Menu (Left Sidebar) - Now Full Width */}
      <div className={`fixed inset-0 z-50 transition-opacity lg:hidden ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
         <div className={`absolute top-0 bottom-0 left-0 w-full bg-dark-bg p-6 overflow-y-auto transition-transform flex flex-col gap-6 shadow-2xl border-r border-white/10 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <button className="text-white ml-auto bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" onClick={() => setMobileMenuOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <LeftSidebar />
         </div>
      </div>

      {/* Global subtle glow effects behind everything */}
      <div className="fixed top-20 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
