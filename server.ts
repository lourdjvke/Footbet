import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import { JSDOM } from "jsdom";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import fallbackData from "./src/fallbackData.json" with { type: "json" };

const jar = new CookieJar();
const client = wrapper(axios.create({ 
  jar,
  withCredentials: true,
  timeout: 10000,
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
  const PORT = 3000;

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

  // API Route to fetch live events
  app.get("/api/live-events", async (req, res) => {
    // Perform a request via ScrapingAnt proxy
    const targetUrl = "https://www.sofascore.com/api/v1/sport/football/events/live";
    const apiKey = 'cdedd4e70b04473da8edcf42bd61f8e8';

    const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(targetUrl)}&x-api-key=${apiKey}&browser=true`;

    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`Attempting to fetch live-events via ScrapingAnt using fetch(): ${targetUrl} (Retries left: ${retries - 1})`);
        const response = await fetch(proxyUrl);
        const text = await response.text();

        if (response.status === 409) {
          // Concurrency limit reached, wait and retry
          console.log("ScrapingAnt 409 concurrency limit, retrying in 1s...");
          retries--;
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

        let jsonString = text;

        if (text.trim().startsWith('<')) {
            const dom = new JSDOM(text);
            const doc = dom.window.document;
            jsonString = doc.querySelector('pre')?.textContent || doc.body.textContent || text;
        }

        try {
            const data = JSON.parse(jsonString);
            if (response.status !== 200) {
                return res.status(response.status).json(data);
            }
            if (data && data.events) {
               console.log(`Successfully fetched ${data.events.length} events via proxy.`);
               return res.json(data);
            }
            return res.json(data);
        } catch (e: any) {
             console.error(`Failed to parse live events JSON: ${e.message}`);
             return res.status(500).json({ 
                 error: "JSON Parse Error", 
                 raw: jsonString.substring(0, 500)
             });
        }
      } catch (error: any) {
        if (retries <= 1) {
          console.error(`ScrapingAnt live events fetch failed: ${error.message}`);
          return res.status(500).json({ 
            error: `Network Error: ${error.message}`
          });
        }
        retries--;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  });

  app.get("/api/lineups/:id", async (req, res) => {
    const { id } = req.params;
    const targetUrl = `https://www.sofascore.com/api/v1/event/${id}/lineups`;
    const apiKey = 'cdedd4e70b04473da8edcf42bd61f8e8';
    const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(targetUrl)}&x-api-key=${apiKey}&browser=true`;

    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`Attempting to fetch lineups via ScrapingAnt using fetch(): ${targetUrl} (Retries left: ${retries - 1})`);
        const response = await fetch(proxyUrl);
        const text = await response.text();

        if (response.status === 409) {
          // Concurrency limit reached, wait and retry
          console.log("ScrapingAnt 409 concurrency limit, retrying in 1s...");
          retries--;
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

        let jsonString = text;

        // Strip HTML wrapper (ScrapingAnt's browser often returns JSON inside <pre> tags)
        if (text.trim().startsWith('<')) {
            const dom = new JSDOM(text);
            const doc = dom.window.document;
            jsonString = doc.querySelector('pre')?.textContent || doc.body.textContent || text;
        }

        try {
            const data = JSON.parse(jsonString);
            if (response.status !== 200) {
                return res.status(response.status).json(data);
            }
            return res.json(data);
        } catch (e: any) {
             console.error(`Failed to parse lineup JSON: ${e.message}`);
             return res.status(500).json({ 
                 error: "JSON Parse Error", 
                 raw: jsonString.substring(0, 500)
             });
        }
      } catch (error: any) {
        if (retries <= 1) {
          console.error(`ScrapingAnt lineups fetch failed: ${error.message}`);
          return res.status(500).json({ 
            error: `Network Error: ${error.message}`
          });
        }
        retries--;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  });

  app.get("/api/world-cup-events", async (req, res) => {
    const targetUrl = "https://www.sofascore.com/api/v1/unique-tournament/16/season/58210/events/round/1";
    const apiKey = 'cdedd4e70b04473da8edcf42bd61f8e8';
    const proxyUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(targetUrl)}&x-api-key=${apiKey}&browser=true`;

    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`Attempting to fetch World Cup events via ScrapingAnt: ${targetUrl}`);
        const response = await fetch(proxyUrl);
        const text = await response.text();

        if (response.status === 409) {
          retries--;
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

        let jsonString = text;
        if (text.trim().startsWith('<')) {
            const dom = new JSDOM(text);
            const doc = dom.window.document;
            jsonString = doc.querySelector('pre')?.textContent || doc.body.textContent || text;
        }

        try {
            const data = JSON.parse(jsonString);
            return res.json(data);
        } catch (e: any) {
             console.error(`Failed to parse World Cup JSON: ${e.message}`);
             return res.status(500).json({ error: "JSON Parse Error", raw: jsonString.substring(0, 500) });
        }
      } catch (error: any) {
        if (retries <= 1) return res.status(500).json({ error: `Network Error: ${error.message}` });
        retries--;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
