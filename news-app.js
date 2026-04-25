(function () {
  const watchlistSelect = document.getElementById("newsWatchlistSelect");
  const minScoreField = document.getElementById("newsMinScoreField");
  const minScoreDot = document.getElementById("newsMinScoreDot");
  const minScoreSelect = document.getElementById("newsMinScoreSelect");
  const timelinessSelect = document.getElementById("newsTimelinessSelect");
  const signalSelect = document.getElementById("newsSignalSelect");
  const sourceSelect = document.getElementById("newsSourceSelect");
  const tradingSelect = document.getElementById("newsTradingSelect");
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
  const detailReferences = document.getElementById("newsDetailReferences");
  const detailTags = document.getElementById("newsDetailTags");
  const detailSourceLink = document.getElementById("newsDetailSourceLink");
  const bullishProb = document.getElementById("newsBullishProb");
  const bearishProb = document.getElementById("newsBearishProb");
  const catalystWindowLabel = document.getElementById("newsCatalystWindowLabel");
  const catalystSummary = document.getElementById("newsCatalystSummary");
  const catalystList = document.getElementById("newsCatalystList");
  const CLIENT_POLL_BUFFER_MS = 2_500;
  const CLIENT_RETRY_MS = 15_000;
  const CLIENT_MIN_DELAY_MS = 10_000;
  const CLIENT_MAX_DELAY_MS = 180_000;

  if (!watchlistSelect || !listRoot || !sortSelect || !timelinessSelect || !signalSelect || !sourceSelect || !tradingSelect) return;

  const state = {
    watchlists: [],
    watchlistId: "xauusd",
    minScore: Number(minScoreSelect.value || 12),
    maxAgeHours: Number(timelinessSelect.value || 12),
    signalMode: signalSelect.value || "realtime",
    sourceMode: sourceSelect.value || "established",
    tradingMode: tradingSelect.value || "tradeable",
    status: null,
    items: [],
    catalysts: null,
    selectedKey: "",
    detailCache: {},
    readFreshKeys: loadReadFreshKeys(),
    dismissedKeys: loadDismissedKeys(),
    listMode: "visible",
    sortMode: sortSelect.value || "latest",
    timerHandle: null,
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
    const modeLabel =
      state.signalMode === "realtime" ? "real-time only" : state.signalMode === "balanced" ? "balanced" : "broader context";
    const sourceLabel =
      state.sourceMode === "top"
        ? "top-tier sources"
        : state.sourceMode === "trusted"
          ? "trusted+ sources"
          : state.sourceMode === "all"
            ? "all sources"
            : "established+ sources";
    const tradingLabel =
      state.tradingMode === "tradeable" ? "tradeable now" : state.tradingMode === "support" ? "decision support" : "all filtered";
    feedSummary.textContent = `${status.feedCount} feeds, polling every ${Math.round(status.pollMs / 1000)}s. Showing ${state.maxAgeHours}h ${modeLabel} headlines from ${sourceLabel} in ${tradingLabel} mode. Keeping ${status.totalItems} tracked headlines in memory. Last successful check ${formatRelativeTime(status.lastSuccessfulPollAt)}.`;
    renderFeedList(status);

    errorBox.hidden = !status.lastError;
    errorBox.textContent = status.lastError
      ? `Feed fetch error: ${status.lastError}. The app is still running, but outbound network may be blocked.`
      : "";
  }

  function renderCatalysts() {
    if (!catalystList || !catalystSummary || !catalystWindowLabel) {
      return;
    }

    const payload = state.catalysts || {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    const highImpactCount = items.filter((item) => item.impact === "high").length;

    clear(catalystList);
    catalystWindowLabel.textContent = `${payload.watchlistLabel || "Active watchlist"} | next ${
      payload.windowHours || 168
    }h | separate from FinancialJuice`;
    catalystSummary.textContent = items.length
      ? `${items.length} scheduled risk windows, including ${highImpactCount} high-impact catalyst${
          highImpactCount === 1 ? "" : "s"
        }. ${payload.disclaimer || "Estimated scheduled risk windows."}`
      : "No catalyst windows found for the selected watchlist.";

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "catalystEmpty";
      empty.textContent = "No upcoming catalyst windows in this model yet.";
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
      header.appendChild(title);
      header.appendChild(impact);

      const meta = document.createElement("div");
      meta.className = "catalystMeta";
      meta.textContent = `${item.category || "Catalyst"} | ${item.sourceLabel || "Desk catalyst model"}`;

      const reason = document.createElement("p");
      reason.className = "catalystReason";
      reason.textContent = item.whyItMatters || "Relevant to the active watchlist.";

      const risk = document.createElement("p");
      risk.className = "catalystRisk";
      risk.textContent = item.tradeRisk || "Use timing as a risk-control marker.";

      body.appendChild(header);
      body.appendChild(meta);
      body.appendChild(reason);
      body.appendChild(risk);
      card.appendChild(timeBlock);
      card.appendChild(body);
      catalystList.appendChild(card);
    });
  }

  function createTag(label, className) {
    const tag = document.createElement("span");
    tag.className = `tagPill ${className}`.trim();
    tag.textContent = label;
    return tag;
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
      detailWhy.textContent = "Trading context will appear here.";
      detailSourceLink.href = "#";
      detailSourceLink.textContent = "source";
      detailSourceLink.setAttribute("aria-disabled", "true");
      return;
    }

    detailTitle.textContent = item.title;
    detailMeta.textContent =
      `${item.sourceName} | ${formatStamp(item.publishedAt || item.firstSeenAt)} | Score ${item.score} | Confidence ${item.confidence ?? 50}%`;
    detailSummary.textContent = "Loading article summary...";
    detailMeaning.textContent = "Loading overall takeaway...";
    detailWhy.textContent = item.whyItMatters || "Matched the active watchlist and impact filter.";
    detailSourceLink.href = item.link;
    detailSourceLink.textContent = item.sourceName || "Open article";
    detailSourceLink.removeAttribute("aria-disabled");

    detailTags.appendChild(createTag(`${item.impact} impact`, item.impact));
    detailTags.appendChild(createTag(`${item.confidenceBand || "medium"} confidence`, item.confidenceBand || "medium"));
    detailTags.appendChild(createTag(item.sourceTierLabel || "all sources", sourceTierTagClass(item)));
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
        <span>Score ${item.score}</span>
        <span>Conf ${item.confidence ?? 50}%</span>
      `;

      const snippet = document.createElement("div");
      snippet.className = "newsListItemSnippet";
      snippet.textContent = item.generatedSummary || item.whyItMatters || "Matched the active watchlist and impact filter.";

      main.appendChild(title);
      main.appendChild(sourceRow);
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

      const [statusResponse, itemsResponse, catalystsResponse] = await Promise.all([
        fetchJson(`/api/news/status?watchlist=${encodeURIComponent(state.watchlistId)}`),
        fetchJson(
          `/api/news/items?watchlist=${encodeURIComponent(state.watchlistId)}&minScore=${encodeURIComponent(
            state.minScore
          )}&maxAgeHours=${encodeURIComponent(state.maxAgeHours)}&signalMode=${encodeURIComponent(
            state.signalMode
          )}&sourceMode=${encodeURIComponent(state.sourceMode)}&tradingMode=${encodeURIComponent(state.tradingMode)}`
        ),
        fetchJson(`/api/news/catalysts?watchlist=${encodeURIComponent(state.watchlistId)}&hours=168`),
      ]);

      state.status = statusResponse.status;
      state.items = itemsResponse.items || [];
      state.catalysts = catalystsResponse.catalysts || null;
      renderStatus();
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

  async function bootstrap() {
    try {
      await loadWatchlists();
      await loadNews();
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

  signalSelect.addEventListener("change", () => {
    state.signalMode = signalSelect.value || "realtime";
    state.listMode = "visible";
    loadNews().catch(() => {});
  });

  sourceSelect.addEventListener("change", () => {
    state.sourceMode = sourceSelect.value || "established";
    state.listMode = "visible";
    loadNews().catch(() => {});
  });

  tradingSelect.addEventListener("change", () => {
    state.tradingMode = tradingSelect.value || "tradeable";
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
      return;
    }

    if (!state.initialized) {
      scheduleNextPoll(CLIENT_MIN_DELAY_MS);
      bootstrap().catch(() => {});
      return;
    }

    loadNews().catch(() => {});
  });

  startAutoPolling();
  bootstrap().catch(() => {});
})();
