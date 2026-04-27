(function () {
  const watchlistSelect = document.getElementById("newsWatchlistSelect");
  const minScoreField = document.getElementById("newsMinScoreField");
  const minScoreDot = document.getElementById("newsMinScoreDot");
  const minScoreSelect = document.getElementById("newsMinScoreSelect");
  const timelinessSelect = document.getElementById("newsTimelinessSelect");
  const newsTypeSelect = document.getElementById("newsTypeSelect");
  const sortSelect = document.getElementById("newsSortSelect");
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
  const marketReactionGrid = document.getElementById("marketReactionGrid");
  const catalystWindowLabel = document.getElementById("newsCatalystWindowLabel");
  const catalystSummary = document.getElementById("newsCatalystSummary");
  const catalystList = document.getElementById("newsCatalystList");
  const CLIENT_POLL_BUFFER_MS = 2_500;
  const CLIENT_RETRY_MS = 15_000;
  const CLIENT_MIN_DELAY_MS = 10_000;
  const CLIENT_MAX_DELAY_MS = 180_000;
  const MARKET_REACTION_POLL_MS = 5_000;

  if (!watchlistSelect || !listRoot || !sortSelect || !timelinessSelect || !newsTypeSelect) return;

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
    items: [],
    catalysts: null,
    marketReaction: null,
    selectedKey: "",
    detailCache: {},
    readFreshKeys: loadReadFreshKeys(),
    dismissedKeys: loadDismissedKeys(),
    listMode: "visible",
    sortMode: sortSelect.value || "latest",
    timerHandle: null,
    marketTimerHandle: null,
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

  function clear(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function clampDelay(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
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
      statusPill.textContent = "Feed issue";
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
    feedSummary.textContent = `${healthyFeedCount}/${status.feedCount} feeds healthy, polling every ${Math.round(status.pollMs / 1000)}s. Showing ${state.maxAgeHours}h ${newsTypeLabel}. Keeping ${status.totalItems} tracked headlines in memory. Last successful check ${formatRelativeTime(status.lastSuccessfulPollAt)}.`;
    renderFeedList(status);

    errorBox.hidden = !status.lastError && feedErrorCount === 0;
    errorBox.textContent = status.lastError
      ? `Feed fetch error: ${status.lastError}. The app is still running, but outbound network may be blocked.`
      : feedErrorCount
        ? `Partial feed warning: ${status.feedErrors
            .slice(0, 4)
            .map((feedError) => feedError.label)
            .join(", ")} did not load. Other feeds are still active.`
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
        if (!source.url) {
          const chip = document.createElement("span");
          chip.className = "catalystSourceChip";
          chip.textContent = source.label;
          sources.appendChild(chip);
          return;
        }

        const link = document.createElement("a");
        link.className = "catalystSourceChip";
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = source.label;
        sources.appendChild(link);
      });

      body.appendChild(header);
      body.appendChild(meta);
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

  function renderMarketReaction() {
    if (!marketReactionSummary || !marketReactionBias || !marketReactionGrid) {
      return;
    }

    const payload = state.marketReaction || {};
    const reaction = payload.reaction || {};
    const items = Array.isArray(payload.items) ? payload.items : [];

    clear(marketReactionGrid);
    marketReactionSummary.textContent = items.length
      ? `${payload.sourceLabel || "Market data"} | ${formatRelativeTime(payload.generatedAt)}`
      : "Waiting for live market data...";
    marketReactionBias.className = `marketReactionBias ${reaction.bias || "mixed"}`;
    marketReactionBias.innerHTML = "";

    const title = document.createElement("strong");
    title.textContent = reaction.title || "Waiting for confirmation";
    const summary = document.createElement("span");
    summary.textContent = reaction.summary || "The market reaction read will appear when prices load.";
    marketReactionBias.appendChild(title);
    marketReactionBias.appendChild(summary);

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "marketReactionEmpty";
      empty.textContent = (payload.errors || []).length
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

      const role = document.createElement("div");
      role.className = "marketReactionRole";
      role.textContent = item.role === "yield" ? "rates driver" : item.role === "dollar" ? "dollar driver" : item.role;

      card.appendChild(top);
      card.appendChild(price);
      card.appendChild(role);
      marketReactionGrid.appendChild(card);
    });
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
    }

    renderMarketReaction();
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
    title.textContent = reaction.title || "Price reaction unavailable";
    const statePill = document.createElement("span");
    statePill.className = `newsPriceReactionState ${reaction.confirmation || "mixed"}`;
    statePill.textContent =
      reaction.confirmation === "bullish"
        ? "Confirming"
        : reaction.confirmation === "bearish"
          ? "Confirming"
          : reaction.confirmation === "conflict"
            ? "Conflicting"
            : "Still forming";
    head.appendChild(title);
    head.appendChild(statePill);

    const summary = document.createElement("p");
    summary.className = "newsPriceReactionSummary";
    summary.textContent = reaction.summary || "Not enough market data is available for this headline yet.";

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

      const [statusResponse, itemsResponse] = await Promise.all([
        fetchJson(`/api/news/status?watchlist=${encodeURIComponent(state.watchlistId)}`),
        fetchJson(
          `/api/news/items?watchlist=${encodeURIComponent(state.watchlistId)}&minScore=${encodeURIComponent(
            state.minScore
          )}&maxAgeHours=${encodeURIComponent(state.maxAgeHours)}&signalMode=${encodeURIComponent(
            state.signalMode
          )}&sourceMode=${encodeURIComponent(state.sourceMode)}&tradingMode=${encodeURIComponent(state.tradingMode)}`
        ),
      ]);
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

      state.status = statusResponse.status;
      state.items = itemsResponse.items || [];
      state.catalysts = catalysts;
      renderStatus();
      loadMarketReaction().catch(() => {});
      renderCatalysts();
      renderItems();
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
      renderStatus();
      renderMarketReaction();
      renderCatalysts();
      renderItems();
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

  async function bootstrap() {
    try {
      await loadWatchlists();
      await loadNews();
      await loadMarketReaction();
      startMarketReactionPolling();
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
      return;
    }

    if (!state.initialized) {
      scheduleNextPoll(CLIENT_MIN_DELAY_MS);
      bootstrap().catch(() => {});
      return;
    }

    startMarketReactionPolling();
    loadMarketReaction().catch(() => {});
    loadNews().catch(() => {});
  });

  startAutoPolling();
  bootstrap().catch(() => {});
})();
