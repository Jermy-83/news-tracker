const http = require("http");
const fs = require("fs");
const path = require("path");
const { createNewsService } = require("./news-monitor");

const root = __dirname;

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

function createAppServer({ port = Number(process.env.PORT || 3180) } = {}) {
  const newsService = createNewsService();
  let started = false;

  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);

    if (requestUrl.pathname === "/api/news/watchlists") {
      sendJson(res, 200, { watchlists: newsService.getWatchlists() });
      return;
    }

    if (requestUrl.pathname === "/api/news/status") {
      const watchlist = requestUrl.searchParams.get("watchlist") || "xauusd";
      sendJson(res, 200, { status: newsService.getStatus(watchlist) });
      return;
    }

    if (requestUrl.pathname === "/api/news/items") {
      const watchlist = requestUrl.searchParams.get("watchlist") || "xauusd";
      const limit = requestUrl.searchParams.get("limit");
      const minScore = requestUrl.searchParams.get("minScore") || "4";
      const maxAgeHours = requestUrl.searchParams.get("maxAgeHours");
      const signalMode = requestUrl.searchParams.get("signalMode");
      const sourceMode = requestUrl.searchParams.get("sourceMode");
      const tradingMode = requestUrl.searchParams.get("tradingMode");
      sendJson(res, 200, {
        items: newsService.getItems(watchlist, { limit, minScore, maxAgeHours, signalMode, sourceMode, tradingMode }),
      });
      return;
    }

    if (requestUrl.pathname === "/api/market/reaction") {
      const watchlist = requestUrl.searchParams.get("watchlist") || "xauusd";
      newsService
        .getMarketReaction(watchlist)
        .then((reaction) => {
          sendJson(res, 200, { reaction });
        })
        .catch((error) => {
          sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return;
    }

    if (requestUrl.pathname === "/api/market/gold-hour") {
      const watchlist = requestUrl.searchParams.get("watchlist") || "xauusd";
      newsService
        .getGoldHour(watchlist)
        .then((goldHour) => {
          sendJson(res, 200, { goldHour });
        })
        .catch((error) => {
          sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return;
    }

    if (requestUrl.pathname === "/api/market/estimates") {
      const watchlist = requestUrl.searchParams.get("watchlist") || "xauusd";
      const limit = requestUrl.searchParams.get("limit") || "100";
      sendJson(res, 200, { estimates: newsService.getEstimateLog(watchlist, { limit }) });
      return;
    }

    if (requestUrl.pathname === "/api/market/gold-summary") {
      const watchlist = requestUrl.searchParams.get("watchlist") || "xauusd";
      const hours = requestUrl.searchParams.get("hours") || "4";
      newsService
        .getGoldSummary(watchlist, { hours })
        .then((goldSummary) => {
          sendJson(res, 200, { goldSummary });
        })
        .catch((error) => {
          sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return;
    }

    if (requestUrl.pathname === "/api/news/reaction") {
      const watchlist = requestUrl.searchParams.get("watchlist") || "xauusd";
      const key = requestUrl.searchParams.get("key") || "";
      newsService
        .getHeadlineReaction(watchlist, key)
        .then((reaction) => {
          sendJson(res, 200, { reaction });
        })
        .catch((error) => {
          sendJson(res, 404, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return;
    }

    if (requestUrl.pathname === "/api/news/catalysts") {
      const watchlist = requestUrl.searchParams.get("watchlist") || "xauusd";
      const hours = requestUrl.searchParams.get("hours") || "168";
      newsService
        .getCatalysts(watchlist, { hours })
        .then((catalysts) => {
          sendJson(res, 200, { catalysts });
        })
        .catch((error) => {
          sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
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
      const watchlist = requestUrl.searchParams.get("watchlist") || "xauusd";
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

  async function start() {
    if (started) {
      return server;
    }

    newsService.start();

    await new Promise((resolve, reject) => {
      const onError = (error) => {
        server.off("listening", onListening);
        newsService.stop();
        reject(error);
      };

      const onListening = () => {
        server.off("error", onError);
        started = true;
        resolve();
      };

      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port, "127.0.0.1");
    });

    return server;
  }

  async function stop() {
    if (!started) {
      newsService.stop();
      return;
    }

    await new Promise((resolve) => {
      server.close(() => resolve());
    });

    newsService.stop();
    started = false;
  }

  return {
    port,
    server,
    start,
    stop,
  };
}

async function startServer(options = {}) {
  const appServer = createAppServer(options);
  await appServer.start();
  console.log(`Candlestick Lab running at http://127.0.0.1:${appServer.port}`);
  return appServer;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

module.exports = {
  createAppServer,
  startServer,
};
