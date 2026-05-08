import { ref, get, set } from "firebase/database";
import { rtdb } from "./firebase";

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

export async function fetchWithCacheAndProxy(
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

  let staleData = null;
  try {
    const snapshot = await get(cacheRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      staleData = data.payload;
      const now = Date.now();
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

  if (!isLiveEnabled) {
    console.log(`[SCRAPE SKIPPED] Live fetching is disabled via admin.`);
    return staleData;
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
      
      // Clean up text if ScrapingAnt returns HTML wrapped JSON
      if (text.trim().startsWith('<')) {
        // Browser environment: use DOMParser
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        jsonString = doc.querySelector('pre')?.textContent || doc.body.textContent || text;
      }
      
      try {
        const parsed = JSON.parse(jsonString);
        if (response.status === 200) {
           successData = parsed;
           break; 
        }
      } catch (e: any) {
        console.error(`[SCRAPE] JSON parse err: ${e.message}`, jsonString.substring(0, 100));
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
    // Only try to save to RTDB if we are on the server (Node.js environment)
    const isServer = typeof process !== 'undefined' && process.release && process.release.name === 'node';
    if (isServer) {
      try {
        await set(cacheRef, { timestamp: Date.now(), payload: successData });
        console.log(`[CACHE SAVED] ${cachePath}`);
      } catch (err) {
        console.error(`[CACHE ERROR] Failed saving ${cachePath}:`, err);
      }
    }
    return successData;
  }
  
  return staleData; // Return stale data if live scrape and fallback both fail
}
