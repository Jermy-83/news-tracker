(function () {
  const watchlistSelect = document.getElementById("newsWatchlistSelect");
  const minScoreField = document.getElementById("newsMinScoreField");
  const minScoreDot = document.getElementById("newsMinScoreDot");
  const minScoreSelect = document.getElementById("newsMinScoreSelect");
  const timelinessSelect = document.getElementById("newsTimelinessSelect");
  const newsTypeSelect = document.getElementById("newsTypeSelect");
  const sortSelect = document.getElementById("newsSortSelect");
  const notificationSoundBtn = document.getElementById("notificationSoundBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeToggleLabel = document.getElementById("themeToggleLabel");
  const refreshBtn = document.getElementById("newsRefreshBtn");
  const statusPill = document.getElementById("newsStatusPill");
  const deskTitle = document.getElementById("newsDeskTitle");
  const deskDescription = document.getElementById("newsDeskDescription");
  const visibleBtn = document.getElementById("newsVisibleBtn");
  const freshBtn = document.getElementById("newsFreshBtn");
  const symbolsCount = document.getElementById("newsSymbolsCount");
  const trackedCount = document.getElementById("newsTrackedCount");
  const freshCount = document.getElementById("newsFreshCount");
  const lastCheckLabel = document.getElementById("newsLastCheckLabel");
  const feedCount = document.getElementById("newsFeedCount");
  const feedSummary = document.getElementById("newsFeedSummary");
  const feedList = document.getElementById("newsFeedList");
  const errorBox = document.getElementById("newsErrorBox");
  const listRoot = document.getElementById("newsList");
  const emptyState = document.getElementById("newsEmptyState");
  const tradeChecklist = document.getElementById("tradeChecklist");
  const goldProjectionBox = document.getElementById("goldProjectionBox");
  const goldProjectionResult = document.getElementById("goldProjectionResult");
  const detailTitle = document.getElementById("newsDetailTitle");
  const detailMeta = document.getElementById("newsDetailMeta");
  const detailSummary = document.getElementById("newsDetailSummary");
  const detailMeaning = document.getElementById("newsDetailMeaning");
  const detailWhy = document.getElementById("newsDetailWhy");
  const detailReaction = document.getElementById("newsDetailReaction");
  const detailReferences = document.getElementById("newsDetailReferences");
  const detailTags = document.getElementById("newsDetailTags");
  const detailSourceLink = document.getElementById("newsDetailSourceLink");
  const bullishProb = document.getElementById("newsBullishProb");
  const bearishProb = document.getElementById("newsBearishProb");
  const marketReactionSummary = document.getElementById("marketReactionSummary");
  const marketReactionBias = document.getElementById("marketReactionBias");
  const marketRegime = document.getElementById("marketRegime");
  const marketReactionGrid = document.getElementById("marketReactionGrid");
  const marketSessionBadge = document.getElementById("marketSessionBadge");
  const marketStateStrip = document.getElementById("marketStateStrip");
  const marketMoveReason = document.getElementById("marketMoveReason");
  const catalystWindowLabel = document.getElementById("newsCatalystWindowLabel");
  const catalystSummary = document.getElementById("newsCatalystSummary");
  const catalystList = document.getElementById("newsCatalystList");
  const goldHourPanel = document.getElementById("goldHourPanel");
  const goldHourSummaryBtn = document.getElementById("goldHourSummaryBtn");
  const goldSummaryModal = document.getElementById("goldSummaryModal");
  const goldSummaryBackdrop = document.getElementById("goldSummaryBackdrop");
  const goldSummaryCloseBtn = document.getElementById("goldSummaryCloseBtn");
  const goldSummaryPanel = document.getElementById("goldSummaryPanel");
  const CLIENT_POLL_BUFFER_MS = 2_500;
  const CLIENT_RETRY_MS = 15_000;
  const CLIENT_MIN_DELAY_MS = 10_000;
  const CLIENT_MAX_DELAY_MS = 180_000;
  const MARKET_REACTION_POLL_MS = 5_000;
  const RELATIVE_TIME_REFRESH_MS = 5_000;
  const THEME_STORAGE_KEY = "news-tracker-theme";
  if (!watchlistSelect || !listRoot || !sortSelect || !timelinessSelect || !newsTypeSelect) return;

  function getPreferredTheme() {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") {
      return saved;
    }
    return "dark";
  }

  function setThemeState(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.body.setAttribute("data-theme", nextTheme);
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute("aria-label", nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      themeToggleBtn.dataset.theme = nextTheme;
    }
    if (themeToggleLabel) {
      themeToggleLabel.textContent = nextTheme === "dark" ? "Dark mode" : "Light mode";
    }
  }

  function applyTheme(theme, options = {}) {
    const nextTheme = theme === "light" ? "light" : "dark";
    setThemeState(nextTheme);
  }

  function initializeTheme() {
    applyTheme(getPreferredTheme(), { animate: false });
    if (!themeToggleBtn) {
      return;
    }
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }

  initializeTheme();

  function newsTypeModes(newsType) {
    if (newsType === "catalyst") {
      return {
        signalMode: "balanced",
        sourceMode: "established",
        tradingMode: "catalyst",
        label: "upcoming/event news",
      };
    }

    if (newsType === "gold") {
      return {
        signalMode: "balanced",
        sourceMode: "established",
        tradingMode: "gold",
        label: "gold/XAUUSD only",
      };
    }

    if (newsType === "usdRates") {
      return {
        signalMode: "balanced",
        sourceMode: "established",
        tradingMode: "usd-rates",
        label: "USD / Fed / yields",
      };
    }

    if (newsType === "geopolitics") {
      return {
        signalMode: "balanced",
        sourceMode: "established",
        tradingMode: "geopolitics",
        label: "geopolitical risk",
      };
    }

    if (newsType === "clean") {
      return {
        signalMode: "balanced",
        sourceMode: "trusted",
        tradingMode: "clean",
        label: "low-noise trading news",
      };
    }

    if (newsType === "all") {
      return {
        signalMode: "broad",
        sourceMode: "established",
        tradingMode: "support",
        label: "all useful news",
      };
    }

    return {
      signalMode: "realtime",
      sourceMode: "established",
      tradingMode: "market-moving",
      label: "market-moving now",
    };
  }

  const initialNewsType = newsTypeSelect.value || "moving";
  const initialModes = newsTypeModes(initialNewsType);

  const state = {
    watchlists: [],
    watchlistId: "xauusd",
    minScore: Number(minScoreSelect.value || 6),
    maxAgeHours: Number(timelinessSelect.value || 12),
    newsType: initialNewsType,
    signalMode: initialModes.signalMode,
    sourceMode: initialModes.sourceMode,
    tradingMode: initialModes.tradingMode,
    status: null,
    clientError: "",
    items: [],
    catalysts: null,
    goldHour: null,
    goldSummary: null,
    goldSummaryOpen: false,
    estimateLog: null,
    marketReaction: null,
    selectedKey: "",
    detailCache: {},
    readFreshKeys: loadReadFreshKeys(),
    dismissedKeys: loadDismissedKeys(),
    tradeNowNotifiedKeys: loadTradeNowNotifiedKeys(),
    soundEnabled: loadSoundEnabled(),
    soundContext: null,
    hasLoadedNewsOnce: false,
    listMode: "visible",
    sortMode: sortSelect.value || "latest",
    timerHandle: null,
    marketTimerHandle: null,
    relativeTimeHandle: null,
    initialized: false,
  };

  function loadReadFreshKeys() {
    try {
      const raw = window.localStorage.getItem("candlestick-lab-read-fresh");
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function persistReadFreshKeys() {
    try {
      window.localStorage.setItem("candlestick-lab-read-fresh", JSON.stringify(state.readFreshKeys));
    } catch {}
  }

  function loadDismissedKeys() {
    try {
      const raw = window.localStorage.getItem("newstracker-dismissed-news");
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function persistDismissedKeys() {
    try {
      window.localStorage.setItem("newstracker-dismissed-news", JSON.stringify(state.dismissedKeys));
    } catch {}
  }

  function loadTradeNowNotifiedKeys() {
    try {
      const raw = window.localStorage.getItem("newstracker-trade-now-notified");
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function persistTradeNowNotifiedKeys() {
    try {
      window.localStorage.setItem("newstracker-trade-now-notified", JSON.stringify(state.tradeNowNotifiedKeys));
    } catch {}
  }

  function loadSoundEnabled() {
    try {
      return window.localStorage.getItem("newstracker-soft-sound-enabled") !== "false";
    } catch {
      return true;
    }
  }

  function persistSoundEnabled() {
    try {
      window.localStorage.setItem("newstracker-soft-sound-enabled", String(state.soundEnabled));
    } catch {}
  }

  function renderSoundToggle() {
    if (!notificationSoundBtn) {
      return;
    }

    notificationSoundBtn.textContent = state.soundEnabled ? "Sound on" : "Sound muted";
    notificationSoundBtn.classList.toggle("isMuted", !state.soundEnabled);
    notificationSoundBtn.setAttribute("aria-pressed", String(state.soundEnabled));
  }

  function getSoundContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    if (!state.soundContext) {
      state.soundContext = new AudioContextClass();
    }

    return state.soundContext;
  }

  function playSoftTradeNowSound() {
    if (!state.soundEnabled) {
      return;
    }

    const context = getSoundContext();
    if (!context) {
      return;
    }

    const startSound = () => {
      const now = context.currentTime;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      gain.connect(context.destination);

      [660, 880].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now + index * 0.09);
        oscillator.connect(gain);
        oscillator.start(now + index * 0.09);
        oscillator.stop(now + 0.36 + index * 0.09);
      });
    };

    if (context.state === "suspended") {
      context.resume().then(startSound).catch(() => {});
      return;
    }

    startSound();
  }

  function clear(node) {
    if (!node) {
      return;
    }

    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function clampDelay(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${url} failed with ${response.status}`);
    }
    return response.json();
  }

  function formatRelativeTime(value) {
    if (!value) return "Waiting";
    const deltaMs = Date.now() - Date.parse(value);
    if (!Number.isFinite(deltaMs)) return "Waiting";

    const seconds = Math.round(deltaMs / 1000);
    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    if (Math.abs(seconds) < 60) return formatter.format(-seconds, "second");

    const minutes = Math.round(seconds / 60);
    if (Math.abs(minutes) < 60) return formatter.format(-minutes, "minute");

    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return formatter.format(-hours, "hour");

    const days = Math.round(hours / 24);
    return formatter.format(-days, "day");
  }

  function formatClockTime(value) {
    if (!value) return "Waiting";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Waiting";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  }

  function formatStamp(value) {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function formatCatalystTime(value) {
    if (!value) return "Timing unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Timing unknown";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  }

  function formatTimeUntil(value) {
    const scheduledAt = Date.parse(value || "");
    if (!Number.isFinite(scheduledAt)) return "unscheduled";

    const minutes = Math.round((scheduledAt - Date.now()) / 60_000);
    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (Math.abs(minutes) < 60) {
      return formatter.format(minutes, "minute");
    }

    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 48) {
      return formatter.format(hours, "hour");
    }

    return formatter.format(Math.round(hours / 24), "day");
  }

  function setStatusPill(status) {
    statusPill.className = "biasPill";

    if (!status) {
      statusPill.classList.add("wait");
      statusPill.textContent = "Loading feeds";
      return;
    }

    if (status.lastError) {
      statusPill.classList.add("bearish");
      statusPill.textContent = status.lastError.includes(" is not defined") ? "App issue" : "Feed issue";
      return;
    }

    if ((status.feedErrors || []).length > 0) {
      statusPill.classList.add("wait");
      statusPill.textContent = "Partial feeds";
      return;
    }

    if (status.newItemCount > 0) {
      statusPill.classList.add("bullish");
      statusPill.textContent = `${status.newItemCount} fresh item${status.newItemCount === 1 ? "" : "s"}`;
      return;
    }

    statusPill.classList.add("wait");
    statusPill.textContent = "Monitoring";
  }

  function populateWatchlists() {
    clear(watchlistSelect);
    state.watchlists.forEach((watchlist) => {
      const option = document.createElement("option");
      option.value = watchlist.id;
      option.textContent = `${watchlist.label} ${watchlist.symbols.length ? `(${watchlist.symbols.slice(0, 3).join(", ")})` : ""}`;
      watchlistSelect.appendChild(option);
    });
    watchlistSelect.value = state.watchlistId;
  }

  function renderFeedList(status) {
    if (!feedList) {
      return;
    }

    clear(feedList);
    (status.feeds || []).forEach((feed) => {
      const chip = document.createElement("span");
      chip.className = "feedChip";
      chip.textContent = feed.label;
      feedList.appendChild(chip);
    });
  }

  function renderStatus() {
    const status = state.status;
    setStatusPill(status);

    if (!status) return;

    deskTitle.textContent = `${status.label} trade radar`;
    deskDescription.textContent = status.description;
    symbolsCount.textContent = String((status.symbols || []).length);
    feedCount.textContent = String(status.feedCount || 0);
    freshCount.textContent = String(status.newItemCount || 0);
    lastCheckLabel.textContent = formatRelativeTime(status.lastSuccessfulPollAt || status.lastCheckedAt);
    const newsTypeLabel = newsTypeModes(state.newsType).label;
    const feedErrorCount = (status.feedErrors || []).length;
    const healthyFeedCount = Math.max(0, (status.feedCount || 0) - feedErrorCount);
    feedSummary.textContent = `${healthyFeedCount}/${status.feedCount} feeds healthy | ${Math.round(status.pollMs / 1000)}s polling`;
    renderFeedList(status);

    errorBox.hidden = !status.lastError && feedErrorCount === 0 && !state.clientError;
    if (status.lastError) {
      const isAppIssue = status.lastError.includes(" is not defined");
      errorBox.textContent = isAppIssue
        ? `App issue: ${status.lastError}. The feeds may still be healthy.`
        : `Feed fetch error: ${status.lastError}. The app is still running, but outbound network may be blocked.`;
      return;
    }

    errorBox.textContent = feedErrorCount
        ? `Partial feed warning: ${status.feedErrors
            .slice(0, 4)
            .map((feedError) => feedError.label)
            .join(", ")} did not load. Other feeds are still active.`
      : state.clientError
        ? `Display warning: ${state.clientError}. Feeds may still be healthy.`
        : "";
  }

  function renderCatalysts() {
    if (!catalystList || !catalystSummary || !catalystWindowLabel) {
      return;
    }

    const payload = state.catalysts || {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    const highImpactCount = items.filter((item) => item.impact === "high").length;
    const hasCatalystError = Boolean(payload.sourceError);

    clear(catalystList);
    catalystWindowLabel.textContent = `${payload.watchlistLabel || "Active watchlist"} | next ${
      payload.windowHours || 168
    }h | multi-source calendar`;
    catalystSummary.textContent = items.length
      ? `${items.length} XAUUSD risk windows, including ${highImpactCount} high-impact catalyst${
          highImpactCount === 1 ? "" : "s"
        }. Sources merged: ${(payload.sourceNames || []).slice(0, 5).join(", ") || payload.sourceLabel || "calendar model"}. ${
          payload.sourceError ? `Calendar warning: ${payload.sourceError}. ` : ""
        }${payload.disclaimer || "Merged scheduled risk windows."}`
      : hasCatalystError
        ? `Catalyst panel unavailable: ${payload.sourceError}.`
        : "No catalyst windows found for the selected watchlist.";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "catalystEmpty";
      empty.textContent = hasCatalystError
        ? "Catalyst data is temporarily unavailable."
        : "No upcoming catalyst windows in this model yet.";
      catalystList.appendChild(empty);
      return;
    }

    const marketItem = items[0];
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = `catalystItem ${item.impact || "medium"}`;

      const timeBlock = document.createElement("div");
      timeBlock.className = "catalystTime";
      const countdown = document.createElement("strong");
      countdown.textContent = formatTimeUntil(item.scheduledAt);
      const stamp = document.createElement("span");
      stamp.textContent = formatCatalystTime(item.scheduledAt);
      timeBlock.appendChild(countdown);
      timeBlock.appendChild(stamp);

      const body = document.createElement("div");
      body.className = "catalystBody";
      const header = document.createElement("div");
      header.className = "catalystHeader";
      const title = document.createElement("h3");
      title.className = "catalystTitle";
      title.textContent = item.title;
      const impact = createTag(`${item.impact || "medium"} impact`, item.impact || "medium");
      const status = createTag(item.status === "live" ? "live now" : item.status === "recent" ? "occurred" : "upcoming", item.status || "watch");
      header.appendChild(title);
      header.appendChild(status);
      header.appendChild(impact);

      const meta = document.createElement("div");
      meta.className = "catalystMeta";
      meta.textContent = `${item.country ? `${item.country} | ` : ""}${item.category || "Catalyst"} | ${
        item.sourceLabel || "Multi-source calendar"
      }`;

      const quality = document.createElement("div");
      quality.className = "catalystSourceQuality";
      catalystSourceQuality(item.sources || []).forEach((tier) => {
        const chip = document.createElement("span");
        chip.className = `sourceQualityChip ${tier.className}`;
        chip.textContent = tier.label;
        quality.appendChild(chip);
      });

      const values = document.createElement("div");
      values.className = "catalystValues";
      if (item.forecast) {
        const forecast = document.createElement("span");
        forecast.textContent = `Forecast ${item.forecast}`;
        values.appendChild(forecast);
      }
      if (item.previous) {
        const previous = document.createElement("span");
        previous.textContent = `Previous ${item.previous}`;
        values.appendChild(previous);
      }

      const reason = document.createElement("p");
      reason.className = "catalystReason";
      reason.textContent = item.whyItMatters || "Relevant to the active watchlist.";

      const risk = document.createElement("p");
      risk.className = "catalystRisk";
      risk.textContent = item.tradeRisk || "Use timing as a risk-control marker.";

      const marketRead = document.createElement("p");
      marketRead.className = `catalystMarketRead ${item.status || "upcoming"}`;
      marketRead.textContent = item.marketImpactRead || "";

      const sources = document.createElement("div");
      sources.className = "catalystSources";
      (item.sources || []).slice(0, 4).forEach((source) => {
        const kind = catalystSourceKind(source);
        if (!source.url) {
          const chip = document.createElement("span");
          chip.className = `catalystSourceChip ${kind.className}`;
          chip.textContent = `${kind.short}: ${source.label}`;
          sources.appendChild(chip);
          return;
        }

        const link = document.createElement("a");
        link.className = `catalystSourceChip ${kind.className}`;
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = `${kind.short}: ${source.label}`;
        sources.appendChild(link);
      });

      body.appendChild(header);
      body.appendChild(meta);
      if (quality.childNodes.length) {
        body.appendChild(quality);
      }
      if (values.childNodes.length) {
        body.appendChild(values);
      }
      body.appendChild(reason);
      body.appendChild(risk);
      if (marketRead.textContent) {
        body.appendChild(marketRead);
      }
      if (sources.childNodes.length) {
        body.appendChild(sources);
      }
      if ((item.relatedNews || []).length) {
        const related = document.createElement("div");
        related.className = "catalystRelated";
        const relatedTitle = document.createElement("strong");
        relatedTitle.textContent = "News after event";
        related.appendChild(relatedTitle);

        item.relatedNews.forEach((news) => {
          const link = document.createElement("a");
          link.className = "catalystRelatedLink";
          link.href = news.link;
          link.target = "_blank";
          link.rel = "noreferrer";
          link.textContent = `${news.sourceName || "source"}: ${news.title}`;

          const time = document.createElement("span");
          time.textContent = formatRelativeTime(news.publishedAt);

          const row = document.createElement("div");
          row.className = "catalystRelatedRow";
          row.appendChild(link);
          row.appendChild(time);
          related.appendChild(row);
        });

        body.appendChild(related);
      }
      card.appendChild(timeBlock);
      card.appendChild(body);
      catalystList.appendChild(card);
    });
  }

  function catalystSourceKind(source) {
    const type = String(source?.type || "").toLowerCase();
    if (type === "calendar") {
      return { label: "Live calendar", short: "Live", className: "calendar" };
    }
    if (type === "official") {
      return { label: "Official source", short: "Official", className: "official" };
    }
    if (type === "model") {
      return { label: "Desk timing model", short: "Model", className: "model" };
    }

    return { label: "Source reference", short: "Source", className: "reference" };
  }

  function catalystSourceQuality(sources) {
    const kinds = sources.map(catalystSourceKind);
    const order = ["calendar", "official", "model", "reference"];
    return order
      .map((className) => kinds.find((kind) => kind.className === className))
      .filter(Boolean);
  }

  function renderMarketReaction() {
    if (!marketReactionSummary || !marketReactionBias || !marketReactionGrid) {
      return;
    }

    const payload = state.marketReaction || {};
    const reaction = payload.reaction || {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    const marketClosed = payload.marketSession && payload.marketSession.open === false;
    const marketItem =
      items.find((item) => item.id === "xauusd" || item.id === "gold") ||
      items.find((item) => item.role === "live quote") ||
      items[0];

    clear(marketReactionGrid);
    const appUpdatedAt = payload.generatedAt;
    const sourceUpdatedAt = marketItem?.updatedAt || payload.generatedAt;
    const priceLabel = marketItem?.displayPrice || "Waiting";
    marketReactionSummary.textContent = marketClosed
      ? "Weekend / closed session"
      : items.length
        ? `XAUUSD ${priceLabel} • app refresh ${formatClockTime(appUpdatedAt)} • source ${formatRelativeTime(sourceUpdatedAt)}`
        : "Waiting for live market data...";
    renderMarketSession(payload.marketSession, payload.marketRegime, marketClosed);
    marketReactionBias.hidden = true;
    marketReactionBias.innerHTML = "";
    renderMarketRegime(payload.marketRegime);

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "marketReactionEmpty";
      empty.textContent = marketClosed
        ? "Gold market is closed. Live XAUUSD interpretation is paused until the session reopens."
        : (payload.errors || []).length
          ? `Market data issue: ${payload.errors.map((error) => error.label).join(", ")} did not load.`
          : "No market data available yet.";
      marketReactionGrid.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = `marketReactionItem ${item.move || "flat"}`;

      const top = document.createElement("div");
      top.className = "marketReactionTop";
      const label = document.createElement("span");
      label.textContent = item.label;
      const move = document.createElement("strong");
      move.textContent = item.displayChange;
      top.appendChild(label);
      top.appendChild(move);

      const price = document.createElement("div");
      price.className = "marketReactionPrice";
      price.textContent = item.displayPrice;

      card.appendChild(top);
      card.appendChild(price);
      marketReactionGrid.appendChild(card);
    });

    renderMarketMoveReason(payload, marketItem);
  }

  function refreshRelativeTimeLabels() {
    if (!state.initialized || document.hidden) {
      return;
    }

    renderStatus();
    renderMarketReaction();
  }

  function renderMarketSession(session, regime, marketClosed) {
    if (marketSessionBadge) {
      marketSessionBadge.className = `marketSessionBadge ${marketClosed ? "closed" : "open"}`;
      marketSessionBadge.textContent = marketClosed ? "Session closed" : "Session open";
    }

    if (marketStateStrip) {
      const regimeLabel = regime?.label || "Regime loading";
      const summary = session?.summary || "Checking market session.";
      marketStateStrip.className = `marketStateStrip ${marketClosed ? "closed" : "open"}`;
      marketStateStrip.textContent = marketClosed ? summary : `${regimeLabel} • ${summary}`;
    }
  }

  function marketPulseWidth(item) {
    const percent = Math.abs(Number(item?.dayChangePercent) || 0);
    return Math.max(8, Math.min(100, Math.round(percent * 22)));
  }

  function renderMarketRegime(regime) {
    if (!marketRegime) {
      return;
    }

    const activeRegime = regime || {};
    marketRegime.className = `marketRegime ${activeRegime.tone || "mixed"}`;
    marketRegime.innerHTML = "";

    const visual = document.createElement("div");
    visual.className = "regimeVisual";
    ["macro", "haven", "noise"].forEach((mode) => {
      const dot = document.createElement("span");
      dot.className = regimeDotClass(activeRegime.label, mode);
      visual.appendChild(dot);
    });

    const copy = document.createElement("div");
    copy.className = "regimeCopy";
    const label = document.createElement("strong");
    label.textContent = activeRegime.label || "Regime loading";
    const summary = document.createElement("span");
    summary.textContent = regimeShortText(activeRegime);
    copy.appendChild(label);
    copy.appendChild(summary);

    marketRegime.appendChild(visual);
    marketRegime.appendChild(copy);
  }

  function regimeDotClass(label, mode) {
    const text = String(label || "").toLowerCase();
    const active =
      (mode === "macro" && /dollar|yield/.test(text)) ||
      (mode === "haven" && /safe-haven|specific/.test(text)) ||
      (mode === "noise" && /noisy|detached|loading/.test(text));
    return active ? `active ${mode}` : mode;
  }

  function regimeShortText(regime) {
    const label = String(regime?.label || "").toLowerCase();
    if (/dollar|yield/.test(label)) return "Macro driver";
    if (/safe-haven/.test(label)) return "Haven bid";
    if (/specific/.test(label)) return "Gold-only flow";
    if (/noisy|detached/.test(label)) return "Choppy tape";
    return "Scanning";
  }

  function renderMarketMoveReason(payload, marketItem) {
    if (!marketMoveReason) {
      return;
    }

    if (!marketItem) {
      marketMoveReason.textContent = "Waiting for a live market reason...";
      return;
    }

    const reasonItem = pickMarketReasonHeadline(marketItem);
    const direction = marketItem.move === "up" ? "rising" : marketItem.move === "down" ? "falling" : "flat";
    const change = marketItem.displayChange || "";
    marketMoveReason.innerHTML = "";

    const tile = document.createElement("div");
    tile.className = "reasonTile";
    const badge = document.createElement("span");
    badge.className = "reasonBadge";
    const headline = document.createElement("strong");
    const sub = document.createElement("span");

    if (!reasonItem) {
      badge.textContent = direction.toUpperCase();
      headline.textContent = "Driver unclear";
      sub.textContent = change || "Waiting for cleaner tape";
      tile.appendChild(badge);
      tile.appendChild(headline);
      tile.appendChild(sub);
      marketMoveReason.appendChild(tile);
      return;
    }

    const driver = marketReasonDriver(reasonItem);
    badge.textContent = driver;
    headline.textContent = reasonItem.title;
    sub.textContent = `${direction} ${change}`.trim();
    tile.appendChild(badge);
    tile.appendChild(headline);
    tile.appendChild(sub);
    marketMoveReason.appendChild(tile);
  }

  function pickMarketReasonHeadline(marketItem) {
    const move = marketItem?.move || "flat";
    const directionalItems = state.items.filter((item) => {
      if (!item || isDismissed(item)) return false;
      if (item.impact === "low" && Number(item.score || 0) < 10) return false;
      if (move === "up") return item.bias === "bullish" || item.bias === "mixed";
      if (move === "down") return item.bias === "bearish" || item.bias === "mixed";
      return true;
    });

    return directionalItems.sort((left, right) => {
      const scoreDiff = (Number(right.score) || 0) - (Number(left.score) || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return itemTime(right) - itemTime(left);
    })[0];
  }

  function marketReasonDriver(item) {
    const text = `${item?.title || ""} ${item?.whyItMatters || ""} ${(item?.matchedKeywords || []).join(" ")}`.toLowerCase();
    if (/\bfed\b|fomc|rate|yield|treasury|dollar|usd|inflation|cpi|pce/.test(text)) {
      return "MACRO";
    }
    if (/war|geopolitic|sanction|oil|middle east|attack|ceasefire/.test(text)) {
      return "HAVEN";
    }
    if (/gold|xauusd|bullion/.test(text)) {
      return "GOLD";
    }

    return "NEWS";
  }

  function renderGoldHourPanel() {
    if (!goldHourPanel) {
      return;
    }

    const payload = state.goldHour || {};
    if (payload.error) {
      goldHourPanel.className = "goldHourPanel";
      goldHourPanel.textContent = `Past-hour gold read unavailable: ${payload.error}`;
      return;
    }

    if (payload.marketClosed) {
      goldHourPanel.className = "goldHourPanel";
      goldHourPanel.innerHTML = `
        <div class="goldHourHead">
          <span>Gold past hour</span>
          <strong>Market closed</strong>
        </div>
        <div class="goldHourFoot">${payload.marketSession?.summary || "Weekend / closed session."}</div>
      `;
      return;
    }

    if (!payload.move) {
      goldHourPanel.className = "goldHourPanel";
      goldHourPanel.textContent = "Loading past-hour gold read...";
      return;
    }

    const move = payload.move || {};
    const reason = payload.reason || {};
    const tone = move.direction === "up" ? "bullish" : move.direction === "down" ? "bearish" : "mixed";
    const directionText = move.direction === "up" ? "rose" : move.direction === "down" ? "dropped" : "stayed flat";
    const driver = reason.driver || "NEWS";

    goldHourPanel.className = `goldHourPanel ${tone}`;
    goldHourPanel.innerHTML = "";

    const head = document.createElement("div");
    head.className = "goldHourHead";
    const label = document.createElement("span");
    label.textContent = "Gold past hour";
    const change = document.createElement("strong");
    change.textContent = move.displayChange || "Waiting";
    head.appendChild(label);
    head.appendChild(change);

    const body = document.createElement("div");
    body.className = "goldHourBody";
    const badge = document.createElement("span");
    badge.className = "goldHourBadge";
    badge.textContent = driver;
    const copy = document.createElement("p");
    copy.textContent = reason.title
      ? `Gold ${directionText} over the past hour. The biggest related headline is: ${reason.title}`
      : `Gold ${directionText} over the past hour, but no major matching headline has been strong enough to explain it yet.`;
    body.appendChild(badge);
    body.appendChild(copy);

    const foot = document.createElement("div");
    foot.className = "goldHourFoot";
    foot.textContent = reason.summary || move.summary || "Use this as context, not a trade signal by itself.";

    goldHourPanel.appendChild(head);
    goldHourPanel.appendChild(body);
    goldHourPanel.appendChild(foot);
  }

  function renderGoldSummaryPanel() {
    if (!goldSummaryPanel || !goldHourSummaryBtn || !goldSummaryModal) {
      return;
    }

    goldHourSummaryBtn.textContent = "Why Gold Moved";
    goldSummaryModal.hidden = !state.goldSummaryOpen;
    if (!state.goldSummaryOpen) {
      goldSummaryPanel.innerHTML = "";
      return;
    }

    const payload = state.goldSummary || {};
    if (payload.error) {
      goldSummaryPanel.className = "goldSummaryPanel";
      goldSummaryPanel.textContent = `Summary unavailable: ${payload.error}`;
      return;
    }

    const summary = payload.summary || {};
    goldSummaryPanel.className = `goldSummaryPanel ${summary.move?.direction || "mixed"}`;
    goldSummaryPanel.innerHTML = "";

    const top = document.createElement("div");
    top.className = "goldSummaryTop";
    const title = document.createElement("strong");
    title.textContent = `Last ${payload.hours || 4}h summary`;
    const driver = document.createElement("span");
    driver.textContent = summary.driver || "NEWS";
    top.appendChild(title);
    top.appendChild(driver);

    const summaryText = document.createElement("p");
    summaryText.className = "goldSummaryText";
    summaryText.textContent = summary.composed || summary.summary || "No recent multi-hour summary available.";

    const narrative = document.createElement("p");
    narrative.className = "goldSummaryNarrative";
    narrative.textContent = [summary.takeaway, summary.narrative].filter(Boolean).join(" ");

    goldSummaryPanel.appendChild(top);
    goldSummaryPanel.appendChild(summaryText);
    if (summary.takeaway || summary.narrative) {
      goldSummaryPanel.appendChild(narrative);
    }

    if (payload.marketClosed && payload.marketSession?.summary) {
      const closedNote = document.createElement("p");
      closedNote.className = "goldSummaryNarrative";
      closedNote.textContent = payload.marketSession.summary;
      goldSummaryPanel.appendChild(closedNote);
    }

    const headlines = Array.isArray(summary.headlines) ? summary.headlines : [];
    if (headlines.length) {
      const list = document.createElement("div");
      list.className = "goldSummaryHeadlines";
      headlines.forEach((item) => {
        const row = document.createElement("div");
        row.className = "goldSummaryHeadline";
        const source = document.createElement("strong");
        source.textContent = item.sourceName || "Source";
        const title = document.createElement("span");
        title.textContent = item.title || "";
        row.appendChild(source);
        row.appendChild(title);
        if (item.why) {
          const why = document.createElement("small");
          why.textContent = item.why;
          row.appendChild(why);
        }
        list.appendChild(row);
      });
      goldSummaryPanel.appendChild(list);
    }
  }

  async function loadGoldHour() {
    try {
      const response = await fetchJson(`/api/market/gold-hour?watchlist=${encodeURIComponent(state.watchlistId)}`);
      state.goldHour = response.goldHour || null;
    } catch (error) {
      state.goldHour = {
        error: error instanceof Error ? error.message : String(error),
      };
    }

    renderGoldHourPanel();
  }

  async function loadGoldSummary() {
    try {
      const response = await fetchJson(`/api/market/gold-summary?watchlist=${encodeURIComponent(state.watchlistId)}&hours=4`);
      state.goldSummary = response.goldSummary || null;
    } catch (error) {
      state.goldSummary = {
        error: error instanceof Error ? error.message : String(error),
      };
    }

    renderGoldSummaryPanel();
  }

  async function loadMarketReaction() {
    try {
      const marketResponse = await fetchJson(`/api/market/reaction?watchlist=${encodeURIComponent(state.watchlistId)}`);
      state.marketReaction = marketResponse.reaction || null;
    } catch (error) {
      state.marketReaction = {
        items: [],
        errors: [
          {
            label: "Market reaction",
            error: error instanceof Error ? error.message : String(error),
          },
        ],
        reaction: {
          bias: "mixed",
          title: "Market data unavailable",
          summary: "Price confirmation could not be loaded.",
        },
      };
      state.estimateLog = null;
    }

    try {
      const estimateResponse = await fetchJson(`/api/market/estimates?watchlist=${encodeURIComponent(state.watchlistId)}&limit=24`);
      state.estimateLog = estimateResponse.estimates || null;
    } catch {
      state.estimateLog = null;
    }

    renderMarketReaction();
    renderTradeChecklist();
    renderGoldProjection();
    loadGoldHour().catch(() => {});
  }

  function createTag(label, className) {
    const tag = document.createElement("span");
    tag.className = `tagPill ${className}`.trim();
    tag.textContent = label;
    return tag;
  }

  function actionabilityMeta(item) {
    const score = Number(item?.score) || 0;
    const confidence = Number(item?.confidence) || 0;
    const isFresh = Boolean(item?.isFresh);
    const sourceCount = Number(item?.combinedCount) || 1;
    const impact = item?.impact || "low";
    const urgency = item?.urgency || "background";
    const bias = item?.bias || "mixed";

    if (
      isFresh &&
      impact === "high" &&
      urgency === "immediate" &&
      confidence >= 68 &&
      score >= 10 &&
      bias !== "mixed"
    ) {
      return {
        label: "Trade now",
        className: "bullish",
        summary: "Fresh, high-impact headline with enough signal to act on immediately.",
      };
    }

    if (
      (impact === "high" || score >= 8 || urgency === "immediate" || sourceCount > 1) &&
      confidence >= 50 &&
      urgency !== "background"
    ) {
      return {
        label: "Wait for confirmation",
        className: "watch",
        summary: "Relevant headline, but price confirmation or broader follow-through still matters.",
      };
    }

    return {
      label: "Background only",
      className: "low",
      summary: "Useful context, but not strong enough for an immediate trade decision.",
    };
  }

  function renderTradeChecklist() {
    if (!tradeChecklist) {
      return;
    }

    const marketItem = Array.isArray(state.marketReaction?.items) ? state.marketReaction.items[0] : null;
    const regime = state.marketReaction?.marketRegime || {};
    const displayItems = getDisplayItems();
    const bestItem =
      displayItems.find((item) => actionabilityMeta(item).label === "Trade now") ||
      displayItems.find((item) => actionabilityMeta(item).label === "Wait for confirmation") ||
      displayItems[0];
    const bestAction = actionabilityMeta(bestItem);
    const nextCatalyst = nearestCatalyst();
    const marketMove = marketItem?.move || "flat";
    const riskyEvent = nextCatalyst && nextCatalyst.impact === "high" && minutesUntil(nextCatalyst.scheduledAt) <= 30;

    let verdict = "Wait";
    let tone = "wait";
    if (riskyEvent) {
      verdict = "No trade";
      tone = "danger";
    } else if (bestAction.label === "Trade now" && marketMove !== "flat") {
      verdict = "Trade setup";
      tone = marketMove === "up" ? "bullish" : "bearish";
    } else if (!bestItem || bestAction.label === "Background only") {
      verdict = "Observe";
    }

    const marketText =
      marketMove === "up" ? "XAUUSD rising" : marketMove === "down" ? "XAUUSD falling" : marketItem ? "XAUUSD flat" : "No quote";
    const newsText = bestItem ? `${bestAction.label} / ${bestItem.bias || "mixed"}` : "No signal";
    const riskText = nextCatalyst ? catalystRiskText(nextCatalyst) : "No nearby event";

    tradeChecklist.innerHTML = "";
    const verdictBox = document.createElement("div");
    verdictBox.className = `tradeChecklistVerdict ${tone}`;
    verdictBox.innerHTML = `<span>Decision</span><strong>${verdict}</strong>`;

    const steps = document.createElement("div");
    steps.className = "tradeChecklistSteps";
    [
      { label: "Market", value: marketText, tone: marketMove === "up" ? "bullish" : marketMove === "down" ? "bearish" : "wait" },
      { label: "News", value: newsText, tone: bestAction.className || "wait" },
      { label: "Risk", value: riskText, tone: riskyEvent ? "danger" : "wait" },
      { label: "Regime", value: regime.label || "Scanning", tone: regime.tone || "wait" },
    ].forEach((step) => {
      const node = document.createElement("div");
      node.className = `tradeStep ${step.tone}`;
      const label = document.createElement("span");
      label.textContent = step.label;
      const value = document.createElement("strong");
      value.textContent = step.value;
      node.appendChild(label);
      node.appendChild(value);
      steps.appendChild(node);
    });

    tradeChecklist.appendChild(verdictBox);
    tradeChecklist.appendChild(steps);
  }

  function renderGoldProjection() {
    if (!goldProjectionBox) {
      return;
    }

    const marketItem = Array.isArray(state.marketReaction?.items) ? state.marketReaction.items[0] : null;
    const price = Number(marketItem?.price);
    const audit = state.marketReaction?.estimateAudit;
    if (audit?.marketClosed) {
      goldProjectionBox.className = "goldProjectionBox";
      goldProjectionBox.innerHTML = `
        <div class="projectionHead">
          <span>Gold est.</span>
          <em>Closed</em>
        </div>
        <strong>Market closed</strong>
        <small>No new XAUUSD lock</small>
      `;
      renderGoldProjectionResult();
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      goldProjectionBox.className = "goldProjectionBox";
      goldProjectionBox.innerHTML = "<span>Gold est.</span><strong>--</strong>";
      renderGoldProjectionResult();
      return;
    }

    const items = getDisplayItems();
    const bestItem =
      items.find((item) => actionabilityMeta(item).label === "Trade now") ||
      items.find((item) => actionabilityMeta(item).label === "Wait for confirmation") ||
      items[0];
    const regimeTone = state.marketReaction?.marketRegime?.tone || "mixed";
    const move = marketItem.move || "flat";
    const bias = bestItem?.bias || "mixed";
    const directionalVotes = [
      move === "up" ? 1 : move === "down" ? -1 : 0,
      regimeTone === "bullish" ? 1 : regimeTone === "bearish" ? -1 : 0,
      bias === "bullish" ? 1 : bias === "bearish" ? -1 : 0,
    ];
    const voteScore = directionalVotes.reduce((total, vote) => total + vote, 0);
    const direction = voteScore >= 2 ? 1 : voteScore <= -2 ? -1 : 0;
    if (audit && Number.isFinite(Number(audit.target))) {
      const tone = audit.direction === "up" ? "bullish" : audit.direction === "down" ? "bearish" : "wait";
      goldProjectionBox.className = `goldProjectionBox ${tone}`;
      goldProjectionBox.innerHTML = `
        <div class="projectionHead">
          <span>${audit.direction === "up" ? "Target up" : audit.direction === "down" ? "Target down" : "Target flat"}</span>
          <em>${audit.confidence || 35}%</em>
        </div>
        <strong>${formatProjectionTarget(audit.target)}</strong>
        <small>Zone ${formatProjectionTarget(audit.low)} - ${formatProjectionTarget(audit.high)}</small>
      `;
      renderGoldProjectionResult();
      return;
    }

    const dayMove = Math.abs(Number(marketItem.dayChangePercent) || 0);
    const score = Number(bestItem?.score || 0);
    const confidenceRaw = Number(bestItem?.confidence || 45);
    const signalStrength = score >= 18 && confidenceRaw >= 70 ? 1.2 : score >= 12 && confidenceRaw >= 58 ? 1.05 : 0.85;
    const suggestedDistance = direction === 0 ? 0 : price * (clamp(dayMove * 0.18 + 0.08 * signalStrength, 0.08, 0.32) / 100);
    const targetDistance = clamp(suggestedDistance, direction === 0 ? 0 : 5, 12);
    const target = direction === 0 ? price : price + direction * targetDistance;
    const roundedTarget = Math.round(target / 5) * 5;
    const low = roundedTarget - 5;
    const high = roundedTarget + 5;
    const tone = direction > 0 ? "bullish" : direction < 0 ? "bearish" : "wait";
    const arrow = direction > 0 ? "up" : direction < 0 ? "down" : "flat";
    const agreement = Math.abs(voteScore);
    const confidence =
      bestItem && direction !== 0
        ? clamp(Math.round(confidenceRaw * 0.62 + agreement * 9 + Math.min(12, dayMove * 2)), 42, 86)
        : 35;
    goldProjectionBox.className = `goldProjectionBox ${tone}`;
    goldProjectionBox.innerHTML = `
      <div class="projectionHead">
        <span>${arrow === "up" ? "Target up" : arrow === "down" ? "Target down" : "Target flat"}</span>
        <em>${confidence}%</em>
      </div>
      <strong>${formatProjectionTarget(roundedTarget)}</strong>
      <small>Zone ${formatProjectionTarget(low)} - ${formatProjectionTarget(high)}</small>
    `;
    renderGoldProjectionResult();
  }

  function renderGoldProjectionResult() {
    if (!goldProjectionResult) {
      return;
    }

    const entries = Array.isArray(state.estimateLog?.entries) ? state.estimateLog.entries : [];
    const completed = entries.find((entry) => entry?.actualAt);
    const pending = entries.find((entry) => !entry?.actualAt);
    const entry = completed || pending;

    if (!entry) {
      goldProjectionResult.className = "goldProjectionResult";
      goldProjectionResult.innerHTML = "<span>Prev</span><strong>--</strong>";
      return;
    }

    if (!entry.actualAt) {
      goldProjectionResult.className = "goldProjectionResult pending";
      goldProjectionResult.innerHTML = `
        <span>Prev</span>
        <strong>...</strong>
      `;
      return;
    }

    const hit = Boolean(entry.zoneHit || entry.directionHit);
    const actual = Number(entry.actualPrice);
    const target = Number(entry.target);
    const diff = Number.isFinite(Number(entry.error)) ? Number(entry.error) : actual - target;
    goldProjectionResult.className = `goldProjectionResult ${hit ? "hit" : "miss"}`;
    goldProjectionResult.innerHTML = `
      <span>Prev</span>
      <strong>${hit ? "OK" : "No"}</strong>
      <small>${formatSignedProjectionDiff(diff)}</small>
    `;
  }

  function formatProjectionTarget(value) {
    return Math.round(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function formatSignedProjectionDiff(value) {
    const rounded = Math.round(Number(value) || 0);
    return `${rounded >= 0 ? "+" : ""}${rounded}`;
  }

  function nearestCatalyst() {
    const catalysts = Array.isArray(state.catalysts?.items) ? state.catalysts.items : [];
    return catalysts
      .filter((item) => minutesUntil(item.scheduledAt) >= 0)
      .sort((left, right) => minutesUntil(left.scheduledAt) - minutesUntil(right.scheduledAt))[0];
  }

  function minutesUntil(value) {
    const time = Date.parse(value || "");
    return Number.isFinite(time) ? Math.round((time - Date.now()) / 60_000) : Number.POSITIVE_INFINITY;
  }

  function catalystRiskText(catalyst) {
    const minutes = minutesUntil(catalyst.scheduledAt);
    if (!Number.isFinite(minutes)) return "Event time unclear";
    if (minutes <= 0) return "Event live";
    if (minutes < 60) return `${catalyst.impact || "event"} in ${minutes}m`;
    return `${catalyst.impact || "event"} in ${Math.round(minutes / 60)}h`;
  }

  function processTradeNowNotifications(items) {
    const tradeNowItems = (items || []).filter((item) => actionabilityMeta(item).label === "Trade now");
    let shouldPlay = false;
    let changed = false;

    tradeNowItems.forEach((item) => {
      if (!item.key || state.tradeNowNotifiedKeys[item.key]) {
        return;
      }

      state.tradeNowNotifiedKeys[item.key] = Date.now();
      changed = true;
      if (state.hasLoadedNewsOnce) {
        shouldPlay = true;
      }
    });

    if (changed) {
      persistTradeNowNotifiedKeys();
    }

    if (shouldPlay) {
      playSoftTradeNowSound();
    }
  }

  function sourceTierTagClass(item) {
    if (item?.sourceTier === "top") {
      return "high";
    }

    if (item?.sourceTier === "trusted") {
      return "medium";
    }

    return "low";
  }

  function countMatches(text, keywords) {
    return keywords.reduce((count, keyword) => (text.includes(keyword) ? count + 1 : count), 0);
  }

  function scoreDirection(item) {
    const impactMultiplier = item.impact === "high" ? 1.35 : item.impact === "medium" ? 1.1 : 0.9;
    const urgencyMultiplier = item.urgency === "immediate" ? 1.2 : item.urgency === "watch" ? 1.05 : 0.95;
    const base = Math.max(Number(item.score) || 1, 1) * impactMultiplier * urgencyMultiplier;

    let bull = 0;
    let bear = 0;

    if (item.bias === "bullish") {
      bull += base * 1.45;
    } else if (item.bias === "bearish") {
      bear += base * 1.45;
    } else {
      bull += base * 0.8;
      bear += base * 0.8;
    }

    const text = `${item.title} ${state.detailCache[item.key]?.articleSummary || ""} ${item.summary || ""} ${item.whyItMatters || ""}`
      .toLowerCase()
      .replace(/\s+/g, " ");

    const bullishKeywords = [
      "beat",
      "beats",
      "raises",
      "growth",
      "rally",
      "rallies",
      "surges",
      "gains",
      "rate cut",
      "cooling inflation",
      "reopens",
      "yield falls",
      "yields fall",
      "oil plunges",
      "ceasefire",
      "stimulus",
      "approval",
    ];

    const bearishKeywords = [
      "miss",
      "misses",
      "cuts",
      "warns",
      "slides",
      "drops",
      "hotter inflation",
      "higher yields",
      "attack",
      "war",
      "closed",
      "sanctions",
      "tariff",
      "hawkish",
      "selloff",
      "oil spikes",
    ];

    bull += countMatches(text, bullishKeywords) * 1.15;
    bear += countMatches(text, bearishKeywords) * 1.15;

    return { bull, bear };
  }

  function renderProbabilities(items) {
    if (!items.length) {
      bullishProb.textContent = "Bullish 50%";
      bearishProb.textContent = "Bearish 50%";
      return;
    }

    const totals = items.reduce(
      (accumulator, item) => {
        const direction = scoreDirection(item);
        accumulator.bull += direction.bull;
        accumulator.bear += direction.bear;
        return accumulator;
      },
      { bull: 0, bear: 0 }
    );

    const total = totals.bull + totals.bear || 1;
    const bullPercent = Math.round((totals.bull / total) * 100);
    const bearPercent = Math.max(0, 100 - bullPercent);

    bullishProb.textContent = `Bullish ${bullPercent}%`;
    bearishProb.textContent = `Bearish ${bearPercent}%`;
  }

  function getDisplayItems() {
    const items =
      state.listMode === "fresh"
        ? state.items.filter((item) => isUnreadFresh(item) && !isDismissed(item))
        : state.items.filter((item) => !isUnreadFresh(item) && !isDismissed(item));

    return sortItems(items);
  }

  function isDismissed(item) {
    return Boolean(item && state.dismissedKeys[item.key]);
  }

  function dismissItem(item) {
    if (!item || isDismissed(item)) {
      return;
    }

    state.dismissedKeys[item.key] = Date.now();
    persistDismissedKeys();
  }

  function itemTime(item) {
    const value = Date.parse(item?.publishedAt || item?.firstSeenAt || 0);
    return Number.isFinite(value) ? value : 0;
  }

  function sortItems(items) {
    const sorted = [...items];

    sorted.sort((left, right) => {
      if (state.sortMode === "oldest") {
        return itemTime(left) - itemTime(right);
      }

      if (state.sortMode === "score") {
        const scoreDiff = (Number(right.score) || 0) - (Number(left.score) || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return itemTime(right) - itemTime(left);
      }

      if (state.sortMode === "confidence") {
        const confidenceDiff = (Number(right.confidence) || 0) - (Number(left.confidence) || 0);
        if (confidenceDiff !== 0) return confidenceDiff;
        return itemTime(right) - itemTime(left);
      }

      if (state.sortMode === "sourceCount") {
        const sourceDiff = (Number(right.combinedCount) || 1) - (Number(left.combinedCount) || 1);
        if (sourceDiff !== 0) return sourceDiff;
        return itemTime(right) - itemTime(left);
      }

      return itemTime(right) - itemTime(left);
    });

    return sorted;
  }

  function updateFilterButtons() {
    visibleBtn.classList.toggle("active", state.listMode === "visible");
    freshBtn.classList.toggle("active", state.listMode === "fresh");
  }

  function isUnreadFresh(item) {
    return Boolean(item && item.isFresh && !state.readFreshKeys[item.key]);
  }

  function markFreshItemRead(item) {
    if (!isUnreadFresh(item)) {
      return;
    }

    state.readFreshKeys[item.key] = Date.now();
    persistReadFreshKeys();
  }

  function markAllFreshItemsRead() {
    let changed = false;

    state.items.forEach((item) => {
      if (!isUnreadFresh(item)) {
        return;
      }

      state.readFreshKeys[item.key] = Date.now();
      changed = true;
    });

    if (changed) {
      persistReadFreshKeys();
    }
  }

  function renderDetail(item) {
    clear(detailTags);
    clear(detailReferences);

    if (!item) {
      detailTitle.textContent = "No headline selected yet";
      detailMeta.textContent = "Waiting for the first headline...";
      detailSummary.textContent = "Once live headlines load, click any row on the left to read its trading context here.";
      detailMeaning.textContent = "The overall takeaway will appear here.";
      detailWhy.textContent = "Why it matters: Trading context will appear here.";
      if (detailReaction) {
        detailReaction.className = "newsPriceReaction";
        detailReaction.textContent = "Price reaction will appear after a headline is selected.";
      }
      detailSourceLink.href = "#";
      detailSourceLink.textContent = "source";
      detailSourceLink.setAttribute("aria-disabled", "true");
      return;
    }

    detailTitle.textContent = item.title;
    detailMeta.textContent =
      `${item.sourceName} | ${formatStamp(item.publishedAt || item.firstSeenAt)} | Impact Score ${item.score} | Confidence ${item.confidence ?? 50}%`;
    detailSummary.textContent = "Loading article summary...";
    detailMeaning.textContent = "Loading overall takeaway...";
    detailWhy.textContent = `Why it matters: ${
      item.whyItMatters || "Useful because it can affect the active watchlist through rates, risk appetite, or asset-specific flow."
    }`;
    if (detailReaction) {
      detailReaction.className = "newsPriceReaction loading";
      detailReaction.textContent = "Checking price reaction since this headline...";
    }
    detailSourceLink.href = item.link;
    detailSourceLink.textContent = item.sourceName || "Open article";
    detailSourceLink.removeAttribute("aria-disabled");

    detailTags.appendChild(createTag(`${item.impact} impact`, item.impact));
    detailTags.appendChild(createTag(`${item.confidenceBand || "medium"} confidence`, item.confidenceBand || "medium"));
    detailTags.appendChild(createTag(item.sourceTierLabel || "all sources", sourceTierTagClass(item)));
    const actionability = actionabilityMeta(item);
    detailTags.appendChild(createTag(actionability.label, actionability.className));
    if ((item.combinedCount || 1) > 1) {
      detailTags.appendChild(createTag(`${item.combinedCount} sources`, "watch"));
    }
    detailTags.appendChild(createTag(item.urgency, item.urgency));
    detailTags.appendChild(createTag(item.bias, item.bias));

    (item.categories || []).forEach((category) => {
      detailTags.appendChild(createTag(category, "low"));
    });

    (item.symbols || []).slice(0, 8).forEach((symbol) => {
      detailTags.appendChild(createTag(symbol, "medium"));
    });

    loadDetail(item).catch(() => {});
    loadHeadlineReaction(item).catch(() => {});
  }

  function renderHeadlineReaction(payload, item) {
    if (!detailReaction || state.selectedKey !== item.key) {
      return;
    }

    const reaction = payload?.reaction || {};
    const instruments = Array.isArray(reaction.instruments) ? reaction.instruments : [];

    detailReaction.className = `newsPriceReaction ${reaction.confirmation || "mixed"}`;
    detailReaction.innerHTML = "";

    const head = document.createElement("div");
    head.className = "newsPriceReactionHead";
    const title = document.createElement("strong");
    title.textContent = "Movement since headline";
    const statePill = document.createElement("span");
    statePill.className = "newsPriceReactionState mixed";
    statePill.textContent = "Context";
    head.appendChild(title);
    head.appendChild(statePill);

    const summary = document.createElement("p");
    summary.className = "newsPriceReactionSummary";
    summary.textContent = reaction.summary || "Raw movement only. This is not a confirmation signal.";

    detailReaction.appendChild(head);
    detailReaction.appendChild(summary);

    if (!instruments.length) {
      return;
    }

    const grid = document.createElement("div");
    grid.className = "newsPriceReactionGrid";
    instruments.slice(0, 3).forEach((instrument) => {
      const row = document.createElement("div");
      row.className = `newsPriceReactionRow ${instrument.move || "flat"}`;

      const label = document.createElement("span");
      label.className = "newsPriceReactionLabel";
      label.textContent = instrument.label;

      const move = document.createElement("strong");
      move.className = "newsPriceReactionValue";
      move.textContent = instrument.displayChange;

      row.appendChild(label);
      row.appendChild(move);
      grid.appendChild(row);
    });

    detailReaction.appendChild(grid);
  }

  async function loadHeadlineReaction(item) {
    if (!detailReaction) {
      return;
    }

    try {
      const response = await fetchJson(
        `/api/news/reaction?watchlist=${encodeURIComponent(state.watchlistId)}&key=${encodeURIComponent(item.key)}`
      );

      if (state.selectedKey !== item.key) {
        return;
      }

      renderHeadlineReaction(response.reaction || response, item);
    } catch {
      if (state.selectedKey !== item.key) {
        return;
      }

      detailReaction.className = "newsPriceReaction mixed";
      detailReaction.textContent = "Price reaction: trial read unavailable for this headline.";
    }
  }

  async function loadDetail(item) {
    const cached = state.detailCache[item.key];
    if (cached) {
      detailSummary.textContent = cached.articleSummary;
      detailMeaning.textContent = cached.articleMeaning || "Overall takeaway was not available.";
      detailSourceLink.href = cached.resolvedUrl;
      detailSourceLink.textContent = cached.shortUrl;
      return;
    }

    try {
      const response = await fetchJson(
        `/api/news/detail?watchlist=${encodeURIComponent(state.watchlistId)}&key=${encodeURIComponent(item.key)}`
      );
      const detail = response.detail || {};
      state.detailCache[item.key] = detail;

      if (state.selectedKey !== item.key) {
        return;
      }

      detailSummary.textContent =
        detail.articleSummary || item.generatedSummary || "No article summary was available from the source.";
      detailMeaning.textContent =
        detail.articleMeaning || "Overall takeaway was not available.";
      detailSourceLink.href = detail.resolvedUrl || item.link;
      detailSourceLink.textContent = detail.shortUrl || item.sourceName || "Open article";
      detailSourceLink.removeAttribute("aria-disabled");
      renderReferences(detail.references || item.references || []);
      renderProbabilities(getDisplayItems());
    } catch {
      if (state.selectedKey !== item.key) {
        return;
      }

      detailSummary.textContent = item.generatedSummary || "No article summary was available from the source.";
      detailMeaning.textContent = "Overall takeaway was not available.";
      detailSourceLink.href = item.link;
      detailSourceLink.textContent = item.sourceName || "Open article";
      detailSourceLink.removeAttribute("aria-disabled");
      renderReferences(item.references || []);
    }
  }

  function renderReferences(references) {
    clear(detailReferences);
    (references || []).slice(0, 8).forEach((reference) => {
      const link = document.createElement("a");
      link.className = "newsReferenceLink";
      link.href = reference.link;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = reference.shortUrl || reference.sourceName || "source";
      detailReferences.appendChild(link);
    });
  }

  function renderItems() {
    clear(listRoot);
    const visibleItems = state.items.filter((item) => !isUnreadFresh(item) && !isDismissed(item));
    const freshItems = state.items.filter((item) => isUnreadFresh(item) && !isDismissed(item));
    const items = getDisplayItems();

    trackedCount.textContent = String(visibleItems.length);
    freshCount.textContent = String(freshItems.length);
    if (minScoreField && minScoreDot) {
      minScoreField.classList.toggle("hasNew", freshItems.length > 0);
      minScoreDot.hidden = freshItems.length === 0;
    }
    updateFilterButtons();
    renderProbabilities(items);
    emptyState.hidden = items.length > 0;

    if (!items.length) {
      state.selectedKey = "";
      emptyState.textContent =
        state.listMode === "fresh"
          ? "No fresh headlines match the current filter yet."
          : "No headlines matched this filter yet.";
      renderDetail(null);
      return;
    }

    if (!items.some((item) => item.key === state.selectedKey)) {
      state.selectedKey = items[0].key;
    }

    items.forEach((item) => {
      const actionability = actionabilityMeta(item);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `newsListItem${item.key === state.selectedKey ? " active" : ""}`;

      const top = document.createElement("div");
      top.className = "newsListItemTop";

      const main = document.createElement("div");
      main.className = "newsListItemMain";

      const title = document.createElement("h3");
      title.className = "newsListItemTitle";
      title.textContent = item.title;

      const sourceRow = document.createElement("div");
      sourceRow.className = "newsSourceRow";
      sourceRow.innerHTML = `
        <span>${item.sourceName}</span>
        <span>${formatStamp(item.publishedAt || item.firstSeenAt)}</span>
        <span>Impact ${item.score}</span>
        <span>Conf ${item.confidence ?? 50}%</span>
      `;

      const actionabilityRow = document.createElement("div");
      actionabilityRow.className = "newsActionabilityRow";
      actionabilityRow.appendChild(createTag(actionability.label, actionability.className));

      const snippet = document.createElement("div");
      snippet.className = "newsListItemSnippet";
      snippet.textContent = item.generatedSummary || item.summary || "Headline matched the active watchlist.";

      main.appendChild(title);
      main.appendChild(sourceRow);
      main.appendChild(actionabilityRow);
      main.appendChild(snippet);

      const meta = document.createElement("div");
      meta.className = "newsCardMeta";
      const dismissBtn = document.createElement("button");
      dismissBtn.type = "button";
      dismissBtn.className = "newsDismissBtn";
      dismissBtn.innerHTML = `
        <svg class="newsDismissGlyph" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
          <path d="M3 3L9 9M9 3L3 9"></path>
        </svg>
      `;
      dismissBtn.setAttribute("aria-label", `Hide ${item.title}`);
      dismissBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        dismissItem(item);
        if (state.selectedKey === item.key) {
          state.selectedKey = "";
        }
        renderItems();
      });
      meta.appendChild(dismissBtn);
      meta.appendChild(createTag(item.impact, item.impact));
      meta.appendChild(createTag(item.sourceTierLabel || "all sources", sourceTierTagClass(item)));
      if ((item.combinedCount || 1) > 1) {
        meta.appendChild(createTag(`${item.combinedCount} src`, "watch"));
      }
      if (isUnreadFresh(item)) {
        meta.appendChild(createTag("new", "immediate"));
      }
      meta.appendChild(createTag(item.bias, item.bias));

      top.appendChild(main);
      top.appendChild(meta);
      button.appendChild(top);
      button.addEventListener("click", () => {
        if (state.listMode === "fresh") {
          markFreshItemRead(item);
          state.listMode = "visible";
        }
        state.selectedKey = item.key;
        renderItems();
      });
      listRoot.appendChild(button);
    });

    renderDetail(items.find((item) => item.key === state.selectedKey) || items[0]);
  }

  async function loadNews(options = {}) {
    const { refresh = false } = options;
    refreshBtn.disabled = true;
    refreshBtn.textContent = refresh ? "Checking..." : "Check now";

    try {
      if (refresh) {
        await fetchJson(`/api/news/refresh?watchlist=${encodeURIComponent(state.watchlistId)}`);
      }

      const [statusResult, itemsResult] = await Promise.allSettled([
        fetchJson(`/api/news/status?watchlist=${encodeURIComponent(state.watchlistId)}`),
        fetchJson(
          `/api/news/items?watchlist=${encodeURIComponent(state.watchlistId)}&minScore=${encodeURIComponent(
            state.minScore
          )}&maxAgeHours=${encodeURIComponent(state.maxAgeHours)}&signalMode=${encodeURIComponent(
            state.signalMode
          )}&sourceMode=${encodeURIComponent(state.sourceMode)}&tradingMode=${encodeURIComponent(state.tradingMode)}`
        ),
      ]);

      if (statusResult.status === "rejected") {
        throw statusResult.reason;
      }

      const statusResponse = statusResult.value;
      state.status = statusResponse.status;
      state.clientError = "";

      if (itemsResult.status === "rejected") {
        state.clientError =
          itemsResult.reason instanceof Error ? itemsResult.reason.message : String(itemsResult.reason);
        state.items = [];
      } else {
        state.items = itemsResult.value.items || [];
      }

      let catalysts = null;

      try {
        const catalystsResponse = await fetchJson(
          `/api/news/catalysts?watchlist=${encodeURIComponent(state.watchlistId)}&hours=168`
        );
        catalysts = catalystsResponse.catalysts || null;
      } catch (error) {
        catalysts = {
          items: [],
          watchlistLabel: statusResponse.status?.label || state.watchlistId,
          windowHours: 168,
          sourceError: error instanceof Error ? error.message : String(error),
          disclaimer: "The catalyst panel is separate from the live feed.",
        };
      }

      state.catalysts = catalysts;
      processTradeNowNotifications(state.items);
      state.hasLoadedNewsOnce = true;
      renderStatus();
      loadMarketReaction().catch(() => {});
      renderCatalysts();
      renderGoldHourPanel();
      renderItems();
      renderTradeChecklist();
      renderGoldProjection();
    } catch (error) {
      state.status = {
        ...(state.status || {}),
        lastError: error instanceof Error ? error.message : String(error),
        feedCount: state.status?.feedCount || 0,
        pollMs: state.status?.pollMs || 90_000,
        symbols: state.status?.symbols || [],
        totalItems: state.status?.totalItems || 0,
        newItemCount: state.status?.newItemCount || 0,
      };
      state.clientError = "";
      renderStatus();
      renderMarketReaction();
      renderCatalysts();
      renderItems();
      renderTradeChecklist();
      renderGoldProjection();
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = "Check now";
      scheduleNextPoll(state.status?.lastError ? CLIENT_RETRY_MS : undefined);
    }
  }

  async function loadWatchlists() {
    const response = await fetchJson("/api/news/watchlists");
    state.watchlists = response.watchlists || [];
    if (!state.watchlists.some((watchlist) => watchlist.id === state.watchlistId) && state.watchlists[0]) {
      state.watchlistId = state.watchlists[0].id;
    }
    populateWatchlists();
  }

  function clearAutoPollingTimer() {
    if (state.timerHandle) {
      clearTimeout(state.timerHandle);
      state.timerHandle = null;
    }
  }

  function clearMarketReactionTimer() {
    if (state.marketTimerHandle) {
      clearInterval(state.marketTimerHandle);
      state.marketTimerHandle = null;
    }
  }

  function clearRelativeTimeTimer() {
    if (state.relativeTimeHandle) {
      clearInterval(state.relativeTimeHandle);
      state.relativeTimeHandle = null;
    }
  }

  function computeNextPollDelay() {
    const pollMs = Number(state.status?.pollMs) || 90_000;
    const lastSuccessfulPollAt = Date.parse(state.status?.lastSuccessfulPollAt || "");

    if (Number.isFinite(lastSuccessfulPollAt) && lastSuccessfulPollAt > 0) {
      const nextExpectedServerPollAt = lastSuccessfulPollAt + pollMs + CLIENT_POLL_BUFFER_MS;
      return clampDelay(nextExpectedServerPollAt - Date.now(), CLIENT_MIN_DELAY_MS, CLIENT_MAX_DELAY_MS);
    }

    return clampDelay(pollMs, CLIENT_RETRY_MS, CLIENT_MAX_DELAY_MS);
  }

  function scheduleNextPoll(delayOverride) {
    clearAutoPollingTimer();

    const requestedDelay = Number.isFinite(delayOverride) ? delayOverride : computeNextPollDelay();
    const delay = clampDelay(requestedDelay, CLIENT_MIN_DELAY_MS, CLIENT_MAX_DELAY_MS);

    state.timerHandle = setTimeout(() => {
      state.timerHandle = null;

      if (document.hidden) {
        return;
      }

      if (!state.initialized) {
        bootstrap().catch(() => {});
        return;
      }

      loadNews().catch(() => {});
    }, delay);
  }

  function startAutoPolling() {
    scheduleNextPoll(CLIENT_MIN_DELAY_MS);
  }

  function startMarketReactionPolling() {
    clearMarketReactionTimer();
    state.marketTimerHandle = setInterval(() => {
      if (!document.hidden) {
        loadMarketReaction().catch(() => {});
      }
    }, MARKET_REACTION_POLL_MS);
  }

  function startRelativeTimePolling() {
    clearRelativeTimeTimer();
    state.relativeTimeHandle = setInterval(() => {
      refreshRelativeTimeLabels();
    }, RELATIVE_TIME_REFRESH_MS);
  }

  async function bootstrap() {
    try {
      await loadWatchlists();
      await loadNews();
      await loadMarketReaction();
      startMarketReactionPolling();
      startRelativeTimePolling();
      state.initialized = true;
    } catch (error) {
      state.initialized = false;
      state.status = {
        id: state.watchlistId,
        label: "News monitor",
        description: "Waiting for the local news service to become available.",
        symbols: [],
        totalItems: 0,
        newItemCount: 0,
        feedCount: 0,
        pollMs: 20_000,
        lastError: error instanceof Error ? error.message : String(error),
      };
      renderStatus();
      renderItems();
      throw error;
    }
  }

  watchlistSelect.addEventListener("change", () => {
    state.watchlistId = watchlistSelect.value;
    state.detailCache = {};
    state.listMode = "visible";
    loadMarketReaction().catch(() => {});
    loadNews().catch(() => {});
  });

  minScoreSelect.addEventListener("change", () => {
    state.minScore = Number(minScoreSelect.value || 4);
    state.listMode = "visible";
    loadNews().catch(() => {});
  });

  timelinessSelect.addEventListener("change", () => {
    state.maxAgeHours = Number(timelinessSelect.value || 12);
    state.listMode = "visible";
    loadNews().catch(() => {});
  });

  newsTypeSelect.addEventListener("change", () => {
    state.newsType = newsTypeSelect.value || "moving";
    const modes = newsTypeModes(state.newsType);
    state.signalMode = modes.signalMode;
    state.sourceMode = modes.sourceMode;
    state.tradingMode = modes.tradingMode;
    state.listMode = "visible";
    loadNews().catch(() => {});
  });

  sortSelect.addEventListener("change", () => {
    state.sortMode = sortSelect.value || "latest";
    renderItems();
  });

  refreshBtn.addEventListener("click", () => {
    loadNews({ refresh: true }).catch(() => {});
  });

  if (goldHourSummaryBtn) {
    goldHourSummaryBtn.addEventListener("click", () => {
      state.goldSummaryOpen = true;
      if (!state.goldSummary) {
        loadGoldSummary().catch(() => {});
        return;
      }
      renderGoldSummaryPanel();
    });
  }

  function closeGoldSummaryModal() {
    state.goldSummaryOpen = false;
    renderGoldSummaryPanel();
  }

  if (goldSummaryBackdrop) {
    goldSummaryBackdrop.addEventListener("click", closeGoldSummaryModal);
  }

  if (goldSummaryCloseBtn) {
    goldSummaryCloseBtn.addEventListener("click", closeGoldSummaryModal);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.goldSummaryOpen) {
      closeGoldSummaryModal();
    }
  });

  if (notificationSoundBtn) {
    renderSoundToggle();
    notificationSoundBtn.addEventListener("click", () => {
      state.soundEnabled = !state.soundEnabled;
      persistSoundEnabled();
      renderSoundToggle();
      if (state.soundEnabled) {
        playSoftTradeNowSound();
      }
    });
  }

  visibleBtn.addEventListener("click", () => {
    state.listMode = "visible";
    renderItems();
  });

  freshBtn.addEventListener("click", () => {
    state.listMode = "fresh";
    renderItems();
  });

  freshBtn.addEventListener("dblclick", () => {
    markAllFreshItemsRead();
    state.listMode = "visible";
    renderItems();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearAutoPollingTimer();
      clearMarketReactionTimer();
      clearRelativeTimeTimer();
      return;
    }

    if (!state.initialized) {
      scheduleNextPoll(CLIENT_MIN_DELAY_MS);
      bootstrap().catch(() => {});
      return;
    }

    startMarketReactionPolling();
    startRelativeTimePolling();
    refreshRelativeTimeLabels();
    loadMarketReaction().catch(() => {});
    loadNews().catch(() => {});
  });

  startAutoPolling();
  bootstrap().catch(() => {});
})();
