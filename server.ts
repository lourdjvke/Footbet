import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  const API_KEY = "f29d4c662ac81ed3a744727739add7a4a55e655c566695265112a2c9527bb7fb";

  // Proxy route for football data to avoid CORS
  app.get("/api/football", async (req, res) => {
    try {
      const { action, ...params } = req.query;
      if (!action) return res.status(400).json({ error: "Action is required" });

      const searchParams = new URLSearchParams();
      searchParams.append("action", action as string);
      searchParams.append("APIkey", API_KEY);
      
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value as string);
      });

      const apiUrl = `https://apiv3.apifootball.com/?${searchParams.toString()}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        console.error(`API response not ok: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ error: `API responded with ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch data from football API" });
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

startServer();
