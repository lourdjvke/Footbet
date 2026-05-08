import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { JSDOM } from "jsdom";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set } from "firebase/database";
import fs from "fs";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

const fallbackDataPath = path.join(process.cwd(), "src/fallbackData.json");
let fallbackData = { events: [] };
try {
  if (fs.existsSync(fallbackDataPath)) {
    fallbackData = JSON.parse(fs.readFileSync(fallbackDataPath, "utf-8"));
  }
} catch (e) {
  console.error("[INIT ERROR] Failed to load fallbackData.json", e);
}

const firebaseConfig = {
  apiKey: "AIzaSyBIQm_Ux_JuO66_C4WNv7FG0Oa8KixMtI0",
  authDomain: "footbet-cda52.firebaseapp.com",
  databaseURL: "https://footbet-cda52-default-rtdb.firebaseio.com",
  projectId: "footbet-cda52",
  storageBucket: "footbet-cda52.firebasestorage.app",
  messagingSenderId: "577865489482",
  appId: "1:577865489482:web:4260f2e8dedfa7d4cd1ab3",
  measurementId: "G-SJPMT1B4RC"
};

// Initialize Firebase with basic error handling
let rtdb: any = null;
try {
  const fbApp = initializeApp(firebaseConfig);
  rtdb = getDatabase(fbApp);
  console.log("[FIREBASE] RTDB Initialized");
} catch (e) {
  console.error("[FIREBASE] Initialization Error:", e);
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
  while (idx === lastSaKeyIdx && SA_KEYS.length > 1) {
    idx = Math.floor(Math.random() * SA_KEYS.length);
  }
  lastSaKeyIdx = idx;
  return SA_KEYS[idx];
}

async function fetchWithCacheAndProxy(
    targetUrl: string, 
    cachePath: string, 
    cacheTtlMs: number,
    fallback?: () => Promise<any>
) {
  if (!rtdb) {
    console.warn(`[CACHE] RTDB not available. Falling back to direct fetch/scrape.`);
    if (fallback) return await fallback();
    return null;
  }

  const cacheRef = ref(rtdb, cachePath);
  const settingsRef = ref(rtdb, "settings/isLiveFetchingEnabled");
  
  let isLiveEnabled = true;
  try {
    const settingsSnap = await get(settingsRef);
    if (settingsSnap.exists()) {
      isLiveEnabled = settingsSnap.val();
    }
  } catch (err) {
    console.error("[SETTINGS ERROR] Failed to check fetching status:", err);
  }

  try {
    const snapshot = await get(cacheRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const now = Date.now();
      // If live is disabled, we return the cache regardless of TTL
      if (!isLiveEnabled || (now - data.timestamp < cacheTtlMs)) {
        console.log(`[CACHE HIT] ${cachePath}${!isLiveEnabled ? " (FORCED)" : ""}`);
        return data.payload;
      }
      console.log(`[CACHE EXPIRED] ${cachePath}`);
    } else {
      console.log(`[CACHE MISS] ${cachePath}`);
    }
  } catch (err) {
    console.error(`[CACHE ERROR] Failed reading ${cachePath}:`, err);
  }

  // If live fetching is disabled, we do NOT proceed to scraping if cache miss/expired
  if (!isLiveEnabled) {
    console.log(`[SCRAPE SKIPPED] Live fetching is disabled via admin.`);
    return null;
  }
  
  let successData = null;
  let retries = 3;
  
  while (retries > 0) {
    const apiKey = getRandomSaKey();
    const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(targetUrl)}&x-api-key=${apiKey}&browser=true`;
    
    try {
      console.log(`[SCRAPE] Fetching ${targetUrl} with key ${apiKey.substring(0,6)}...`);
      const response = await fetch(proxyUrl);
      const text = await response.text();
      
      if (response.status === 409 || response.status === 429) {
        console.warn(`[SCRAPE] HTTP ${response.status} limit hit.`);
        retries--;
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      if (response.status === 403 || response.status === 401) {
        console.warn(`[SCRAPE] HTTP ${response.status} blocked or bad key.`);
        retries--;
        continue;
      }
      
      let jsonString = text;
      if (text.trim().startsWith('<')) {
        const dom = new JSDOM(text);
        const doc = dom.window.document;
        jsonString = doc.querySelector('pre')?.textContent || doc.body.textContent || text;
      }
      
      try {
        const parsed = JSON.parse(jsonString);
        if (response.status === 200) {
           successData = parsed;
           break; 
        }
      } catch (e: any) {
        console.error(`[SCRAPE] JSON parse err: ${e.message}`);
      }
      
      retries--;
      await new Promise(r => setTimeout(r, 1000));
    } catch (e: any) {
      console.error(`[SCRAPE] Error: ${e.message}`);
      retries--;
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!successData && fallback) {
     console.log(`[SCRAPE] All ScrapingAnt retries failed. Attempting fallback...`);
     successData = await fallback();
  }

  if (successData && rtdb) {
    try {
      await set(cacheRef, { timestamp: Date.now(), payload: successData });
      console.log(`[CACHE SAVED] ${cachePath}`);
    } catch (err) {
      console.error(`[CACHE ERROR] Failed saving ${cachePath}:`, err);
    }
    return successData;
  }
  
  return successData;
}

const jar = new CookieJar();
const client = wrapper(axios.create({ 
  jar,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "max-age=0",
    "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1"
  }
}));

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  let sessionInitialized = false;
  const initializeSession = async () => {
    if (sessionInitialized) return;
    try {
      console.log("Initializing Sofascore session...");
      await client.get("https://www.sofascore.com/");
      sessionInitialized = true;
      console.log("Session initialized.");
    } catch (e) {
      console.error("Failed to initialize Sofascore session");
    }
  };

  // Start initialization in background
  initializeSession();

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || "development",
      port: PORT,
      firebaseReady: !!rtdb
    });
  });

  // API Route to fetch live events
  app.get("/api/live-events", async (req, res) => {
    const targetUrl = "https://www.sofascore.com/api/v1/sport/football/events/live";
    const cachePath = "liveEvents";
    const cacheTtlMs = 15 * 60 * 1000; // 15 minutes

    const tryFootballApiFallback = async () => {
       const footballApiKey = "f29d4c662ac81ed3a744727739add7a4a55e655c566695265112a2c9527bb7fb";
       try {
          console.log("[LIVE-EVENTS] Falling back to Football-API for live matches...");
          const fbRes = await fetch(`https://apiv3.apifootball.com/?action=get_events&match_live=1&APIkey=${footballApiKey}`);
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
       } catch (e) {
          console.error("[LIVE-EVENTS] Football-API fallback failed", e);
       }
       return { events: [] };
    };

    try {
      const data = await fetchWithCacheAndProxy(targetUrl, cachePath, cacheTtlMs, tryFootballApiFallback);
      if (data) {
        return res.json(data);
      }
      return res.status(500).json({ error: "Failed to fetch events" });
    } catch (e: any) {
      console.error("[LIVE-EVENTS] Controller error:", e.message);
      return res.status(500).json({ error: e.message });
    }
  });

  // Proxy for API-Football
  app.get("/api/football", async (req, res) => {
    const API_KEY = "f29d4c662ac81ed3a744727739add7a4a55e655c566695265112a2c9527bb7fb";
    const queryString = new URLSearchParams(req.query as any).toString();
    const url = `https://apiv3.apifootball.com/?${queryString}&APIkey=${API_KEY}`;
    
    try {
      console.log(`[FOOTBALL-API] Fetching: ${url}`);
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      return res.json(data);
    } catch (error: any) {
      console.error(`[FOOTBALL-API] Fetch Error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/lineups/:id", async (req, res) => {
    const { id } = req.params;
    const targetUrl = `https://www.sofascore.com/api/v1/event/${id}/lineups`;
    const cachePath = `lineups/${id}`;
    const cacheTtlMs = 24 * 60 * 60 * 1000; // 24 hours

    try {
      const data = await fetchWithCacheAndProxy(targetUrl, cachePath, cacheTtlMs);
      if (data) {
        return res.json(data);
      }
      return res.json({}); 
    } catch (e: any) {
      console.error(`[LINEUPS] Controller error for ${id}:`, e.message);
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/world-cup-events", async (req, res) => {
    const targetUrl = "https://www.sofascore.com/api/v1/unique-tournament/16/season/58210/events/round/1";
    const cachePath = "worldCupEvents";
    const cacheTtlMs = 24 * 60 * 60 * 1000; // 24 hours

    try {
      const data = await fetchWithCacheAndProxy(targetUrl, cachePath, cacheTtlMs);
      if (data) {
        return res.json(data);
      }
      return res.json({ events: [] });
    } catch (e: any) {
      console.error("[WORLD-CUP] Controller error:", e.message);
      return res.status(500).json({ error: e.message });
    }
  });

  // Serve static files from dist
  const distPath = path.resolve(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
    console.log(`[STATIC] Serving from: ${distPath}`);
    app.use(express.static(distPath));
    const indexHtml = path.join(distPath, "index.html");
    app.get("*", (req, res, next) => {
      // Don't intercept /api routes
      if (req.url.startsWith("/api")) return next();
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        next();
      }
    });
  } else {
    console.warn(`[STATIC] Warning: dist folder not found at ${distPath}. Run 'npm run build' first.`);
    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("[SERVER FATAL ERROR]", err);
  process.exit(1);
});

