const http = require("http");
const fs = require("fs");
const os = require("os");
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

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function notificationConfigCandidates() {
  const candidates = [];
  const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
  const execDir = process.execPath ? path.dirname(process.execPath) : "";
  const cwdDir = process.cwd();
  const appDataDir = process.env.APPDATA ? path.join(process.env.APPDATA, "Market Intelligence Desk") : "";
  const homeConfigDir = path.join(os.homedir(), ".market-intelligence-desk");

  if (portableDir) {
    candidates.push(path.join(portableDir, "phone-notify.json"));
  }
  if (execDir) {
    candidates.push(path.join(execDir, "phone-notify.json"));
  }
  if (cwdDir) {
    candidates.push(path.join(cwdDir, "phone-notify.json"));
  }
  if (appDataDir) {
    candidates.push(path.join(appDataDir, "phone-notify.json"));
  }
  candidates.push(path.join(homeConfigDir, "phone-notify.json"));
  candidates.push(path.join(root, "phone-notify.json"));

  return Array.from(new Set(candidates.filter(Boolean)));
}

function loadPhoneNotificationConfig() {
  const envTopic = String(process.env.NTFY_TOPIC || "").trim();
  if (envTopic) {
    return {
      enabled: process.env.PHONE_NOTIFY_ENABLED !== "0",
      provider: "ntfy",
      server: String(process.env.NTFY_SERVER || "https://ntfy.sh").trim(),
      topic: envTopic,
      token: String(process.env.NTFY_TOKEN || "").trim(),
      clickBaseUrl: String(process.env.NTFY_CLICK_BASE_URL || "").trim(),
      configPath: "environment",
    };
  }

  const configPath = notificationConfigCandidates().find((candidate) => fs.existsSync(candidate));
  if (!configPath) {
    return {
      enabled: false,
      provider: "",
      server: "",
      topic: "",
      token: "",
      clickBaseUrl: "",
      configPath: "",
    };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return {
      enabled: raw.enabled !== false,
      provider: String(raw.provider || "ntfy").toLowerCase(),
      server: String(raw.server || "https://ntfy.sh").trim(),
      topic: String(raw.topic || "").trim(),
      token: String(raw.token || "").trim(),
      clickBaseUrl: String(raw.clickBaseUrl || "").trim(),
      configPath,
    };
  } catch (error) {
    throw new Error(`Phone notification config is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function sendNtfyNotification(config, payload) {
  const topic = String(config.topic || "").trim();
  if (!topic) {
    throw new Error("ntfy topic is missing");
  }

  const server = String(config.server || "https://ntfy.sh").replace(/\/+$/, "");
  const message = String(payload.message || "").trim();
  if (!message) {
    throw new Error("notification message is missing");
  }

  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
  };

  const title = String(payload.title || "").trim();
  if (title) {
    headers.Title = title;
  }

  const priority = String(payload.priority || "default").trim();
  if (priority) {
    headers.Priority = priority;
  }

  const tags = Array.isArray(payload.tags) ? payload.tags.filter(Boolean).join(",") : String(payload.tags || "").trim();
  if (tags) {
    headers.Tags = tags;
  }

  const click = String(payload.click || "").trim();
  if (click) {
    headers.Click = click;
  }

  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  const response = await fetch(`${server}/${encodeURIComponent(topic)}`, {
    method: "POST",
    headers,
    body: message,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`ntfy returned ${response.status}${text ? `: ${text}` : ""}`);
  }

  return {
    ok: true,
    provider: "ntfy",
    topic,
    server,
  };
}

async function sendPhoneNotification(payload) {
  const config = loadPhoneNotificationConfig();
  if (!config.enabled) {
    return {
      ok: false,
      skipped: true,
      reason: "Phone notifications are not enabled",
      configPath: config.configPath,
    };
  }

  if (config.provider !== "ntfy") {
    throw new Error(`Unsupported phone notification provider: ${config.provider}`);
  }

  const click =
    String(payload.click || "").trim() ||
    (config.clickBaseUrl && payload.itemKey ? `${config.clickBaseUrl.replace(/\/+$/, "")}/?headline=${encodeURIComponent(payload.itemKey)}` : "");

  const result = await sendNtfyNotification(config, {
    ...payload,
    click,
  });

  return {
    ...result,
    configPath: config.configPath,
  };
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

    if (requestUrl.pathname === "/api/phone/notify" && req.method === "POST") {
      readRequestBody(req)
        .then((body) => {
          const payload = body ? JSON.parse(body) : {};
          return sendPhoneNotification(payload);
        })
        .then((result) => {
          sendJson(res, 200, result);
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
