import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from "firebase/database";
import { motion } from "motion/react";
import { LayoutDashboard, Radio, Database, ShieldAlert, Cpu } from "lucide-react";
import { rtdb as db } from '../lib/firebase';

export function AdminDashboard() {
  const [isLiveEnabled, setIsLiveEnabled] = useState<boolean | null>(null);
  const [lastLiveFetch, setLastLiveFetch] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<"connecting" | "connected" | "failed">("connecting");

  useEffect(() => {
    const settingsRef = ref(db, 'settings/isLiveFetchingEnabled');
    const liveCacheRef = ref(db, 'liveEvents/timestamp');

    const unsubSettings = onValue(settingsRef, (snapshot) => {
      setIsLiveEnabled(snapshot.val() ?? true);
      setDbStatus("connected");
    }, (err) => {
      console.error("[ADMIN] Firebase Error:", err);
      setDbStatus("failed");
    });

    const unsubCache = onValue(liveCacheRef, (snapshot) => {
      setLastLiveFetch(snapshot.val());
    });

    return () => {
      unsubSettings();
      unsubCache();
    };
  }, []);

  const toggleFetching = async () => {
    if (isLiveEnabled === null) return;
    const settingsRef = ref(db, 'settings/isLiveFetchingEnabled');
    await set(settingsRef, !isLiveEnabled);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 sm:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Controls</h1>
            <p className="text-gray-400">Manage API interactions and data persistence</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Control Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-[2rem] bg-[#1c1c1e] border border-white/10 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio className={`w-5 h-5 ${isLiveEnabled ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
                <h2 className="text-xl font-semibold">Live Scraper</h2>
              </div>
              <button 
                onClick={toggleFetching}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isLiveEnabled ? 'bg-green-600' : 'bg-white/10'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isLiveEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed">
              When disabled, the server will stop calling external APIs (Sofascore/Football-API) and will serve matches exclusively from your Realtime Database cache.
            </p>

            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Status</span>
                <span className={`text-sm font-medium ${isLiveEnabled ? 'text-green-500' : 'text-orange-500'}`}>
                  {isLiveEnabled ? 'ACTIVE & FETCHING' : 'IDLE / CACHE ONLY'}
                </span>
              </div>
              {lastLiveFetch && (
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Last Update</span>
                  <span className="text-sm font-medium text-white/60">
                    {new Date(lastLiveFetch).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-[2rem] bg-[#1c1c1e] border border-white/10 flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-gray-400" />
              <h2 className="text-xl font-semibold">Node Status</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Firebase RTDB</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-green-500' : dbStatus === 'failed' ? 'bg-red-500' : 'bg-orange-500 animate-pulse'}`} />
                  <span className={`text-xs font-medium ${dbStatus === 'connected' ? 'text-green-500' : dbStatus === 'failed' ? 'text-red-500' : 'text-orange-500'}`}>
                    {dbStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">ScrapingAnt Pool</span>
                </div>
                <span className="text-xs font-mono text-white/40">8 KEYS ROTATING</span>
              </div>
            </div>

            <div className="mt-auto bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl">
              <p className="text-[11px] text-orange-400 leading-tight">
                Warning: Disabling live fetching will stop all proxy-related costs but may result in stale data for matches currently in progress.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
