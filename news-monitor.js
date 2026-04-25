const DEFAULT_POLL_MS = Number(process.env.NEWS_POLL_MS || 60_000);
const MAX_ITEMS = 120;
const ITEM_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

const WATCHLISTS = {
  nasdaq: {
    id: "nasdaq",
    label: "NASDAQ",
    description: "US tech, rates, semiconductors, and earnings that can move the Nasdaq.",
    symbols: ["QQQ", "NDX", "NVDA", "MSFT", "AAPL", "AMZN", "META", "GOOGL", "AMD", "AVGO", "NFLX", "TSM"],
    feeds: [
      {
        id: "nasdaq-headlines",
        label: "Nasdaq Search",
        url: "https://news.google.com/rss/search?q=NASDAQ+OR+\"US+tech+stocks\"+when:12h+-analysis+-opinion+-forecast&hl=en-US&gl=US&ceid=US:en",
      },
      {
        id: "rates-and-fed",
        label: "Fed / Rates",
        url: "https://news.google.com/rss/search?q=Federal+Reserve+OR+inflation+OR+treasury+yields+OR+payrolls+when:12h+-analysis+-opinion+-forecast&hl=en-US&gl=US&ceid=US:en",
      },
      {
        id: "semis-and-ai",
        label: "Semiconductors / AI",
        url: "https://news.google.com/rss/search?q=semiconductor+OR+AI+chips+OR+Nvidia+OR+TSMC+when:12h+-analysis+-opinion+-forecast&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    focusKeywords: [
      "nasdaq",
      "tech stocks",
      "semiconductor",
      "chip",
      "ai",
      "earnings",
      "guidance",
      "fed",
      "fomc",
      "treasury yields",
      "inflation",
      "payrolls",
      "jobless claims",
      "tariffs",
      "oil",
      "apple",
      "microsoft",
      "nvidia",
      "amazon",
      "alphabet",
      "meta",
      "tesla",
      "netflix",
      "tsmc",
      "amd",
      "broadcom",
    ],
  },
  xauusd: {
    id: "xauusd",
    label: "XAUUSD",
    description: "Gold-sensitive macro, central bank, yield, dollar, and geopolitical headlines.",
    symbols: ["XAUUSD", "DXY", "US10Y", "GLD"],
    feeds: [
      {
        id: "gold-search",
        label: "Gold Search",
        url: "https://news.google.com/rss/search?q=gold+prices+OR+XAUUSD+OR+bullion+when:12h+-analysis+-opinion+-forecast&hl=en-US&gl=US&ceid=US:en",
      },
      {
        id: "macro-search",
        label: "Macro / Fed",
        url: "https://news.google.com/rss/search?q=Federal+Reserve+OR+inflation+OR+jobs+OR+treasury+yields+OR+dollar+when:12h+-analysis+-opinion+-forecast&hl=en-US&gl=US&ceid=US:en",
      },
      {
        id: "geopolitics-search",
        label: "Geopolitics / Oil",
        url: "https://news.google.com/rss/search?q=Middle+East+OR+oil+OR+sanctions+OR+war+when:12h+-analysis+-opinion+-forecast&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    focusKeywords: [
      "gold",
      "xauusd",
      "bullion",
      "fed",
      "fomc",
      "inflation",
      "pce",
      "cpi",
      "yields",
      "treasury",
      "dollar",
      "geopolitics",
      "war",
      "oil",
      "sanctions",
      "central bank",
    ],
  },
  btc: {
    id: "btc",
    label: "BTC",
    description: "Bitcoin, ETF flow, regulation, exchange, and risk-appetite headlines.",
    symbols: ["BTCUSD", "ETHUSD", "COIN", "MSTR", "IBIT"],
    feeds: [
      {
        id: "bitcoin-search",
        label: "Bitcoin Search",
        url: "https://news.google.com/rss/search?q=Bitcoin+OR+BTC+OR+crypto+when:12h+-analysis+-opinion+-forecast&hl=en-US&gl=US&ceid=US:en",
      },
      {
        id: "crypto-regulation",
        label: "Crypto Regulation",
        url: "https://news.google.com/rss/search?q=SEC+crypto+OR+ETF+flows+OR+stablecoin+OR+exchange+when:12h+-analysis+-opinion+-forecast&hl=en-US&gl=US&ceid=US:en",
      },
      {
        id: "risk-sentiment",
        label: "Macro Risk Appetite",
        url: "https://news.google.com/rss/search?q=Federal+Reserve+OR+liquidity+OR+risk+appetite+when:12h+-analysis+-opinion+-forecast&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    focusKeywords: [
      "bitcoin",
      "btc",
      "crypto",
      "etf",
      "sec",
      "stablecoin",
      "exchange",
      "regulation",
      "liquidity",
      "risk appetite",
      "coinbase",
      "microstrategy",
    ],
  },
};

const CATALYST_WINDOW_HOURS = 168;
const CATALYST_MAX_ITEMS = 14;
const NEW_YORK_TIME_ZONE = "America/New_York";

const CATALYST_DEFINITIONS = [
  {
    id: "us-cpi",
    title: "US CPI inflation release window",
    category: "Inflation",
    impact: "high",
    watchlists: ["nasdaq", "xauusd", "btc"],
    schedule: (now, end) => monthlyEtCandidates(now, end, ({ year, monthIndex }) => nthWeekdayOfMonth(year, monthIndex, 3, 2), 8, 30),
    whyItMatters: "Can quickly reprice Fed expectations, Treasury yields, the dollar, gold, growth stocks, and crypto beta.",
    tradeRisk: "Expect spread widening and fast first-minute moves around the 08:30 ET data window.",
  },
  {
    id: "us-pce",
    title: "US PCE inflation release window",
    category: "Inflation",
    impact: "high",
    watchlists: ["nasdaq", "xauusd", "btc"],
    schedule: (now, end) => monthlyEtCandidates(now, end, ({ year, monthIndex }) => lastWeekdayOfMonth(year, monthIndex, 5), 8, 30),
    whyItMatters: "The Fed's preferred inflation gauge can move front-end rates, real yields, gold, and risk appetite.",
    tradeRisk: "Treat the first 15 minutes as high-noise confirmation, not a clean signal.",
  },
  {
    id: "us-nfp",
    title: "US nonfarm payrolls release window",
    category: "Labor",
    impact: "high",
    watchlists: ["nasdaq", "xauusd", "btc"],
    schedule: (now, end) => monthlyEtCandidates(now, end, ({ year, monthIndex }) => nthWeekdayOfMonth(year, monthIndex, 5, 1), 8, 30),
    whyItMatters: "Payrolls can reset rate-cut timing, dollar direction, yields, and equity-index volatility.",
    tradeRisk: "Watch revisions and wage data before trusting the first headline reaction.",
  },
  {
    id: "jobless-claims",
    title: "US weekly jobless claims",
    category: "Labor",
    impact: "medium",
    watchlists: ["nasdaq", "xauusd"],
    schedule: (now, end) => weeklyEtCandidates(now, end, 4, 8, 30),
    whyItMatters: "A timely labor-market pulse that can affect yields, Fed pricing, gold, and tech multiples.",
    tradeRisk: "Normally medium impact, but it becomes high impact when markets are focused on growth slowdown risk.",
  },
  {
    id: "ism-window",
    title: "US ISM activity data window",
    category: "Growth",
    impact: "medium",
    watchlists: ["nasdaq", "xauusd"],
    schedule: (now, end) => monthlyEtCandidates(now, end, ({ year, monthIndex }) => firstBusinessDayOfMonth(year, monthIndex), 10, 0),
    whyItMatters: "New orders, prices paid, and employment sub-indexes can shift growth and inflation expectations.",
    tradeRisk: "Look for confirmation from yields and the dollar before assuming trend continuation.",
  },
  {
    id: "fed-risk-window",
    title: "Fed communication risk window",
    category: "Rates",
    impact: "high",
    watchlists: ["nasdaq", "xauusd", "btc"],
    schedule: (now, end) => weeklyEtCandidates(now, end, 3, 14, 0),
    whyItMatters: "Policy language and speaker guidance can change rate-path pricing even without a data release.",
    tradeRisk: "Headline risk is asymmetric when positioning is crowded around cuts, inflation, or recession trades.",
  },
  {
    id: "treasury-supply",
    title: "US Treasury supply and auction window",
    category: "Rates",
    impact: "medium",
    watchlists: ["nasdaq", "xauusd"],
    schedule: (now, end) => [2, 3, 4].flatMap((weekday) => weeklyEtCandidates(now, end, weekday, 13, 0)),
    whyItMatters: "Auction demand and supply pressure can move yields, the dollar, gold, and long-duration equities.",
    tradeRisk: "Weak demand matters most when yields are already near breakout levels.",
  },
  {
    id: "nasdaq-earnings",
    title: "Mega-cap tech earnings risk window",
    category: "Earnings",
    impact: "high",
    watchlists: ["nasdaq"],
    schedule: (now, end) => [2, 4].flatMap((weekday) => weeklyEtCandidates(now, end, weekday, 16, 5)),
    whyItMatters: "Large-cap tech guidance can drive Nasdaq futures, semiconductor sentiment, and index breadth.",
    tradeRisk: "After-hours liquidity can exaggerate gaps before the next cash session confirms the move.",
  },
  {
    id: "semis-asia",
    title: "Asia semiconductor supply-chain window",
    category: "Semis",
    impact: "medium",
    watchlists: ["nasdaq"],
    schedule: (now, end) => [1, 3].flatMap((weekday) => weeklyUtcCandidates(now, end, weekday, 1, 0)),
    whyItMatters: "Taiwan, Korea, Japan, and China headlines can affect AI-chip supply, export controls, and premarket semis.",
    tradeRisk: "Best confirmation usually comes from NVDA, AMD, TSM, and SOX futures/ADRs.",
  },
  {
    id: "eia-crude",
    title: "US crude inventory report",
    category: "Energy",
    impact: "medium",
    watchlists: ["xauusd"],
    schedule: (now, end) => weeklyEtCandidates(now, end, 3, 10, 30),
    whyItMatters: "Oil shocks can feed inflation expectations, geopolitical risk premium, and gold-safe-haven demand.",
    tradeRisk: "Gold impact is usually indirect; prioritize dollar, yields, and geopolitical context.",
  },
  {
    id: "london-ny-gold",
    title: "Gold London-New York liquidity handoff",
    category: "Liquidity",
    impact: "medium",
    watchlists: ["xauusd"],
    schedule: (now, end) => weekdayEtCandidates(now, end, 8, 20),
    whyItMatters: "The overlap around US data and New York liquidity often decides whether gold follows yields or safe-haven flows.",
    tradeRisk: "Avoid treating pre-US-session drift as confirmed until the dollar and real-yield reaction is visible.",
  },
  {
    id: "btc-etf-flow",
    title: "US spot crypto ETF flow window",
    category: "Crypto flows",
    impact: "medium",
    watchlists: ["btc"],
    schedule: (now, end) => weekdayEtCandidates(now, end, 21, 15),
    whyItMatters: "ETF flow updates can influence overnight BTC sentiment and the next US-session setup.",
    tradeRisk: "Flow headlines matter more when price is testing a key liquidation or breakout level.",
  },
  {
    id: "crypto-regulatory",
    title: "Crypto regulatory and court docket window",
    category: "Regulation",
    impact: "medium",
    watchlists: ["btc"],
    schedule: (now, end) => [2, 4].flatMap((weekday) => weeklyEtCandidates(now, end, weekday, 10, 0)),
    whyItMatters: "SEC, exchange, stablecoin, and court headlines can change risk appetite across BTC, ETH, COIN, and MSTR.",
    tradeRisk: "Regulatory headlines can reverse quickly; look for confirmation in spot volume and ETF proxies.",
  },
  {
    id: "weekend-crypto",
    title: "Weekend crypto liquidity risk window",
    category: "Liquidity",
    impact: "medium",
    watchlists: ["btc"],
    schedule: (now, end) => [0, 6].flatMap((weekday) => weeklyUtcCandidates(now, end, weekday, 0, 0)),
    whyItMatters: "Thinner weekend books can amplify liquidation cascades and macro/geopolitical headline reactions.",
    tradeRisk: "Use wider thresholds; moves can be liquidity-driven rather than information-driven.",
  },
];

const CATEGORY_RULES = [
  { id: "macro", label: "Macro", keywords: ["inflation", "cpi", "pce", "payrolls", "jobs", "jobless claims", "retail sales", "gdp"] },
  { id: "rates", label: "Rates", keywords: ["fed", "fomc", "treasury", "yield", "rate cut", "rate hike", "bond"] },
  { id: "earnings", label: "Earnings", keywords: ["earnings", "guidance", "forecast", "results", "revenue", "profit", "margin"] },
  { id: "semis", label: "Semis", keywords: ["semiconductor", "chip", "nvidia", "amd", "broadcom", "tsmc", "asml"] },
  { id: "geopolitics", label: "Geopolitics", keywords: ["war", "missile", "sanctions", "strait", "oil", "tariff", "export curbs"] },
  { id: "crypto", label: "Crypto", keywords: ["bitcoin", "btc", "crypto", "etf", "stablecoin", "exchange", "token"] },
];

const SYMBOL_RULES = [
  { symbols: ["QQQ", "NDX"], keywords: ["nasdaq", "tech stocks", "futures", "treasury", "yield", "fed", "inflation"] },
  { symbols: ["NVDA", "AMD", "AVGO", "TSM"], keywords: ["nvidia", "amd", "broadcom", "tsmc", "semiconductor", "chip", "ai server"] },
  { symbols: ["MSFT", "AMZN", "META", "GOOGL"], keywords: ["cloud", "ai spending", "ad revenue", "microsoft", "amazon", "meta", "alphabet", "google"] },
  { symbols: ["AAPL"], keywords: ["apple", "iphone", "app store", "china demand"] },
  { symbols: ["NFLX"], keywords: ["netflix", "subscriber"] },
  { symbols: ["TSLA"], keywords: ["tesla", "ev", "autonomous"] },
  { symbols: ["XAUUSD", "DXY", "US10Y"], keywords: ["gold", "bullion", "dollar", "yield", "treasury"] },
  { symbols: ["BTCUSD", "ETHUSD", "COIN", "MSTR", "IBIT"], keywords: ["bitcoin", "btc", "crypto", "coinbase", "microstrategy", "etf"] },
];

const HIGH_IMPACT_KEYWORDS = [
  "fed",
  "fomc",
  "inflation",
  "cpi",
  "pce",
  "payrolls",
  "jobless claims",
  "treasury yield",
  "earnings",
  "guidance",
  "forecast",
  "tariff",
  "sanctions",
  "oil",
  "war",
  "export curbs",
  "missile",
  "etf",
];

const URGENT_KEYWORDS = [
  "breaking",
  "live",
  "just in",
  "beat",
  "miss",
  "cuts forecast",
  "raises forecast",
  "surges",
  "slides",
  "plunges",
  "rallies",
  "rate cut",
  "rate hike",
  "attack",
  "closed",
  "reopens",
];

const BULLISH_KEYWORDS = [
  "beats",
  "beat",
  "raises",
  "growth",
  "rally",
  "surges",
  "gains",
  "cooling inflation",
  "rate cut",
  "reopens",
  "record high",
];

const BEARISH_KEYWORDS = [
  "misses",
  "miss",
  "cuts",
  "warns",
  "slides",
  "drops",
  "fall",
  "hotter inflation",
  "higher yields",
  "tariffs",
  "attack",
  "closed",
  "sanctions",
];

const TITLE_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "of",
  "on",
  "or",
  "the",
  "to",
  "up",
  "with",
  "amid",
  "after",
  "latest",
  "says",
  "say",
  "news",
  "price",
  "prices",
  "market",
  "markets",
  "forecast",
  "update",
]);

const SOURCE_QUALITY_RULES = [
  { pattern: /\breuters\b/i, score: 2.8 },
  { pattern: /\bbloomberg\b/i, score: 2.6 },
  { pattern: /\bassociated press\b|\bap news\b/i, score: 2.4 },
  { pattern: /\bfinancial times\b|\bft\b/i, score: 2.4 },
  { pattern: /\bwall street journal\b|\bwsj\b/i, score: 2.4 },
  { pattern: /\bnew york times\b/i, score: 2.2 },
  { pattern: /\bcnbc\b/i, score: 2.0 },
  { pattern: /\bmarketwatch\b|\binvesting\.com\b/i, score: 1.8 },
  { pattern: /\bthe economic times\b|\bmoneycontrol\b|\bwsj\b/i, score: 1.5 },
  { pattern: /\bmsn\b/i, score: 0.6 },
  { pattern: /\bdailyhunt\b/i, score: 0.2 },
  { pattern: /\bwhalesbook\b/i, score: 0.1 },
];

const LOW_SIGNAL_KEYWORDS = [
  "music",
  "record label",
  "movie",
  "film",
  "tv",
  "television",
  "celebrity",
  "fashion",
  "recipe",
  "travel",
  "sports",
  "football",
  "basketball",
  "cricket",
  "festival",
  "gaming",
  "video game",
];

const EXPLAINER_OPENERS = ["how", "why", "what", "can", "will", "should", "could", "would"];

const EXPLAINER_PHRASES = [
  "reasons why",
  "what it means",
  "what this means",
  "explainer",
  "explained",
  "analysis",
  "opinion",
  "column",
  "editorial",
  "how to",
  "week ahead",
  "preview",
  "outlook",
  "latest updates",
  "live updates",
  "as it happened",
  "everything to know",
];

const NON_EVENT_PHRASES = [
  "forecast",
  "price prediction",
  "round-up",
  "round up",
  "recap",
  "to buy",
  "to play",
  "heads toward",
  "ahead of",
  "before the",
  "week ahead",
  "preview",
  "outlook",
  "watchlist",
  "best stocks",
  "top stocks",
];

const HARD_SUPPRESS_PHRASES = [
  "forecast",
  "price prediction",
  "round-up",
  "round up",
  "weekend round-up",
  "weekend round up",
  "recap",
  "to buy",
  "to play",
  "heads toward",
  "reasons why",
  "what it means",
  "what this means",
];

const EVENT_SIGNAL_KEYWORDS = [
  "rises",
  "rise",
  "falls",
  "fall",
  "drops",
  "drop",
  "slides",
  "slide",
  "slumps",
  "slump",
  "surges",
  "surge",
  "jumps",
  "jump",
  "sinks",
  "sink",
  "rallies",
  "rally",
  "beats",
  "beat",
  "misses",
  "miss",
  "warns",
  "warn",
  "cuts",
  "cut",
  "raises",
  "raise",
  "hikes",
  "hike",
  "holds rates",
  "holds steady",
  "approves",
  "approve",
  "blocks",
  "block",
  "delays",
  "delay",
  "extends",
  "extend",
  "eases",
  "ease",
  "cools",
  "cools inflation",
  "hotter",
  "cooler",
  "attack",
  "attacks",
  "sanctions",
  "sanction",
  "ceasefire",
  "tariff",
  "tariffs",
  "defaults",
  "default",
  "bankruptcy",
  "buyback",
  "dividend",
  "merger",
  "acquisition",
  "ipo",
  "etf inflows",
  "etf outflows",
];

const SYMBOL_LABELS = {
  QQQ: "the Nasdaq 100",
  NDX: "the Nasdaq 100",
  NVDA: "Nvidia",
  MSFT: "Microsoft",
  AAPL: "Apple",
  AMZN: "Amazon",
  META: "Meta",
  GOOGL: "Alphabet",
  AMD: "AMD",
  AVGO: "Broadcom",
  NFLX: "Netflix",
  TSM: "TSMC",
  XAUUSD: "gold",
  DXY: "the dollar",
  US10Y: "US Treasury yields",
  GLD: "gold ETFs",
  BTCUSD: "bitcoin",
  ETHUSD: "ether",
  COIN: "Coinbase",
  MSTR: "MicroStrategy",
  IBIT: "spot bitcoin ETFs",
};

function extractMetaContent(html, matcher) {
  const match = String(html || "").match(matcher);
  return match ? decodeHtml(match[1]) : "";
}

function cleanSummaryCandidate(text) {
  return decodeHtml(text)
    .replace(/^\s*listen to this article\s*/i, "")
    .replace(/^\s*watch live\s*/i, "")
    .replace(/^\s*read more\s*/i, "")
    .replace(/^\s*by [a-z .'-]{2,60}\s*[.-]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isWeakSummaryCandidate(summary, title) {
  const clean = cleanSummaryCandidate(summary);
  if (!clean) {
    return true;
  }

  if (clean.length < 40) {
    return true;
  }

  if (
    /aggregated from sources all over the world by google news/i.test(clean) ||
    /all rights reserved/i.test(clean) ||
    /copyright \d{4}/i.test(clean)
  ) {
    return true;
  }

  return isTitleLikeSummary(clean, title);
}

function pickBestSummaryCandidate(candidates, title) {
  for (const candidate of candidates) {
    const clean = cleanSummaryCandidate(candidate);
    if (!isWeakSummaryCandidate(clean, title)) {
      return clean;
    }
  }

  return "";
}

function extractArticleSummary(html, title, fallback) {
  const content = String(html || "");
  const candidates = [
    extractMetaContent(content, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i),
    extractMetaContent(content, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
    extractMetaContent(content, /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["']/i),
  ];

  const paragraphMatches = Array.from(content.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => decodeHtml(match[1]))
    .slice(0, 8);

  candidates.push(...paragraphMatches);

  return pickBestSummaryCandidate(candidates, title) || cleanSummaryCandidate(fallback || "No article summary was available.");
}

function summarizeText(text, maxLength = 420) {
  const clean = decodeHtml(text).replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1).trimEnd()}...`;
}

function titleCaseToSentence(text) {
  const clean = decodeHtml(text).replace(/\s+/g, " ").trim();
  if (!clean) {
    return "";
  }

  if (/^[A-Z]{2,}\b/.test(clean)) {
    return clean;
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function lowerSentenceLead(text) {
  const clean = decodeHtml(text).replace(/\s+/g, " ").trim();
  if (!clean) {
    return "";
  }

  if (/^[A-Z]{2,}\b/.test(clean)) {
    return clean;
  }

  return clean.charAt(0).toLowerCase() + clean.slice(1);
}

function ensureSentence(text) {
  const clean = decodeHtml(text)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();

  if (!clean) {
    return "";
  }

  const capped = titleCaseToSentence(clean);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}

function cleanHeadlineForSummary(title) {
  return decodeHtml(title)
    .replace(/^[^:]{1,40}\s+today:\s*/i, "")
    .replace(/\s*\|\s*what should .*$/i, "")
    .replace(/\s*\|\s*latest.*$/i, "")
    .replace(/\s*\|\s*live.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeCauseText(text) {
  return lowerSentenceLead(
    cleanHeadlineForSummary(text)
      .replace(/\bFed\b/g, "the Fed")
      .replace(/\bFedâ€™s\b/g, "the Fed's")
      .replace(/\bGold Price\b/g, "gold prices")
      .replace(/\bTreasury yields\b/g, "Treasury yields")
      .replace(/\bclaims\b/gi, "said")
      .replace(/\breopens\b/gi, "reopened")
      .replace(/\bplunges\b/gi, "plunged")
      .replace(/\bsoars\b/gi, "soared")
      .replace(/\bsurges\b/gi, "surged")
      .replace(/\brises\b/gi, "rose")
      .replace(/\bweakens\b/gi, "weakened")
      .replace(/\beases\b/gi, "eased")
      .replace(/\bcools\b/gi, "cooled")
      .replace(/\bfirms\b/gi, "firmed")
      .replace(/\bfade\b/gi, "faded")
      .replace(/\bfalls\b/gi, "fell")
      .replace(/\bdrops\b/gi, "dropped")
      .replace(/\bslides\b/gi, "slid")
      .replace(/\bclimbs\b/gi, "climbed")
      .replace(/\bretreats\b/gi, "retreated")
      .replace(/\bmoves lower\b/gi, "moved lower")
      .replace(/\bmoves higher\b/gi, "moved higher")
      .replace(/\bedge higher\b/gi, "edged higher")
      .replace(/\bedge lower\b/gi, "edged lower")
      .replace(/\btakes aim at\b/gi, "criticized")
      .replace(/\bthe Fed rate cut hopes\b/gi, "Fed rate-cut hopes")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function hasReasonPhrase(text) {
  return /\b(because|after|ahead of|amid|due to|while|as|following|on edge because of|reducing the chance of|linked .+ to)\b/i.test(
    String(text || "")
  );
}

function containsPhrase(text, phrases) {
  const clean = String(text || "").toLowerCase();
  return phrases.some((phrase) => clean.includes(phrase));
}

function isExplanatoryHeadline(text, description = "") {
  const title = String(text || "").trim();
  const combined = `${title} ${description}`.toLowerCase();
  return (
    EXPLAINER_OPENERS.some((opener) => new RegExp(`^${opener}\\b`, "i").test(title)) ||
    /\?$/.test(title) ||
    containsPhrase(combined, EXPLAINER_PHRASES)
  );
}

function isNonEventCoverage(text, description = "") {
  const title = String(text || "").trim();
  const combined = `${title} ${description}`.toLowerCase();
  return containsPhrase(combined, NON_EVENT_PHRASES) || /\b(can|could|may|might)\b/i.test(title);
}

function isHardSuppressCoverage(text, description = "") {
  const title = String(text || "").trim();
  const combined = `${title} ${description}`.toLowerCase();
  return (
    containsPhrase(combined, HARD_SUPPRESS_PHRASES) ||
    /(^|[\s\-:|])why\b/i.test(title) ||
    /(^|[\s\-:|])how\b/i.test(title)
  );
}

function isMarketMovingEvent(title, description = "", categories = [], matchedFocus = []) {
  const titleText = String(title || "").toLowerCase();
  const combined = `${title} ${description}`.toLowerCase();
  const eventHits = countMatches(combined, EVENT_SIGNAL_KEYWORDS);
  const impactHits = countMatches(combined, HIGH_IMPACT_KEYWORDS);
  const hasExplicitMove =
    /\b(rises?|falls?|drops?|slides?|slumps?|surges?|jumps?|sinks?|rallies?|beats?|misses?|warns?|cuts?|raises?|hikes?|holds?|approves?|blocks?|delays?|extends?|eases?|cools?|heats?|attacks?|sanctions?|defaults?|files?)\b/i.test(
      titleText
    );
  const hasMarketContext = categories.length > 0 || matchedFocus.length >= 2 || impactHits >= 1;

  return hasExplicitMove ? hasMarketContext : eventHits >= 2 || (eventHits >= 1 && impactHits >= 1 && hasMarketContext);
}

function explainerPenalty(title, description, categories, matchedFocus) {
  if (!isExplanatoryHeadline(title, description)) {
    return 0;
  }

  return isMarketMovingEvent(title, description, categories, matchedFocus) ? -1.6 : -7.2;
}

function shouldSuppressItem(title, description, categories, matchedFocus) {
  if (isHardSuppressCoverage(title, description)) {
    return true;
  }

  const eventDriven = isMarketMovingEvent(title, description, categories, matchedFocus);
  if (isExplanatoryHeadline(title, description) && !eventDriven) {
    return true;
  }

  return isNonEventCoverage(title, description) && !eventDriven;
}

function appendDriverReason(summary, item) {
  const cleanSummary = ensureSentence(summary);
  if (hasReasonPhrase(cleanSummary)) {
    return cleanSummary;
  }

  if (isExplanatoryHeadline(item.title) || /\barticle examines\b/i.test(cleanSummary)) {
    return cleanSummary;
  }

  const drivers = uniq((item.matchedKeywords || []).slice(0, 3));
  if (!drivers.length) {
    return cleanSummary;
  }

  const reasonSentence =
    drivers.length === 1
      ? `Key driver: ${drivers[0]}.`
      : `Key drivers: ${drivers.slice(0, -1).join(", ")} and ${drivers.at(-1)}.`;

  return summarizeText(`${cleanSummary} ${reasonSentence}`, 220);
}

function humanizeFragment(fragment) {
  const clean = cleanHeadlineForSummary(fragment)
    .replace(/\bSF Fed'?s\b/g, "San Francisco Fed's")
    .replace(/\bFed\b/g, "the Fed")
    .replace(/\bFed’s\b/g, "the Fed's")
    .replace(/\bUS-Iran\b/g, "US-Iran")
    .trim()
    .replace(/[;,:-]+$/g, "");

  if (!clean) {
    return "";
  }

  const directRules = [
    {
      pattern: /^a few reasons why (.+?) failed to (.+?) amid (.+)$/i,
      build: (m) => `${m[1]} did not ${m[2]} despite ${m[3]}`,
    },
    {
      pattern: /^why (.+?) is down (.+)$/i,
      build: (m) => `${m[1]} is down ${m[2]}`,
    },
    {
      pattern: /^how long can (.+?) hold\?$/i,
      build: (m) => `${m[1]} is being tested`,
    },
    {
      pattern: /^how (.+)$/i,
      build: (m) => `${m[1]}`,
    },
    {
      pattern: /^(.+?): how long can (.+?) hold\?$/i,
      build: (m) => `${m[2]} is being tested in ${m[1]}`,
    },
    {
      pattern: /^(.+?) weakens? in (.+?) as (.+)$/i,
      build: (m) => `${m[1]} weakened in ${m[2]} because ${humanizeCauseText(m[3])}`,
    },
    {
      pattern: /^(.+?) weakens? as (.+)$/i,
      build: (m) => `${m[1]} weakened because ${humanizeCauseText(m[2])}`,
    },
    {
      pattern: /^(.+?) surges? as (.+)$/i,
      build: (m) => `${m[1]} surged after ${humanizeCauseText(m[2])}`,
    },
    {
      pattern: /^(.+?) rises? as (.+)$/i,
      build: (m) => `${m[1]} rose after ${humanizeCauseText(m[2])}`,
    },
    {
      pattern: /^(.+?) rallies? as (.+)$/i,
      build: (m) => `${m[1]} rallied after ${humanizeCauseText(m[2])}`,
    },
    {
      pattern: /^(.+?) eases? as (.+)$/i,
      build: (m) => `${m[1]} eased because ${humanizeCauseText(m[2])}`,
    },
    {
      pattern: /^(.+?) falls? as (.+)$/i,
      build: (m) => `${m[1]} fell because ${humanizeCauseText(m[2])}`,
    },
    {
      pattern: /^(.+?) drops? as (.+)$/i,
      build: (m) => `${m[1]} dropped because ${humanizeCauseText(m[2])}`,
    },
    {
      pattern: /^(.+?) slides? as (.+)$/i,
      build: (m) => `${m[1]} slid because ${humanizeCauseText(m[2])}`,
    },
    {
      pattern: /^(.+?) plunges? as (.+)$/i,
      build: (m) => `${m[1]} plunged because ${humanizeCauseText(m[2])}`,
    },
    {
      pattern: /^(.+?) clouds rate cut prospects(?:,\s*(.+?) says)?$/i,
      build: (m) =>
        m[2]
          ? `${m[2]} said ${m[1]} is reducing the chance of rate cuts`
          : `${m[1]} is reducing the chance of rate cuts`,
    },
    {
      pattern: /^(.+?) move[s]? lower after (.+)$/i,
      build: (m) => `${m[1]} moved lower after ${humanizeCauseText(m[2])}`,
    },
    {
      pattern: /^(.+?) move[s]? higher after (.+)$/i,
      build: (m) => `${m[1]} moved higher after ${humanizeCauseText(m[2])}`,
    },
    {
      pattern: /^(.+?) mixed ahead of (.+?), as (.+)$/i,
      build: (m) => `${m[1]} were mixed ahead of ${m[2]} while ${humanizeFragment(m[3])}`,
    },
    {
      pattern: /^(.+?) keeps? (.+?) on edge$/i,
      build: (m) => `${m[2]} stayed on edge because of ${m[1]}`,
    },
    {
      pattern: /^all eyes on (.+)$/i,
      build: (m) => `traders watched ${m[1]}`,
    },
    {
      pattern: /^(.+?) falls?, (.+?) edge higher as (.+)$/i,
      build: (m) => `${m[1]} fell while ${m[2]} edged higher as ${m[3]}`,
    },
    {
      pattern: /^(.+?) edge higher as (.+)$/i,
      build: (m) => `${m[1]} edged higher as ${m[2]}`,
    },
    {
      pattern: /^(.+?) edge lower as (.+)$/i,
      build: (m) => `${m[1]} edged lower as ${m[2]}`,
    },
    {
      pattern: /^(.+?) retreats? above (.+)$/i,
      build: (m) => `${m[1]} pulled back but stayed above ${m[2]}`,
    },
    {
      pattern: /^(.+?) climbs?$/i,
      build: (m) => `${m[1]} rose`,
    },
    {
      pattern: /^(.+?) surges? past (.+)$/i,
      build: (m) => `${m[1]} surged past ${m[2]}`,
    },
    {
      pattern: /^(.+?) takes aim at (.+)$/i,
      build: (m) => `${m[1]} criticized ${m[2]}`,
    },
    {
      pattern: /^(.+?) links? (.+?) to (.+)$/i,
      build: (m) => `${m[1]} linked ${m[2]} to ${m[3]}`,
    },
    {
      pattern: /^(.+?) claims? ['"]?(.+?)['"]? (.+?) on (.+)$/i,
      build: (m) => `${m[1]} said ${m[2]} ${m[3]} on ${m[4]}`,
    },
  ];

  for (const rule of directRules) {
    const match = clean.match(rule.pattern);
    if (match) {
      return rule.build(match)
        .replace(/\bGold & Silver\b/g, "gold and silver")
        .replace(/\bNasdaq & S&P 500\b/g, "the Nasdaq and S&P 500")
        .replace(/\bDow\b/g, "the Dow")
        .replace(/\bthe the\b/gi, "the")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  return clean
    .replace(/\bGold & Silver\b/g, "gold and silver")
    .replace(/\bNasdaq & S&P 500\b/g, "the Nasdaq and S&P 500")
    .replace(/\bDow Falls\b/g, "the Dow fell")
    .replace(/\bBitcoin Retreats Above\b/g, "bitcoin pulled back but stayed above")
    .replace(/\bclaims\b/gi, "said")
    .replace(/\bweakens\b/gi, "weakened")
    .replace(/\btakes aim at\b/gi, "criticized")
    .replace(/\bfailed to surge\b/gi, "did not surge")
    .replace(/\bedge higher\b/gi, "edged higher")
    .replace(/\bedge lower\b/gi, "edged lower")
    .replace(/\bkeep(s)? ([^;,.]+) on edge\b/gi, "kept $2 on edge")
    .replace(/\ball eyes on\b/gi, "traders watched")
    .replace(/\bclimb\b/gi, "rose")
    .replace(/\bfalls\b/gi, "fell")
    .replace(/\bretreats above\b/gi, "pulled back but stayed above")
    .replace(/\?+$/g, "")
    .replace(/\bthe the\b/gi, "the")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text) {
  return cleanSummaryCandidate(text)
    .match(/[^.!?]+[.!?]?/g)
    ?.map((part) => ensureSentence(part))
    .filter(Boolean) || [];
}

function joinReadableList(values) {
  const items = uniq(values.map((value) => String(value || "").trim()).filter(Boolean));
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function describeAffectedAssets(item) {
  const labels = uniq((item.actualSymbols || item.symbols || []).slice(0, 4).map((symbol) => SYMBOL_LABELS[symbol] || symbol));
  return joinReadableList(labels.slice(0, 3));
}

function formatSummaryTimestamp(value) {
  const time = Date.parse(value || "");
  if (!Number.isFinite(time)) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  return formatter.format(new Date(time));
}

function buildTimingSentence(item) {
  const stamp = formatSummaryTimestamp(item.publishedAt || item.firstSeenAt);
  if (!stamp) {
    return "";
  }

  return `It was published on ${stamp} UTC.`;
}

function buildMechanismSentence(item) {
  const categories = item.categories || [];
  const drivers = uniq((item.matchedKeywords || []).filter((keyword) => keyword.length > 2)).slice(0, 3);

  if (item.watchlistId === "xauusd") {
    if (categories.includes("Rates") || categories.includes("Macro")) {
      return "The reaction usually runs through Fed pricing, Treasury yields and the dollar.";
    }

    if (categories.includes("Geopolitics")) {
      return "The reaction usually runs through haven demand, oil prices and dollar strength.";
    }

    return "The reaction usually runs through the dollar, yields and overall haven demand.";
  }

  if (item.watchlistId === "nasdaq") {
    if (categories.includes("Rates") || categories.includes("Macro")) {
      return "The reaction usually runs through discount-rate pressure on large-cap growth stocks.";
    }

    if (categories.includes("Semis") || categories.includes("Earnings")) {
      return "The reaction usually shows up through chip demand, capex plans and company guidance.";
    }

    return "The reaction usually shows up through large-cap growth sentiment and index weighting.";
  }

  if (item.watchlistId === "btc") {
    return "The reaction usually runs through ETF flow expectations, regulation and broad risk appetite.";
  }

  if (drivers.length) {
    return `The move is being linked mainly to ${joinReadableList(drivers)}.`;
  }

  return "";
}

function buildMarketContextSentence(item) {
  const affectedAssets = describeAffectedAssets(item);
  const categories = item.categories || [];

  if (item.watchlistId === "xauusd") {
    if (categories.includes("Rates") || categories.includes("Macro")) {
      return "Markets care because changes in Fed expectations, Treasury yields and the dollar usually feed straight into gold.";
    }

    if (categories.includes("Geopolitics")) {
      return "Markets care because any escalation or de-escalation can quickly shift haven demand, oil and the dollar, which often moves gold.";
    }

    return "Markets care because moves in the dollar, yields and haven demand often flow straight into gold.";
  }

  if (item.watchlistId === "nasdaq") {
    if (categories.includes("Rates") || categories.includes("Macro")) {
      return "Markets care because shifts in yields and Fed expectations can reprice the Nasdaq quickly.";
    }

    if (categories.includes("Semis") || categories.includes("Earnings")) {
      return affectedAssets
        ? `Markets care because the read-through is usually strongest for the Nasdaq and names such as ${affectedAssets}.`
        : "Markets care because the read-through is usually strongest for the Nasdaq and large-cap chip names.";
    }

    return "Markets care because the read-through is usually strongest for the Nasdaq and large-cap growth names.";
  }

  if (item.watchlistId === "btc") {
    return "Markets care because ETF flows, regulation and broader risk appetite can move bitcoin and crypto-linked stocks quickly.";
  }

  const drivers = uniq((item.matchedKeywords || []).filter((keyword) => keyword.length > 2)).slice(0, 3);

  if (drivers.length && affectedAssets) {
    return `Markets care because it feeds into ${joinReadableList(drivers)}, with the clearest read-through for ${affectedAssets}.`;
  }

  if (drivers.length) {
    return `Markets care because it feeds into ${joinReadableList(drivers)}.`;
  }

  if (affectedAssets) {
    return `The clearest read-through is for ${affectedAssets}.`;
  }

  if ((item.categories || []).length) {
    return `Markets will watch the follow-through across ${joinReadableList(item.categories.map((category) => category.toLowerCase()))}.`;
  }

  return "";
}

function buildOverallMeaning(item) {
  const affectedAssets = describeAffectedAssets(item);

  if (item.watchlistId === "xauusd") {
    const assetPhrase = "for gold";
    if (item.bias === "bullish") {
      return `Overall, it points to a more supportive near-term backdrop ${assetPhrase}, especially if haven demand stays firm and the dollar or yields do not push much higher.`;
    }

    if (item.bias === "bearish") {
      return `Overall, it points to a more difficult near-term backdrop ${assetPhrase}, especially if yields or the dollar keep strengthening.`;
    }

    return `Overall, it suggests a mixed near-term backdrop ${assetPhrase}, with the next move still likely to depend on yields, the dollar and risk sentiment.`;
  }

  if (item.watchlistId === "nasdaq") {
    const assetPhrase = "for the Nasdaq and large-cap tech";
    if (item.bias === "bullish") {
      return `Overall, it points to a more supportive near-term backdrop ${assetPhrase}, especially if rate pressure eases or guidance stays constructive.`;
    }

    if (item.bias === "bearish") {
      return `Overall, it points to a weaker near-term backdrop ${assetPhrase}, especially if yields rise, growth expectations soften or guidance deteriorates.`;
    }

    return `Overall, it suggests a mixed near-term backdrop ${assetPhrase}, so traders will likely need confirmation from yields, earnings or follow-through in large-cap tech.`;
  }

  if (item.watchlistId === "btc") {
    const assetPhrase = "for bitcoin and crypto-linked names";
    if (item.bias === "bullish") {
      return `Overall, it points to a more supportive near-term backdrop ${assetPhrase}, especially if risk appetite improves and ETF or regulatory flow stays favorable.`;
    }

    if (item.bias === "bearish") {
      return `Overall, it points to a softer near-term backdrop ${assetPhrase}, especially if regulation tightens or broader risk appetite fades.`;
    }

    return `Overall, it suggests a mixed near-term backdrop ${assetPhrase}, with price still likely to react to flows, regulation and broader risk sentiment.`;
  }

  const assetPhrase = affectedAssets ? `for ${affectedAssets}` : "for the watchlist";

  if (item.bias === "bullish") {
    return `Overall, it points to a more supportive near-term backdrop ${assetPhrase}.`;
  }

  if (item.bias === "bearish") {
    return `Overall, it points to a weaker near-term backdrop ${assetPhrase}.`;
  }

  return `Overall, it suggests a mixed near-term backdrop ${assetPhrase}.`;
}

function buildWhatHappenedSentence(item, preferredText = "") {
  const preferredSentences = splitSentences(preferredText).slice(0, 3);
  if (preferredSentences.length) {
    return preferredSentences.join(" ");
  }

  const title = cleanHeadlineForSummary(stripTrailingSource(item.title || "", item.sourceName));
  if (!title) {
    return "A market-moving development was reported, but the source did not provide a clean article summary.";
  }

  const fragments = title
    .split(/\s*;\s*/)
    .map((part) => humanizeFragment(part))
    .filter(Boolean)
    .slice(0, 2);

  if (!fragments.length) {
    return "A market-moving development was reported, but the source did not provide a clean article summary.";
  }

  return fragments.map((fragment) => ensureSentence(fragment)).join(" ");
}

function buildParagraphSummary(item, preferredText = "", maxLength = 420) {
  const timing = buildTimingSentence(item);
  const whatHappened = buildWhatHappenedSentence(item, preferredText);
  const mechanism = buildMechanismSentence(item);
  const marketContext = buildMarketContextSentence(item);
  const paragraph = [whatHappened, timing, mechanism, marketContext].filter(Boolean).join(" ");
  return summarizeText(paragraph || whatHappened || "A market-moving development was reported.", maxLength);
}

function synthesizeArticleSummary(item) {
  const feedSummary = pickBestSummaryCandidate([stripTrailingSource(item.summary, item.sourceName)], item.title);
  return buildParagraphSummary(item, feedSummary, 460);
}

function isTitleLikeSummary(summary, title) {
  const cleanSummary = stripTrailingSource(summary || "", "").toLowerCase();
  const cleanTitle = stripTrailingSource(title || "", "").toLowerCase();
  if (!cleanSummary || !cleanTitle) {
    return false;
  }

  if (cleanSummary === cleanTitle) {
    return true;
  }

  const summaryTokens = cleanSummary.split(/\s+/);
  const titleTokens = cleanTitle.split(/\s+/);
  let overlap = 0;

  summaryTokens.forEach((token) => {
    if (titleTokens.includes(token)) {
      overlap += 1;
    }
  });

  return overlap / Math.max(summaryTokens.length, 1) > 0.8;
}

function formatSourceLink(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "Open article";
  }
}

function extractRedirectTarget(url) {
  try {
    const parsed = new URL(url);
    const keys = ["url", "u", "q", "target", "dest", "destination", "redirect", "continue"];
    for (const key of keys) {
      const value = parsed.searchParams.get(key);
      if (value && /^https?:\/\//i.test(value)) {
        return value;
      }
    }
  } catch {}

  return "";
}

function collectExternalUrlCandidates(html) {
  const normalized = String(html || "")
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/");

  const candidates = [];
  const absoluteUrlRegex = /https?:\/\/[^"'<>\\\s)]+/gi;
  const metaRefreshRegex = /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/gi;

  Array.from(normalized.matchAll(absoluteUrlRegex)).forEach((match) => {
    candidates.push(match[0]);
  });

  Array.from(normalized.matchAll(metaRefreshRegex)).forEach((match) => {
    candidates.push(match[1]);
  });

  return uniq(candidates.map((candidate) => candidate.trim()));
}

function resolvedUrlCandidateScore(candidate, item) {
  try {
    const parsed = new URL(candidate);
    const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (
      !/^https?:$/i.test(parsed.protocol) ||
      /(^|\.)google\./i.test(hostname) ||
      /(^|\.)gstatic\.com$/i.test(hostname) ||
      /(^|\.)googleapis\.com$/i.test(hostname) ||
      /(^|\.)fonts\.gstatic\.com$/i.test(hostname) ||
      /(^|\.)w3\.org$/i.test(hostname) ||
      /(^|\.)angular\.dev$/i.test(hostname) ||
      /(^|\.)googleusercontent\.com$/i.test(hostname) ||
      /(^|\.)googletagmanager\.com$/i.test(hostname) ||
      /(^|\.)google-analytics\.com$/i.test(hostname)
    ) {
      return -1;
    }

    let score = 1;
    const normalizedSource = String(item.sourceName || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

    if (normalizedSource) {
      normalizedSource.split(/\s+/).forEach((token) => {
        if (token.length >= 3 && hostname.includes(token)) {
          score += 2.2;
        }
      });
    }

    const titleTokens = toTitleTokens(item.title).slice(0, 6);
    titleTokens.forEach((token) => {
      if (token.length >= 4 && candidate.toLowerCase().includes(token)) {
        score += 0.35;
      }
    });

    return score;
  } catch {
    return -1;
  }
}

function pickResolvedUrl(item, currentUrl, html) {
  try {
    const currentHost = new URL(currentUrl || item.link).hostname.replace(/^www\./i, "").toLowerCase();
    if (currentHost && !/(^|\.)google\./i.test(currentHost)) {
      return currentUrl || item.link;
    }
  } catch {}

  const candidates = uniq(
    [currentUrl, extractRedirectTarget(currentUrl), extractRedirectTarget(item.link), ...collectExternalUrlCandidates(html)]
      .filter(Boolean)
  );

  let bestUrl = "";
  let bestScore = -1;

  candidates.forEach((candidate) => {
    const score = resolvedUrlCandidateScore(candidate, item);
    if (score > bestScore) {
      bestScore = score;
      bestUrl = candidate;
    }
  });

  return bestScore >= 2 ? bestUrl : currentUrl || item.link;
}

function looksLikeGoogleNewsShell(url, summary) {
  return /news\.google\.com/i.test(String(url || "")) ||
    /aggregated from sources all over the world by Google News/i.test(String(summary || ""));
}

function toTitleTokens(title) {
  return uniq(
    String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !TITLE_STOP_WORDS.has(token))
  );
}

function titleSimilarity(left, right) {
  const leftTokens = new Set(toTitleTokens(left));
  const rightTokens = new Set(toTitleTokens(right));

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  let intersection = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      intersection += 1;
    }
  });

  const union = new Set([...leftTokens, ...rightTokens]).size || 1;
  return intersection / union;
}

function shouldGroupItems(primary, candidate) {
  const similarity = titleSimilarity(primary.title, candidate.title);
  const sharedCategory = primary.categories.some((category) => candidate.categories.includes(category));
  const sharedSymbol = primary.symbols.some((symbol) => candidate.symbols.includes(symbol));
  return similarity >= 0.55 || (similarity >= 0.34 && (sharedCategory || sharedSymbol));
}

function createGeneratedSummary(item) {
  return synthesizeArticleSummary(item);
}

function buildGroupedItems(items, watchlist, cappedLimit) {
  const clusters = [];

  items.forEach((item) => {
    const cluster = clusters.find((existing) => shouldGroupItems(existing.primary, item));
    if (!cluster) {
      clusters.push({
        primary: item,
        items: [item],
      });
      return;
    }

    cluster.items.push(item);
    if (
      item.score > cluster.primary.score ||
      Date.parse(item.publishedAt || item.firstSeenAt || 0) > Date.parse(cluster.primary.publishedAt || cluster.primary.firstSeenAt || 0)
    ) {
      cluster.primary = item;
    }
  });

  return clusters
    .map((cluster) => {
      const primary = cluster.primary;
      const uniqueSources = uniq(cluster.items.map((item) => item.sourceName)).length;
      const bestSourceAuthority = cluster.items.reduce(
        (best, item) => {
          if ((item.sourceAuthorityScore || 0) > best.score) {
            return {
              score: item.sourceAuthorityScore || 0,
              tier: item.sourceTier || "all",
              label: item.sourceTierLabel || "all sources",
            };
          }

          return best;
        },
        {
          score: primary.sourceAuthorityScore || sourceAuthorityScore(primary.sourceName),
          tier: primary.sourceTier || "all",
          label: primary.sourceTierLabel || "all sources",
        }
      );
      const confirmationBonus = Math.min(3.6, Math.max(0, (uniqueSources - 1) * 1.05 + (cluster.items.length - 1) * 0.35));
      const groupedScore = Number((primary.score + confirmationBonus).toFixed(1));
      const groupedConfidence = computeConfidenceScore({
        sourceQuality: sourceAuthorityScore(primary.sourceName),
        matchedFocus: primary.matchedKeywords || [],
        categories: primary.categories || [],
        lowSignal: lowSignalPenalty(primary.title, `${primary.title} ${primary.summary || ""}`, primary.categories || [], primary.matchedKeywords || []),
        uniqueSources,
        clusterSize: cluster.items.length,
      });
      const references = cluster.items
        .sort((left, right) => right.score - left.score)
        .map((item) => ({
          sourceName: item.sourceName,
          link: item.link,
          shortUrl: item.sourceName || formatSourceLink(item.link),
          publishedAt: item.publishedAt || item.firstSeenAt,
        }));

      return {
        ...primary,
        score: groupedScore,
        confidence: groupedConfidence,
        confidenceBand: formatConfidenceBand(groupedConfidence),
        impact: formatImpact(groupedScore),
        sourceAuthorityScore: bestSourceAuthority.score,
        sourceTier: bestSourceAuthority.tier,
        sourceTierLabel: bestSourceAuthority.label,
        combinedCount: cluster.items.length,
        combinedKey: primary.key,
        generatedSummary: createGeneratedSummary(primary),
        whyItMatters: [
          primary.whyItMatters,
          uniqueSources > 1 ? `confirmed by ${uniqueSources} sources` : "",
        ]
          .filter(Boolean)
          .join(" | "),
        references,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return Date.parse(right.publishedAt || right.firstSeenAt || 0) - Date.parse(left.publishedAt || left.firstSeenAt || 0);
    })
    .slice(0, cappedLimit);
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTrailingSource(text, sourceName) {
  const clean = decodeHtml(text);
  if (!sourceName) {
    return clean;
  }

  const suffix = new RegExp(`\\s${String(sourceName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  return clean.replace(suffix, "").trim();
}

function getTagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function parseFeed(xmlText, fallbackFeed) {
  const xml = String(xmlText || "");
  const channelTitle = getTagValue(xml, "title") || fallbackFeed.label;
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];

  return itemBlocks
    .map((block) => {
      const title = getTagValue(block, "title");
      const description = getTagValue(block, "description") || getTagValue(block, "summary");
      const linkMatch = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
      const hrefMatch = block.match(/<link[^>]*href="([^"]+)"/i);
      const link = decodeHtml((hrefMatch && hrefMatch[1]) || (linkMatch && linkMatch[1]) || getTagValue(block, "guid"));
      const pubDate = getTagValue(block, "pubDate") || getTagValue(block, "published") || getTagValue(block, "updated");
      const parsedTime = Date.parse(pubDate);
      return {
        title,
        description,
        link,
        publishedAt: Number.isFinite(parsedTime) ? new Date(parsedTime).toISOString() : null,
        sourceFeed: fallbackFeed.label || channelTitle,
      };
    })
    .filter((item) => item.title && item.link);
}

function countMatches(text, keywords) {
  return keywords.reduce((count, keyword) => (text.includes(keyword) ? count + 1 : count), 0);
}

function normalizeKey(title, link) {
  return `${String(title || "").toLowerCase().trim()}|${String(link || "").trim()}`;
}

function splitSourceFromTitle(title, feedLabel) {
  const parts = String(title || "").split(" - ");
  if (parts.length > 1) {
    return {
      cleanTitle: parts.slice(0, -1).join(" - ").trim(),
      sourceName: parts.at(-1).trim(),
    };
  }

  return {
    cleanTitle: String(title || "").trim(),
    sourceName: feedLabel,
  };
}

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
}

function zonedTimeToDate(year, monthIndex, day, hour, minute, timeZone = NEW_YORK_TIME_ZONE) {
  const utcGuess = Date.UTC(year, monthIndex, day, hour, minute, 0);
  const parts = zonedParts(new Date(utcGuess), timeZone);
  const observedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second || 0);
  return new Date(utcGuess - (observedAsUtc - utcGuess));
}

function monthReference(now, offset) {
  const parts = zonedParts(now, NEW_YORK_TIME_ZONE);
  const monthDate = new Date(Date.UTC(parts.year, parts.month - 1 + offset, 1, 12, 0, 0));
  return {
    year: monthDate.getUTCFullYear(),
    monthIndex: monthDate.getUTCMonth(),
  };
}

function nthWeekdayOfMonth(year, monthIndex, weekday, occurrence) {
  const first = new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return 1 + offset + (occurrence - 1) * 7;
}

function lastWeekdayOfMonth(year, monthIndex, weekday) {
  const last = new Date(Date.UTC(year, monthIndex + 1, 0, 12, 0, 0));
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return last.getUTCDate() - offset;
}

function firstBusinessDayOfMonth(year, monthIndex) {
  let day = 1;
  while ([0, 6].includes(new Date(Date.UTC(year, monthIndex, day, 12, 0, 0)).getUTCDay())) {
    day += 1;
  }
  return day;
}

function pushIfUpcoming(candidates, candidate, now, end) {
  const time = candidate.getTime();
  if (time > now.getTime() && time <= end.getTime()) {
    candidates.push(candidate);
  }
}

function monthlyEtCandidates(now, end, pickDay, hour, minute) {
  const candidates = [];
  for (let offset = 0; offset < 4; offset += 1) {
    const reference = monthReference(now, offset);
    const day = pickDay(reference);
    pushIfUpcoming(candidates, zonedTimeToDate(reference.year, reference.monthIndex, day, hour, minute), now, end);
  }
  return candidates;
}

function weeklyEtCandidates(now, end, weekday, hour, minute) {
  const candidates = [];
  const days = Math.ceil((end.getTime() - now.getTime()) / 86_400_000) + 7;

  for (let offset = 0; offset <= days; offset += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset, 12, 0, 0));
    if (date.getUTCDay() !== weekday) {
      continue;
    }

    pushIfUpcoming(
      candidates,
      zonedTimeToDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, minute),
      now,
      end
    );
  }

  return candidates;
}

function weeklyUtcCandidates(now, end, weekday, hour, minute) {
  const candidates = [];
  const days = Math.ceil((end.getTime() - now.getTime()) / 86_400_000) + 7;

  for (let offset = 0; offset <= days; offset += 1) {
    const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset, hour, minute, 0));
    if (candidate.getUTCDay() === weekday) {
      pushIfUpcoming(candidates, candidate, now, end);
    }
  }

  return candidates;
}

function weekdayEtCandidates(now, end, hour, minute) {
  return [1, 2, 3, 4, 5].flatMap((weekday) => weeklyEtCandidates(now, end, weekday, hour, minute));
}

function catalystImpactScore(impact) {
  if (impact === "high") return 3;
  if (impact === "medium") return 2;
  return 1;
}

function getUpcomingCatalysts(watchlist, { hours = CATALYST_WINDOW_HOURS } = {}) {
  const now = new Date();
  const windowHours = clamp(Number(hours) || CATALYST_WINDOW_HOURS, 24, 336);
  const end = new Date(now.getTime() + windowHours * 3_600_000);
  const watchlistId = watchlist?.id || "xauusd";

  const items = CATALYST_DEFINITIONS
    .filter((definition) => definition.watchlists.includes(watchlistId))
    .flatMap((definition) =>
      definition.schedule(now, end).map((scheduledAt) => ({
        id: `${definition.id}-${scheduledAt.toISOString()}`,
        title: definition.title,
        category: definition.category,
        impact: definition.impact,
        scheduledAt: scheduledAt.toISOString(),
        watchlistId,
        watchlistLabel: watchlist?.label || watchlistId.toUpperCase(),
        sourceLabel: "Desk catalyst model",
        whyItMatters: definition.whyItMatters,
        tradeRisk: definition.tradeRisk,
        impactScore: catalystImpactScore(definition.impact),
      }))
    )
    .sort((left, right) => {
      const timeDiff = Date.parse(left.scheduledAt) - Date.parse(right.scheduledAt);
      if (timeDiff !== 0) return timeDiff;
      return right.impactScore - left.impactScore;
    })
    .slice(0, CATALYST_MAX_ITEMS);

  return {
    generatedAt: now.toISOString(),
    windowHours,
    watchlistId,
    watchlistLabel: watchlist?.label || watchlistId.toUpperCase(),
    sourceLabel: "Desk catalyst model",
    disclaimer: "Estimated scheduled risk windows, not an official economic calendar.",
    items,
  };
}

function sourceAuthorityScore(sourceName) {
  const source = String(sourceName || "");
  const matched = SOURCE_QUALITY_RULES.find((rule) => rule.pattern.test(source));
  return matched ? matched.score : 0.9;
}

function sourceAuthorityMeta(sourceName) {
  const score = sourceAuthorityScore(sourceName);

  if (score >= 2.4) {
    return { score, tier: "top", label: "top tier" };
  }

  if (score >= 2.0) {
    return { score, tier: "trusted", label: "trusted" };
  }

  if (score >= 1.5) {
    return { score, tier: "established", label: "established" };
  }

  return { score, tier: "all", label: "all sources" };
}

function recencyScore(publishedAt) {
  const publishedTime = Date.parse(publishedAt || 0);
  if (!Number.isFinite(publishedTime)) {
    return 0;
  }

  const ageHours = (Date.now() - publishedTime) / 3_600_000;
  if (ageHours <= 1) return 3.2;
  if (ageHours <= 4) return 2.4;
  if (ageHours <= 8) return 1.6;
  if (ageHours <= 16) return 0.8;
  if (ageHours <= 30) return 0.2;
  return -0.4;
}

function watchlistAffinityScore(watchlist, symbols, matchedFocus, categories) {
  let score = 0;
  if (symbols.includes(watchlist.symbols[0])) {
    score += 2.2;
  }
  if (symbols.some((symbol) => watchlist.symbols.includes(symbol))) {
    score += 1.1;
  }
  score += Math.min(2.6, matchedFocus.length * 0.6);
  if (watchlist.id === "xauusd" && categories.includes("Rates")) score += 0.9;
  if (watchlist.id === "nasdaq" && categories.some((category) => ["Macro", "Semis", "Earnings"].includes(category))) score += 0.9;
  if (watchlist.id === "btc" && categories.includes("Crypto")) score += 1.0;
  return score;
}

function lowSignalPenalty(title, text, categories, matchedFocus) {
  const combined = String(text || "").toLowerCase();
  const hasLowSignalTopic = LOW_SIGNAL_KEYWORDS.some((keyword) => combined.includes(keyword));
  if (!hasLowSignalTopic) {
    return 0;
  }

  const hasStrongMarketContext =
    matchedFocus.length >= 2 ||
    categories.some((category) => ["Macro", "Rates", "Earnings", "Crypto", "Semis"].includes(category));

  return hasStrongMarketContext ? -1.2 : -4.2;
}

function formatImpact(score) {
  if (score >= 10) return "high";
  if (score >= 6) return "medium";
  return "low";
}

function formatUrgency(score) {
  if (score >= 3) return "immediate";
  if (score >= 1) return "watch";
  return "background";
}

function formatConfidenceBand(confidence) {
  if (confidence >= 78) return "high";
  if (confidence >= 58) return "medium";
  return "low";
}

function computeConfidenceScore({ sourceQuality, matchedFocus, categories, lowSignal, uniqueSources = 1, clusterSize = 1 }) {
  let confidence = 34;
  confidence += sourceQuality * 12;
  confidence += Math.min(14, matchedFocus.length * 3.2);
  confidence += Math.min(10, categories.length * 2.1);
  confidence += Math.min(18, Math.max(0, uniqueSources - 1) * 7.5);
  confidence += Math.min(10, Math.max(0, clusterSize - 1) * 2.2);

  if (lowSignal < 0) {
    confidence -= Math.abs(lowSignal) * 3.6;
  }

  return Math.round(clamp(confidence, 18, 97));
}

function inferBias(text) {
  const bullish = countMatches(text, BULLISH_KEYWORDS);
  const bearish = countMatches(text, BEARISH_KEYWORDS);
  if (bullish === bearish) return "mixed";
  return bullish > bearish ? "bullish" : "bearish";
}

function itemTimestamp(item) {
  const publishedTime = Date.parse(item?.publishedAt || "");
  if (Number.isFinite(publishedTime) && publishedTime > 0) {
    return publishedTime;
  }

  const firstSeenTime = Date.parse(item?.firstSeenAt || "");
  if (Number.isFinite(firstSeenTime) && firstSeenTime > 0) {
    return firstSeenTime;
  }

  return 0;
}

function normalizeMaxAgeHours(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 12;
  }

  return clamp(parsed, 1, 48);
}

function normalizeSignalMode(value) {
  const mode = String(value || "realtime").toLowerCase();
  if (["realtime", "balanced", "broad"].includes(mode)) {
    return mode;
  }

  return "realtime";
}

function normalizeSourceMode(value) {
  const mode = String(value || "established").toLowerCase();
  if (["all", "established", "trusted", "top"].includes(mode)) {
    return mode;
  }

  return "established";
}

function normalizeTradingMode(value) {
  const mode = String(value || "tradeable").toLowerCase();
  if (["tradeable", "support", "all"].includes(mode)) {
    return mode;
  }

  return "tradeable";
}

function matchesTimeliness(item, maxAgeHours) {
  const timestamp = itemTimestamp(item);
  if (!timestamp) {
    return true;
  }

  return Date.now() - timestamp <= normalizeMaxAgeHours(maxAgeHours) * 3_600_000;
}

function matchesSignalMode(item, signalMode) {
  const mode = normalizeSignalMode(signalMode);

  if (mode === "broad") {
    return true;
  }

  if (mode === "balanced") {
    return Boolean(
      item.eventDriven ||
        item.impact !== "low" ||
        Number(item.confidence || 0) >= 58 ||
        Number(item.combinedCount || 1) > 1
    );
  }

  return Boolean(
    item.eventDriven &&
      item.urgency !== "background" &&
      (item.impact !== "low" || Number(item.confidence || 0) >= 62 || Number(item.combinedCount || 1) > 1)
  );
}

function matchesSourceMode(item, sourceMode) {
  const mode = normalizeSourceMode(sourceMode);
  const score = Number(item.sourceAuthorityScore || 0);

  if (mode === "all") {
    return true;
  }

  if (mode === "top") {
    return score >= 2.4;
  }

  if (mode === "trusted") {
    return score >= 2.0;
  }

  return score >= 1.5;
}

function matchesTradingUsefulness(item, tradingMode) {
  const mode = normalizeTradingMode(tradingMode);

  if (mode === "all") {
    return true;
  }

  const sourceScore = Number(item.sourceAuthorityScore || 0);
  const hasAssetLink = (item.symbols || []).length > 0 || (item.categories || []).length > 0;
  const hasDecisionSignal =
    item.eventDriven || item.impact !== "low" || Number(item.confidence || 0) >= 58 || Number(item.combinedCount || 1) > 1;

  if (mode === "support") {
    return Boolean(sourceScore >= 1.5 && hasAssetLink && hasDecisionSignal);
  }

  return Boolean(
    sourceScore >= 1.5 &&
      hasAssetLink &&
      item.urgency !== "background" &&
      (item.eventDriven || item.impact === "high") &&
      (Number(item.confidence || 0) >= 62 || Number(item.combinedCount || 1) > 1 || item.impact === "high")
  );
}

function analyzeItem(rawItem, watchlist) {
  const split = splitSourceFromTitle(rawItem.title, rawItem.sourceFeed);
  const text = `${split.cleanTitle} ${rawItem.description}`.toLowerCase();
  const matchedFocus = watchlist.focusKeywords.filter((keyword) => text.includes(keyword));
  const categories = CATEGORY_RULES.filter((rule) => countMatches(text, rule.keywords) > 0).map((rule) => rule.label);
  const actualSymbols = uniq(SYMBOL_RULES.filter((rule) => countMatches(text, rule.keywords) > 0).flatMap((rule) => rule.symbols));
  const symbols = actualSymbols.length ? actualSymbols : watchlist.symbols.slice(0, 2);

  const impactKeywordHits = countMatches(text, HIGH_IMPACT_KEYWORDS);
  const urgentHits = countMatches(text, URGENT_KEYWORDS);
  const eventDriven = isMarketMovingEvent(split.cleanTitle, rawItem.description, categories, matchedFocus);
  const explainPenalty = explainerPenalty(split.cleanTitle, rawItem.description, categories, matchedFocus);
  const sourceAuthority = sourceAuthorityMeta(split.sourceName || rawItem.sourceFeed);
  const sourceQuality = sourceAuthority.score;
  const recency = recencyScore(rawItem.publishedAt);
  const affinity = watchlistAffinityScore(watchlist, symbols, matchedFocus, categories);
  const lowSignal = lowSignalPenalty(split.cleanTitle, text, categories, matchedFocus);
  const confidence = computeConfidenceScore({
    sourceQuality,
    matchedFocus,
    categories,
    lowSignal: lowSignal + explainPenalty,
  });
  const confidenceBand = formatConfidenceBand(confidence);

  let score = 1;
  score += matchedFocus.length * 0.9;
  score += categories.length * 1.4;
  score += impactKeywordHits * 1.6;
  score += Math.min(2.4, urgentHits * 0.9);
  score += eventDriven ? 2.6 : 0;
  score += sourceQuality;
  score += recency;
  score += affinity;
  score += lowSignal;
  score += explainPenalty;

  score = clamp(score, 0.5, 24);

  const impact = formatImpact(score);
  const urgency = formatUrgency(urgentHits + (impact === "high" ? 1 : 0));
  const bias = inferBias(text);
  const whyItMattersParts = [];

  if (categories.length) {
    whyItMattersParts.push(`${eventDriven ? "event-driven " : ""}${categories.join(" / ")} headline`);
  }
  if (symbols.length) {
    whyItMattersParts.push(`likely watch symbols: ${symbols.slice(0, 5).join(", ")}`);
  }
  if (matchedFocus.length) {
    whyItMattersParts.push(`matched terms: ${matchedFocus.slice(0, 4).join(", ")}`);
  }
  if (sourceQuality >= 2) {
    whyItMattersParts.push(`higher-trust source`);
  }
  if (recency >= 2) {
    whyItMattersParts.push(`very recent`);
  }

  return {
    key: normalizeKey(split.cleanTitle, rawItem.link),
    title: split.cleanTitle,
    link: rawItem.link,
    sourceName: split.sourceName || rawItem.sourceFeed,
    sourceFeed: rawItem.sourceFeed,
    publishedAt: rawItem.publishedAt,
    summary: rawItem.description,
    score: Number(score.toFixed(1)),
    confidence,
    confidenceBand,
    impact,
    urgency,
    bias,
    sourceAuthorityScore: sourceAuthority.score,
    sourceTier: sourceAuthority.tier,
    sourceTierLabel: sourceAuthority.label,
    eventDriven,
    watchlistId: watchlist.id,
    categories,
    symbols,
    actualSymbols,
    matchedKeywords: matchedFocus,
    whyItMatters: whyItMattersParts.join(" | "),
    filteredOut: shouldSuppressItem(split.cleanTitle, rawItem.description, categories, matchedFocus),
  };
}

class NewsMonitor {
  constructor(watchlist, options = {}) {
    this.watchlist = watchlist;
    this.pollMs = Number(options.pollMs || DEFAULT_POLL_MS);
    this.items = [];
    this.detailCache = new Map();
    this.seenKeys = new Set();
    this.lastCheckedAt = null;
    this.lastSuccessfulPollAt = null;
    this.lastError = "";
    this.inFlight = null;
    this.intervalHandle = null;
  }

  start() {
    if (this.intervalHandle) return;
    this.refresh().catch(() => {});
    this.intervalHandle = setInterval(() => {
      this.refresh().catch(() => {});
    }, this.pollMs);
  }

  stop() {
    if (!this.intervalHandle) return;
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  pruneExpiredItems(now = Date.now()) {
    const retainedItems = this.items.filter((item) => {
      const timestamp = itemTimestamp(item);
      return !timestamp || now - timestamp < ITEM_RETENTION_MS;
    });

    if (retainedItems.length === this.items.length) {
      return;
    }

    this.items = retainedItems;
    this.seenKeys = new Set(this.items.map((item) => item.key));
    this.detailCache = new Map();
  }

  async refresh() {
    if (this.inFlight) return this.inFlight;

    this.pruneExpiredItems();
    this.lastCheckedAt = new Date().toISOString();

    this.inFlight = Promise.all(
      this.watchlist.feeds.map(async (feed) => {
        const response = await fetch(feed.url, {
          headers: {
            "User-Agent": "CandlestickLabNewsMonitor/1.0",
            Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          },
        });

        if (!response.ok) {
          throw new Error(`Feed ${feed.label} failed with ${response.status}`);
        }

        const xmlText = await response.text();
        return parseFeed(xmlText, feed).map((item) => analyzeItem(item, this.watchlist));
      })
    )
      .then((responses) => {
        const now = Date.now();
        const merged = new Map(this.items.map((item) => [item.key, { ...item, isNew: false }]));

        responses.flat().forEach((item) => {
          if (!item.title || !item.link) return;
          if (item.filteredOut) return;
          const alreadySeen = this.seenKeys.has(item.key);
          if (!alreadySeen) {
            this.seenKeys.add(item.key);
          }

          const existing = merged.get(item.key);
          merged.set(item.key, {
            ...item,
            firstSeenAt: alreadySeen
              ? existing?.firstSeenAt || new Date(now).toISOString()
              : new Date(now).toISOString(),
            isNew: !alreadySeen,
          });
        });

        this.items = Array.from(merged.values())
          .sort((left, right) => {
            const rightTime = Date.parse(right.publishedAt || right.firstSeenAt || 0);
            const leftTime = Date.parse(left.publishedAt || left.firstSeenAt || 0);
            if (right.score !== left.score) return right.score - left.score;
            return rightTime - leftTime;
          })
          .slice(0, MAX_ITEMS);

        this.pruneExpiredItems(now);

        this.lastSuccessfulPollAt = new Date().toISOString();
        this.lastError = "";
      })
      .catch((error) => {
        this.lastError = error instanceof Error ? error.message : String(error);
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  getStatus() {
    this.pruneExpiredItems();
    const now = Date.now();
    const newCount = this.items.filter((item) => now - Date.parse(item.firstSeenAt || 0) < this.pollMs * 2).length;

    return {
      id: this.watchlist.id,
      label: this.watchlist.label,
      description: this.watchlist.description,
      symbols: this.watchlist.symbols,
      pollMs: this.pollMs,
      feedCount: this.watchlist.feeds.length,
      totalItems: this.items.length,
      newItemCount: newCount,
      lastCheckedAt: this.lastCheckedAt,
      lastSuccessfulPollAt: this.lastSuccessfulPollAt,
      lastError: this.lastError,
      feeds: this.watchlist.feeds.map((feed) => ({ id: feed.id, label: feed.label })),
    };
  }

  getItems({
    limit = MAX_ITEMS,
    minScore = 4,
    maxAgeHours = 12,
    signalMode = "realtime",
    sourceMode = "established",
    tradingMode = "tradeable",
  } = {}) {
    this.pruneExpiredItems();
    const threshold = Number(minScore) || 0;
    const cappedLimit = Math.min(Math.max(Number(limit) || MAX_ITEMS, 1), MAX_ITEMS);
    const normalizedMaxAgeHours = normalizeMaxAgeHours(maxAgeHours);
    const normalizedSignalMode = normalizeSignalMode(signalMode);
    const normalizedSourceMode = normalizeSourceMode(sourceMode);
    const normalizedTradingMode = normalizeTradingMode(tradingMode);

    const stagedItems = this.items
      .map((item) => ({
        ...item,
        isFresh: Date.now() - Date.parse(item.firstSeenAt || 0) < this.pollMs * 2,
      }));

    return buildGroupedItems(stagedItems, this.watchlist, MAX_ITEMS)
      .filter((item) => item.score >= threshold)
      .filter((item) => matchesTimeliness(item, normalizedMaxAgeHours))
      .filter((item) => matchesSignalMode(item, normalizedSignalMode))
      .filter((item) => matchesSourceMode(item, normalizedSourceMode))
      .filter((item) => matchesTradingUsefulness(item, normalizedTradingMode))
      .slice(0, cappedLimit);
  }

  findItem(key) {
    this.pruneExpiredItems();
    return this.items.find((item) => item.key === key) || null;
  }

  findGroupedItem(key) {
    return this.getItems({ limit: MAX_ITEMS, minScore: 0 }).find((item) => item.combinedKey === key || item.key === key) || null;
  }

  async getDetail(key) {
    const item = this.findGroupedItem(key);
    if (!item) {
      throw new Error("Headline not found");
    }

    const cached = this.detailCache.get(key);
    if (cached) {
      return cached;
    }

    const fallbackUrl = item.link;
    const fallbackSummary = item.generatedSummary || createGeneratedSummary(item);
    const fallbackDetail = {
      key: item.key,
      resolvedUrl: fallbackUrl,
      shortUrl: item.sourceName || formatSourceLink(fallbackUrl),
      articleSummary: fallbackSummary,
      articleMeaning: buildOverallMeaning(item),
      references: item.references || [],
    };

    try {
      const response = await fetch(item.link, {
        headers: {
          "User-Agent": "CandlestickLabNewsMonitor/1.0",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        this.detailCache.set(key, fallbackDetail);
        return fallbackDetail;
      }

      const html = await response.text();
      const resolvedUrl = pickResolvedUrl(item, response.url || fallbackUrl, html);
      const extractedSummary = extractArticleSummary(html, item.title, item.summary || item.generatedSummary || item.whyItMatters);
      const articleSummary = isTitleLikeSummary(extractedSummary, item.title)
        ? item.generatedSummary || createGeneratedSummary(item)
        : buildParagraphSummary(item, extractedSummary, 620);
      const googleShell = looksLikeGoogleNewsShell(resolvedUrl, articleSummary);
      const detail = {
        key: item.key,
        resolvedUrl: googleShell ? item.link : resolvedUrl,
        shortUrl: googleShell ? item.sourceName || formatSourceLink(item.link) : formatSourceLink(resolvedUrl),
        articleSummary: googleShell
          ? item.generatedSummary || createGeneratedSummary(item)
          : articleSummary,
        articleMeaning: buildOverallMeaning(item),
        references: item.references || [],
      };

      this.detailCache.set(key, detail);
      return detail;
    } catch {
      this.detailCache.set(key, fallbackDetail);
      return fallbackDetail;
    }
  }
}

class NewsService {
  constructor(options = {}) {
    this.monitors = new Map(
      Object.values(WATCHLISTS).map((watchlist) => [watchlist.id, new NewsMonitor(watchlist, options)])
    );
  }

  start() {
    this.monitors.forEach((monitor) => monitor.start());
  }

  stop() {
    this.monitors.forEach((monitor) => monitor.stop());
  }

  getWatchlists() {
    return Object.values(WATCHLISTS).map((watchlist) => ({
      id: watchlist.id,
      label: watchlist.label,
      description: watchlist.description,
      symbols: watchlist.symbols,
    }));
  }

  getMonitor(id) {
    return this.monitors.get(id) || this.monitors.get("xauusd");
  }

  getStatus(id) {
    return this.getMonitor(id).getStatus();
  }

  getItems(id, options) {
    return this.getMonitor(id).getItems(options);
  }

  getCatalysts(id, options) {
    const monitor = this.getMonitor(id);
    return getUpcomingCatalysts(monitor.watchlist, options);
  }

  async refresh(id) {
    return this.getMonitor(id).refresh();
  }

  async getDetail(id, key) {
    return this.getMonitor(id).getDetail(key);
  }
}

function createNewsService(options) {
  return new NewsService(options);
}

module.exports = {
  createNewsService,
};
