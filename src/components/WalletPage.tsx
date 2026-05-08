import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, ChevronRight, X, Minus } from "lucide-react";
import { cn } from "../lib/utils";

const DEPOSIT_HISTORY = [
  { id: 1, date: "12/02/23", type: "Deposit", method: "Visa", status: "Completed" },
  { id: 2, date: "12/02/23", type: "Deposit", method: "Visa", status: "Completed" },
  { id: 3, date: "12/02/23", type: "Deposit", method: "USDT", status: "Completed" },
  { id: 4, date: "13/09/23", type: "Deposit", method: "Visa", status: "Failed" },
  { id: 5, date: "13/02/23", type: "Deposit", method: "USDT", status: "Failed" },
  { id: 6, date: "13/05/23", type: "Deposit", method: "Visa", status: "Pending" }
];

const STAKE_HISTORY = [
  { id: 1, date: "23 Jun 2023", type: "Stake", method: "Wallet", status: "Won" },
  { id: 2, date: "23 Jun 2023", type: "Stake", method: "Wallet", status: "Won" },
  { id: 3, date: "23 Sep 2023", type: "Stake", method: "Wallet", status: "Lost" },
  { id: 4, date: "23 Sep 2023", type: "Stake", method: "Wallet", status: "Pending" },
];

export function WalletPage() {
  return (
    <div className="flex flex-col gap-6 relative min-h-full w-full pb-20 md:pb-0">
      {/* Background Image Setup */}
      <div className="fixed inset-0 z-0 pointer-events-none w-screen h-screen">
         <img 
           src="https://iili.io/BtoaQnf.png" 
           alt="Stadium Background" 
           className="w-full h-full object-cover opacity-80"
         />
         {/* Gradient fade and tinted edges */}
         <div className="absolute inset-0 bg-[#161618]/70" />
         <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#161618] to-transparent" />
         <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-[#161618] via-[#161618]/80 to-transparent" />
         <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#161618] to-transparent" />
         <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-[#161618] to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 h-full w-full px-2 sm:px-6 py-4 md:py-0">
         <div className="flex flex-col gap-1 px-2 md:px-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Wallet Dashboard</h1>
            <p className="text-text-muted text-sm md:border-b border-white/5 pb-4">Manage funds and view transaction history.</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Balance Card - First on Mobile */}
            <div className="lg:col-span-1 bg-transparent md:bg-gradient-to-br from-white/10 to-white/5 md:backdrop-blur-xl md:border border-white/10 md:rounded-[28px] md:p-8 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:scale-[1.01] transition-transform">
               {/* Decorative light */}
               <div className="hidden md:block absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
               <span className="text-text-muted font-medium mb-2 uppercase tracking-widest text-xs relative z-10">Current Balance</span>
               <span className="text-5xl font-display font-black text-white tracking-tight mb-8 relative z-10 drop-shadow-xl">$14,500.20</span>
               <div className="flex gap-4 w-full relative z-10">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl transition-all">Deposit</button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-2xl transition-all border border-white/5">Withdraw</button>
               </div>
            </div>

            {/* Deposit History */}
            <div className="lg:col-span-2 md:border md:border-white/5 md:bg-white/5 md:backdrop-blur-xl md:rounded-[24px] overflow-hidden flex flex-col pt-4 md:p-6">
               <h3 className="text-lg font-bold mb-4 px-2 md:px-0">Deposit History</h3>
               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead>
                        <tr className="text-text-muted border-b border-white/5 text-xs">
                           <th className="pb-3 px-2 md:px-4 font-medium">Date</th>
                           <th className="pb-3 px-2 md:px-4 font-medium">Type</th>
                           <th className="pb-3 px-2 md:px-4 font-medium">Payment Method</th>
                           <th className="pb-3 px-2 md:px-4 font-medium text-right">Status</th>
                        </tr>
                     </thead>
                     <tbody>
                        {DEPOSIT_HISTORY.map((tx) => (
                           <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                              <td className="py-3 px-2 md:px-4 font-medium text-white/90 text-xs">{tx.date}</td>
                              <td className="py-3 px-2 md:px-4 text-white/70 text-xs">{tx.type}</td>
                              <td className="py-3 px-2 md:px-4 text-white/70 text-xs">{tx.method}</td>
                              <td className="py-3 px-2 md:px-4 text-right">
                                 <div className="flex items-center justify-end gap-1.5">
                                    {tx.status === 'Completed' ? (
                                       <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shrink-0"><svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                                    ) : tx.status === 'Failed' ? (
                                       <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0"><X className="w-2.5 h-2.5" strokeWidth={3} /></div>
                                    ) : (
                                       <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0"><Minus className="w-2.5 h-2.5" strokeWidth={3} /></div>
                                    )}
                                    <span className={cn("text-xs font-semibold", tx.status === 'Completed' ? "text-green-500" : tx.status === 'Failed' ? "text-red-500" : "text-orange-500")}>{tx.status}</span>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Stake History */}
         <div className="md:border md:border-white/5 md:bg-white/5 md:backdrop-blur-xl md:rounded-[24px] overflow-hidden flex flex-col pt-4 md:p-6 mb-8 lg:mb-0">
            <h3 className="text-lg font-bold mb-4 px-2 md:px-0">Stake History</h3>
            <div className="overflow-x-auto h-full">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                     <tr className="text-text-muted border-b border-white/5 text-xs">
                        <th className="pb-3 px-2 md:px-4 font-medium">Date</th>
                        <th className="pb-3 px-2 md:px-4 font-medium">Type</th>
                        <th className="pb-3 px-2 md:px-4 font-medium">Payment Method</th>
                        <th className="pb-3 px-2 md:px-4 font-medium text-right">Status</th>
                     </tr>
                  </thead>
                  <tbody>
                     {STAKE_HISTORY.map((tx) => (
                        <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                           <td className="py-4 px-2 md:px-4 font-medium text-white/90 text-xs">{tx.date}</td>
                           <td className="py-4 px-2 md:px-4 text-white/70 text-xs">{tx.type}</td>
                           <td className="py-4 px-2 md:px-4 text-white/70 flex items-center gap-2 text-xs">
                              {tx.method}
                              <svg className="w-16 h-4 ml-4 opacity-70" viewBox="0 0 60 16" fill="none" preserveAspectRatio="none">
                                 <path d={tx.status === 'Won' ? "M0 12 Q 10 5, 20 8 T 40 4 T 60 6" : tx.status === 'Lost' ? "M0 4 Q 10 12, 20 8 T 40 14 T 60 10" : "M0 8 L 60 8"} stroke={tx.status === 'Won' ? "#22c55e" : tx.status === 'Lost' ? "#ef4444" : "#f97316"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                           </td>
                           <td className="py-4 px-2 md:px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                 {tx.status === 'Won' ? (
                                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shrink-0"><svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                                 ) : tx.status === 'Lost' ? (
                                    <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0"><X className="w-2.5 h-2.5" strokeWidth={3} /></div>
                                 ) : (
                                    <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0"><Minus className="w-2.5 h-2.5" strokeWidth={3} /></div>
                                 )}
                                 <span className={cn("text-xs font-semibold", tx.status === 'Won' ? "text-green-500" : tx.status === 'Lost' ? "text-red-500" : "text-orange-500")}>{tx.status}</span>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
