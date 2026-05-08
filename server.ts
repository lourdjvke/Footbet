import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { JSDOM } from "jsdom";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, get, set, child } from "firebase/database";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Use global fetch if available (Node 18+), otherwise fallback to node-fetch if needed
const safeFetch = async (url: string, init?: RequestInit) => {
  try {
    const response = await fetch(url, init);
    return response;
  } catch (err: any) {
    console.error(`[FETCH ERROR] ${url}:`, err.message);
    throw err;
  }
};

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBIQm_Ux_JuO66_C4WNv7FG0Oa8KixMtI0",
  authDomain: "footbet-cda52.firebaseapp.com",
  databaseURL: "https://footbet-cda52-default-rtdb.firebaseio.com",
  projectId: "footbet-cda52",
  storageBucket: "footbet-cda52.firebasestorage.app",
  messagingSenderId: "577865489482",
  appId: "1:577865489482:web:4260f2e8dedfa7d4cd1ab3",
  measurementId: "G-SJPMT1B4RC"
};

// Initialize Firebase once
const fbApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const rtdb = getDatabase(fbApp);

// Load fallback data safely
let fallbackData: any = { events: [] };
try {
  const fallbackPath = path.join(process.cwd(), "src/fallbackData.json");
  if (fs.existsSync(fallbackPath)) {
    fallbackData = JSON.parse(fs.readFileSync(fallbackPath, "utf-8"));
  }
} catch (e) {
  console.warn("[SERVER] Local fallback data could not be loaded.");
}

const SA_KEYS = [
  'cdedd4e70b04473da8edcf42bd61f8e8',
  '7f4d22a03c124eb19393193cdb64a0b5',
  'c5bb7bf7b5ff486ba01971e9b6e4bdf9',
  '2ae942f3dd7a4e9a83a01c2c19c129de',
  '34d0176ca84f46d1bb371c9971e28cee',
  '02a5775276be4409ba96a8e067ff4f8b',
  '1adbca1960524ab1b61aec3bf5f8c6ff',
  '1b24542a9b8d4027aaa2927ae332c79b'
];

let lastSaKeyIdx = -1;
function getRandomSaKey() {
  let idx = Math.floor(Math.random() * SA_KEYS.length);
  if (idx === lastSaKeyIdx && SA_KEYS.length > 1) idx = (idx + 1) % SA_KEYS.length;
  lastSaKeyIdx = idx;
  return SA_KEYS[idx];
}

/**
 * Robust fetcher with caching in Firebase RTDB
 */
async function fetchWithCacheAndProxy(
    targetUrl: string, 
    cachePath: string, 
    cacheTtlMs: number,
    fallback?: () => Promise<any>
) {
  const cacheRef = ref(rtdb, cachePath);
  
  // 1. Try to read from cache first
  try {
    const snapshot = await get(cacheRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const now = Date.now();
      if (now - data.timestamp < cacheTtlMs) {
        console.log(`[CACHE HIT] ${cachePath}`);
        return data.payload;
      }
      console.log(`[CACHE EXPIRED] ${cachePath}`);
    }
  } catch (err) {
    console.warn(`[CACHE READ ERROR] ${cachePath}:`, err);
  }

  // 2. Attempt fetching (Direct or Proxy)
  let successData = null;

  // Direct fetch attempt (Sofascore only)
  if (targetUrl.includes("sofascore.com")) {
     try {
        console.log(`[DIRECT] Attempting direct fetch: ${targetUrl}`);
        const directRes = await client.get(targetUrl);
        if (directRes.status === 200 && directRes.data) {
           successData = directRes.data;
           console.log(`[DIRECT SUCCESS] ${targetUrl}`);
        }
     } catch (e: any) {
        console.warn(`[DIRECT FAILED] ${targetUrl}: ${e.message}`);
     }
  }

  // Proxy fetch attempt if direct failed
  if (!successData) {
    let retries = 2;
    while (retries > 0) {
      const apiKey = getRandomSaKey();
      const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(targetUrl)}&x-api-key=${apiKey}&browser=true`;
      
      try {
        console.log(`[SCRAPE] Fetching via ScrapingAnt (Key: ${apiKey.substring(0,4)}...)`);
        const response = await safeFetch(proxyUrl);
        const text = await response.text();
        
        if (response.status === 200) {
          let jsonString = text;
          if (text.includes('<html') || text.includes('<!DOCTYPE')) {
            const dom = new JSDOM(text);
            jsonString = dom.window.document.querySelector('pre')?.textContent || dom.window.document.body.textContent || text;
          }
          
          try {
            const parsed = JSON.parse(jsonString.trim());
            if (parsed) {
               successData = parsed;
               break; 
            }
          } catch (e) {}
        }
      } catch (e) {}
      retries--;
    }
  }

  // 3. Last resort fallback
  if (!successData && fallback) {
     console.log(`[FALLBACK] Attempting custom fallback for ${cachePath}`);
     successData = await fallback();
  }

  // 4. Update cache if we got data
  if (successData) {
    try {
      await set(cacheRef, { timestamp: Date.now(), payload: successData });
    } catch (err) {
      console.warn(`[CACHE WRITE ERROR] ${cachePath}:`, err);
    }
    return successData;
  }
  
  return null;
}

const jar = new CookieJar();
const client = wrapper(axios.create({ 
  jar, withCredentials: true, timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Cache-Control": "no-cache"
  }
}));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize session immediately
  (async () => {
    try {
      await client.get("https://www.sofascore.com/");
      console.log("[SESSION] Sofascore initialized.");
    } catch (e) {}
  })();

  // Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV, firebase: !!rtdb });
  });

  // API Route to fetch live events
  app.get("/api/live-events", async (req, res) => {
    const targetUrl = "https://www.sofascore.com/api/v1/sport/football/events/live";
    const cacheTtlMs = 15 * 60 * 1000; // 15 mins

    // Sub-fallback using API-Football
    const tryFootballApiFallback = async () => {
       const footballApiKey = "f29d4c662ac81ed3a744727739add7a4a55e655c566695265112a2c9527bb7fb";
       try {
          const fbRes = await safeFetch(`https://apiv3.apifootball.com/?action=get_events&match_live=1&APIkey=${footballApiKey}`);
          if (fbRes.ok) {
             const fbData = await fbRes.json();
             if (Array.isArray(fbData)) {
                return {
                  events: fbData.map(m => ({
                     id: m.match_id,
                     homeTeam: { id: m.match_hometeam_id, name: m.match_hometeam_name, shortName: m.match_hometeam_name.substring(0,3).toUpperCase() },
                     awayTeam: { id: m.match_awayteam_id, name: m.match_awayteam_name, shortName: m.match_awayteam_name.substring(0,3).toUpperCase() },
                     homeScore: { current: Number(m.match_hometeam_score) },
                     awayScore: { current: Number(m.match_awayteam_score) },
                     status: { type: 'inprogress', description: m.match_status },
                     startTimestamp: Math.floor(new Date(m.match_date + ' ' + m.match_time).getTime() / 1000)
                  }))
                };
             }
          }
       } catch (e) {}
       return { events: [] };
    };

    try {
      const data = await fetchWithCacheAndProxy(targetUrl, "liveEvents", cacheTtlMs, tryFootballApiFallback);
      res.json(data || { events: [] });
    } catch (e) {
      res.json({ events: [], status: "error" });
    }
  });

  // World Cup events
  app.get("/api/world-cup-events", async (req, res) => {
    const targetUrl = "https://www.sofascore.com/api/v1/unique-tournament/16/season/58210/events/round/1";
    try {
      const data = await fetchWithCacheAndProxy(targetUrl, "worldCupEvents", 24 * 60 * 60 * 1000);
      res.json(data || { events: [] });
    } catch (e) {
      res.json({ events: [] });
    }
  });

  // Proxy for API-Football
  app.get("/api/football", async (req, res) => {
    const API_KEY = "f29d4c662ac81ed3a744727739add7a4a55e655c566695265112a2c9527bb7fb";
    const queryString = new URLSearchParams(req.query as any).toString();
    const url = `https://apiv3.apifootball.com/?${queryString}&APIkey=${API_KEY}`;
    
    try {
      const response = await safeFetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lineups/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const data = await fetchWithCacheAndProxy(`https://www.sofascore.com/api/v1/event/${id}/lineups`, `lineups/${id}`, 24 * 60 * 60 * 1000);
      res.json(data || {});
    } catch (e) {
      res.json({});
    }
  });

  // Serve frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
