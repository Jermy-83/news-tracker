const http = require("http");
const fs = require("fs");
const path = require("path");
const { createNewsService } = require("./news-monitor");

const root = __dirname;
const port = Number(process.env.PORT || 3180);
const newsService = createNewsService();
newsService.start();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

function safePath(urlPath) {
  const clean = decodeURIComponent(String(urlPath || "/").split("?")[0]);
  const requested = clean === "/" ? "/index.html" : clean;
  const resolved = path.normalize(path.join(root, requested));
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);

  if (requestUrl.pathname === "/api/news/watchlists") {
    sendJson(res, 200, { watchlists: newsService.getWatchlists() });
    return;
  }

  if (requestUrl.pathname === "/api/news/status") {
    const watchlist = requestUrl.searchParams.get("watchlist") || "nasdaq";
    sendJson(res, 200, { status: newsService.getStatus(watchlist) });
    return;
  }

  if (requestUrl.pathname === "/api/news/items") {
    const watchlist = requestUrl.searchParams.get("watchlist") || "nasdaq";
    const limit = requestUrl.searchParams.get("limit") || "24";
    const minScore = requestUrl.searchParams.get("minScore") || "4";
    sendJson(res, 200, {
      items: newsService.getItems(watchlist, { limit, minScore }),
    });
    return;
  }

  if (requestUrl.pathname === "/api/news/detail") {
    const watchlist = requestUrl.searchParams.get("watchlist") || "xauusd";
    const key = requestUrl.searchParams.get("key") || "";
    newsService
      .getDetail(watchlist, key)
      .then((detail) => {
        sendJson(res, 200, { detail });
      })
      .catch((error) => {
        sendJson(res, 404, {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return;
  }

  if (requestUrl.pathname === "/api/news/refresh") {
    const watchlist = requestUrl.searchParams.get("watchlist") || "nasdaq";
    newsService
      .refresh(watchlist)
      .then(() => {
        sendJson(res, 200, {
          ok: true,
          status: newsService.getStatus(watchlist),
        });
      })
      .catch((error) => {
        sendJson(res, 500, {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return;
  }

  const filePath = safePath(req.url);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Server error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Candlestick Lab running at http://127.0.0.1:${port}`);
});
