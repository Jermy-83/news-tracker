const fs = require("fs");
const path = require("path");

const DEFAULT_POLL_MS = Number(process.env.NEWS_POLL_MS || 5_000);
const MAX_ITEMS = 400;
const ITEM_RETENTION_MS = 2 * 24 * 60 * 60 * 1000;
const ARTICLE_LOG_DIR = process.env.NEWS_ARTICLE_LOG_DIR || path.join(process.cwd(), "article-log");

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
      {
        id: "cnbc-markets",
        label: "CNBC Markets",
        url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
      },
      {
        id: "marketwatch-top",
        label: "MarketWatch",
        url: "https://feeds.content.dowjones.io/public/rss/mw_topstories",
      },
      {
        id: "fed-official",
        label: "Federal Reserve",
        url: "https://www.federalreserve.gov/feeds/press_all.xml",
      },
      {
        id: "us-data-search",
        label: "US Data Search",
        url: "https://news.google.com/rss/search?q=US+CPI+OR+PCE+OR+FOMC+OR+%22jobless+claims%22+OR+%22nonfarm+payrolls%22+when:12h+-analysis+-opinion+-forecast&hl=en-US&gl=US&ceid=US:en",
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
      "pce",
      "cpi",
      "gdp",
      "consumer confidence",
      "ism",
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
      {
        id: "fxstreet-news",
        label: "FXStreet",
        url: "https://www.fxstreet.com/rss/news",
      },
      {
        id: "kitco-news",
        label: "Kitco",
        url: "https://www.kitco.com/news/rss",
      },
      {
        id: "fed-official",
        label: "Federal Reserve",
        url: "https://www.federalreserve.gov/feeds/press_all.xml",
      },
      {
        id: "cnbc-markets",
        label: "CNBC Markets",
        url: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
      },
      {
        id: "marketwatch-top",
        label: "MarketWatch",
        url: "https://feeds.content.dowjones.io/public/rss/mw_topstories",
      },
      {
        id: "eia-energy",
        label: "EIA Energy",
        url: "https://www.eia.gov/rss/todayinenergy.xml",
      },
      {
        id: "gold-high-trust-search",
        label: "Gold High-Trust Search",
        url: "https://news.google.com/rss/search?q=gold+dollar+yields+Federal+Reserve+Reuters+OR+Bloomberg+OR+CNBC+when:12h&hl=en-US&gl=US&ceid=US:en",
      },
      {
        id: "us-data-search",
        label: "US Data Search",
        url: "https://news.google.com/rss/search?q=US+CPI+OR+PCE+OR+FOMC+OR+%22jobless+claims%22+OR+%22nonfarm+payrolls%22+when:12h+-analysis+-opinion+-forecast&hl=en-US&gl=US&ceid=US:en",
      },
      {
        id: "global-market-moving",
        label: "Global Shock Risk",
        url: "https://news.google.com/rss/search?q=%28%22stock+market+crash%22+OR+%22global+markets%22+OR+%22risk+off%22+OR+%22VIX+spikes%22+OR+%22banking+crisis%22+OR+%22credit+crunch%22+OR+%22emergency+Fed%22+OR+%22emergency+rate+cut%22+OR+%22Treasury+market%22+OR+%22bond+market+rout%22+OR+%22oil+shock%22+OR+%22OPEC+shock%22+OR+%22China+crisis%22+OR+%22BOJ+intervention%22+OR+%22geopolitical+escalation%22+OR+%22crypto+crash%22%29+when:12h+-opinion+-analysis+-forecast&hl=en-US&gl=US&ceid=US:en",
      },
      {
        id: "trump-x-statement-risk",
        label: "Trump / X Statement Risk",
        url: "https://news.google.com/rss/search?q=%28Trump+OR+%22Donald+Trump%22%29+%28X+OR+Twitter+OR+tweet+OR+posted+OR+%22Truth+Social%22+OR+says%29+%28tariff+OR+Fed+OR+dollar+OR+gold+OR+oil+OR+China+OR+Iran+OR+sanctions%29+when:12h+-opinion+-analysis+-column&hl=en-US&gl=US&ceid=US:en",
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
      "gdp",
      "consumer confidence",
      "ism",
      "jobless claims",
      "payrolls",
      "yields",
      "treasury",
      "dollar",
      "geopolitics",
      "war",
      "oil",
      "sanctions",
      "central bank",
      "safe haven",
      "real yields",
      "crude inventories",
      "trump",
      "donald trump",
      "twitter",
      "tweet",
      "truth social",
      "tariff",
      "china",
      "iran",
      "political risk",
      "vix",
      "volatility",
      "risk off",
      "stock market crash",
      "global markets",
      "banking crisis",
      "credit crunch",
      "emergency fed",
      "emergency rate cut",
      "bond market rout",
      "oil shock",
      "opec shock",
      "china crisis",
      "geopolitical escalation",
      "crypto crash",
      "boj",
      "intervention",
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
      {
        id: "coindesk",
        label: "CoinDesk",
        url: "https://www.coindesk.com/arc/outboundfeeds/rss",
      },
      {
        id: "cointelegraph",
        label: "Cointelegraph",
        url: "https://cointelegraph.com/rss",
      },
      {
        id: "decrypt",
        label: "Decrypt",
        url: "https://decrypt.co/feed",
      },
      {
        id: "investing-crypto",
        label: "Investing Crypto",
        url: "https://www.investing.com/rss/news_301.rss",
      },
      {
        id: "fed-official",
        label: "Federal Reserve",
        url: "https://www.federalreserve.gov/feeds/press_all.xml",
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
const CATALYST_FOLLOWUP_HOURS = 12;
const NEW_YORK_TIME_ZONE = "America/New_York";
const FOREX_FACTORY_CALENDAR_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const CATALYST_FEED_CACHE_MS = 5 * 60 * 1000;
const MARKET_REACTION_CACHE_MS = 1_000;
const MARKET_REACTION_POLL_MS = 5_000;
const HEADLINE_REACTION_CACHE_MS = 30 * 1000;
const MARKET_REACTION_SYMBOLS = [
  {
    id: "xauusd",
    label: "XAUUSD",
    symbol: "XAU",
    role: "live quote",
    format: "price",
    source: "goldproxy",
    sourceLabel: "Yahoo Gold futures",
  },
  { id: "dxy", label: "DXY", symbol: "DX-Y.NYB", role: "dollar driver", format: "price", visible: false },
  { id: "us10y", label: "US10Y", symbol: "^TNX", role: "yield driver", format: "yield", visible: false },
];
const HEADLINE_REACTION_SYMBOLS = [
  { id: "gold", label: "Gold futures", symbol: "GC=F", role: "gold proxy", format: "price", expectedForGold: 1 },
  { id: "dxy", label: "DXY", symbol: "DX-Y.NYB", role: "dollar driver", format: "price", expectedForGold: -1 },
  { id: "us10y", label: "US10Y", symbol: "^TNX", role: "yield driver", format: "yield", expectedForGold: -1 },
];

let forexFactoryCalendarCache = {
  fetchedAt: 0,
  items: [],
  error: "",
};

let marketReactionCache = {
  fetchedAt: 0,
  payload: null,
};

let goldVolatilityCache = {
  fetchedAt: 0,
  payload: null,
};

const headlineReactionCache = new Map();

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
  { id: "political-risk", label: "Political Risk", keywords: ["trump", "donald trump", "twitter", "tweet", "truth social", "x post", "white house"] },
  { id: "global-shock", label: "Global Shock", keywords: ["stock market crash", "global markets", "vix spikes", "risk off", "banking crisis", "credit crunch", "emergency fed", "emergency rate cut", "bond market rout", "oil shock", "opec shock", "china crisis", "geopolitical escalation", "crypto crash"] },
  { id: "global-central-banks", label: "Global Central Banks", keywords: ["boj intervention", "ecb emergency", "bank of japan intervention", "emergency central bank", "currency intervention"] },
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
  { symbols: ["SPX", "VIX", "DXY", "US10Y"], keywords: ["stock market crash", "global markets", "vix", "risk off", "banking crisis", "credit crunch", "bond market rout", "emergency fed", "emergency rate cut"] },
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
  "trump",
  "truth social",
  "tweet",
  "export curbs",
  "missile",
  "etf",
  "vix",
  "stock market crash",
  "global markets",
  "banking crisis",
  "credit crunch",
  "bond market rout",
  "emergency fed",
  "emergency rate cut",
  "oil shock",
  "opec shock",
  "china crisis",
  "geopolitical escalation",
  "crypto crash",
  "boj intervention",
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
  "trump says",
  "trump posts",
  "truth social",
  "tweet",
  "risk off",
  "vix spikes",
  "banking crisis",
  "credit crunch",
  "emergency rate cut",
  "emergency fed",
  "oil shock",
  "crypto crash",
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
  { pattern: /\bfederal reserve\b|\bbls\b|\bbea\b|\beia\b|\bus treasury\b|\bism\b/i, score: 2.8 },
  { pattern: /\breuters\b/i, score: 2.8 },
  { pattern: /\bbloomberg\b/i, score: 2.6 },
  { pattern: /\bassociated press\b|\bap news\b/i, score: 2.4 },
  { pattern: /\bfinancial times\b|\bft\b/i, score: 2.4 },
  { pattern: /\bwall street journal\b|\bwsj\b/i, score: 2.4 },
  { pattern: /\bnew york times\b/i, score: 2.2 },
  { pattern: /\bcoindesk\b|\bkitco\b/i, score: 2.0 },
  { pattern: /\bcnbc\b/i, score: 2.0 },
  { pattern: /\bfxstreet\b/i, score: 1.9 },
  { pattern: /\bmarketwatch\b|\binvesting\.com\b/i, score: 1.8 },
  { pattern: /\bdecrypt\b|\bcointelegraph\b/i, score: 1.6 },
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
        whyItMatters: buildTradingWhyItMatters(primary, {
          eventDriven: primary.eventDriven,
          sourceQuality: bestSourceAuthority.score,
          uniqueSources,
        }),
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
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#(\d+);/g, (_, code) => {
      const value = Number(code);
      return Number.isFinite(value) ? String.fromCharCode(value) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      const value = Number.parseInt(code, 16);
      return Number.isFinite(value) ? String.fromCharCode(value) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeadlineText(value) {
  return decodeHtml(value)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s*[-–—]\s*(Reuters|Bloomberg|CNBC|MarketWatch|FXStreet|Kitco|CoinDesk|Cointelegraph|Decrypt|CHOSUNBIZ|MSN)\s*$/i, "")
    .replace(/\s*\|\s*(Reuters|Bloomberg|CNBC|MarketWatch|FXStreet|Kitco|CoinDesk|Cointelegraph|Decrypt|MSN)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTrailingSource(text, sourceName) {
  let clean = normalizeHeadlineText(text);
  if (!sourceName) {
    return clean;
  }

  const escapedSource = String(sourceName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const suffix = new RegExp(`\\s*(?:[-–—|]\\s*)?${escapedSource}\\s*$`, "i");
  clean = clean.replace(suffix, "").trim();

  const sourceTokens = String(sourceName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
  const lastWord = sourceTokens.at(-1);
  if (lastWord) {
    clean = clean.replace(new RegExp(`\\s*(?:[-–—|]\\s*)?${lastWord}\\s*$`, "i"), "").trim();
  }

  return normalizeHeadlineText(clean);
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

function isLikelySourceSuffix(value) {
  const clean = normalizeHeadlineText(value);
  if (!clean) {
    return false;
  }

  if (/[?]|^(details|report|analysis|opinion|preview|watch|what you need to know|where is|why it matters)$/i.test(clean)) {
    return false;
  }

  if (/\.(com|net|org|io|co)\b/i.test(clean)) {
    return true;
  }

  if (/^(Reuters|Bloomberg|CNBC|MarketWatch|FXStreet|Kitco|CoinDesk|Cointelegraph|Decrypt|MSN|Yahoo Finance|NDTV Profit|Moneycontrol|Rediff MoneyWiz|CHOSUNBIZ)$/i.test(clean)) {
    return true;
  }

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 4) {
    return false;
  }

  if (/[^\x00-\x7F]/.test(clean) && clean.length <= 28) {
    return true;
  }

  const hasPublisherShape = words.some((word) => /^[A-Z][A-Za-z0-9&.]*$/.test(word) || /^[A-Z]{2,}$/.test(word));
  const hasSentenceShape = /\b(is|are|was|were|can|could|may|might|will|should|amid|ahead|after|before|because)\b/i.test(clean);

  return hasPublisherShape && !hasSentenceShape;
}

function splitSourceFromTitle(title, feedLabel) {
  const cleanTitle = normalizeHeadlineText(title);
  const parts = cleanTitle.split(/\s+-\s+/);
  if (parts.length > 1) {
    const sourceName = normalizeHeadlineText(parts.at(-1));
    if (isLikelySourceSuffix(sourceName)) {
      return {
        cleanTitle: stripTrailingSource(parts.slice(0, -1).join(" - "), sourceName),
        sourceName,
      };
    }

    if (/^details$/i.test(sourceName)) {
      return {
        cleanTitle: normalizeHeadlineText(parts.slice(0, -1).join(" - ")),
        sourceName: feedLabel,
      };
    }
  }

  return {
    cleanTitle: stripTrailingSource(cleanTitle, feedLabel),
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

function extractXmlField(block, field) {
  const match = String(block || "").match(new RegExp(`<${field}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${field}>`, "i"));
  if (!match) {
    return "";
  }

  return decodeHtml(match[1])
    .replace(/^\s*<!\[CDATA\[/, "")
    .replace(/\]\]>\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseForexFactoryDate(dateText, timeText) {
  const dateMatch = String(dateText || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!dateMatch) {
    return null;
  }

  const month = Number(dateMatch[1]);
  const day = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const time = String(timeText || "").trim().toLowerCase();
  if (!time || time === "all day" || time === "tentative") {
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }

  const timeMatch = time.match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!timeMatch) {
    return null;
  }

  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const meridiem = timeMatch[3].toLowerCase();
  if (meridiem === "am" && hour === 12) {
    hour = 0;
  }
  if (meridiem === "pm" && hour !== 12) {
    hour += 12;
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
}

function parseForexFactoryCalendar(xmlText) {
  return Array.from(String(xmlText || "").matchAll(/<event>([\s\S]*?)<\/event>/gi))
    .map((match) => {
      const block = match[1];
      const date = extractXmlField(block, "date");
      const time = extractXmlField(block, "time");
      const scheduledAt = parseForexFactoryDate(date, time);

      return {
        title: extractXmlField(block, "title"),
        country: extractXmlField(block, "country"),
        date,
        time,
        scheduledAt: scheduledAt ? scheduledAt.toISOString() : "",
        calendarImpact: extractXmlField(block, "impact"),
        forecast: extractXmlField(block, "forecast"),
        previous: extractXmlField(block, "previous"),
        url: extractXmlField(block, "url"),
      };
    })
    .filter((item) => item.title && item.scheduledAt);
}

function parseForexFactoryCalendarJson(jsonText) {
  let events = [];
  try {
    events = JSON.parse(String(jsonText || "[]"));
  } catch {
    return [];
  }

  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .map((event) => {
      const scheduledAt = new Date(event.date);
      return {
        title: String(event.title || "").trim(),
        country: String(event.country || "").trim(),
        date: String(event.date || "").trim(),
        time: "",
        scheduledAt: Number.isNaN(scheduledAt.getTime()) ? "" : scheduledAt.toISOString(),
        calendarImpact: String(event.impact || "").trim(),
        forecast: String(event.forecast || "").trim(),
        previous: String(event.previous || "").trim(),
        url: String(event.url || "").trim(),
      };
    })
    .filter((item) => item.title && item.scheduledAt);
}

async function fetchForexFactoryCalendar() {
  const now = Date.now();
  if (forexFactoryCalendarCache.fetchedAt && now - forexFactoryCalendarCache.fetchedAt < CATALYST_FEED_CACHE_MS) {
    return forexFactoryCalendarCache;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(FOREX_FACTORY_CALENDAR_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 MarketIntelligenceDesk/1.0",
        Accept: "application/json,text/xml;q=0.8,*/*;q=0.7",
      },
    });

    if (!response.ok) {
      throw new Error(`ForexFactory calendar failed with ${response.status}`);
    }

    const responseText = await response.text();
    forexFactoryCalendarCache = {
      fetchedAt: Date.now(),
      items: response.headers.get("content-type")?.includes("json")
        ? parseForexFactoryCalendarJson(responseText)
        : parseForexFactoryCalendar(responseText),
      error: "",
    };
  } catch (error) {
    forexFactoryCalendarCache = {
      fetchedAt: Date.now(),
      items: forexFactoryCalendarCache.items,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }

  return forexFactoryCalendarCache;
}

function catalystImpactScore(impact) {
  if (impact === "high") return 3;
  if (impact === "medium") return 2;
  return 1;
}

function officialSourcesForCatalyst(title, country = "") {
  const text = `${title} ${country}`.toLowerCase();
  const isUsd = !country || country.toUpperCase() === "USD";
  const sources = [];

  if (isUsd && /\bfomc\b|federal funds|fed\b|powell|federal reserve/.test(text)) {
    sources.push({ label: "Federal Reserve", url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm", type: "official" });
  }
  if (country.toUpperCase() === "JPY" && /boj|policy|rate|press conference|outlook/.test(text)) {
    sources.push({ label: "Bank of Japan", url: "https://www.boj.or.jp/en/mopo/mpmdeci/index.htm", type: "official" });
  }
  if (country.toUpperCase() === "EUR" && /ecb|monetary policy|refinancing rate|press conference/.test(text)) {
    sources.push({ label: "ECB", url: "https://www.ecb.europa.eu/press/govcdec/mopo/html/index.en.html", type: "official" });
  }
  if (country.toUpperCase() === "GBP" && /boe|bank rate|monetary policy|mpc/.test(text)) {
    sources.push({ label: "Bank of England", url: "https://www.bankofengland.co.uk/monetary-policy-summary-and-minutes", type: "official" });
  }
  if (country.toUpperCase() === "CAD" && /boc|overnight rate|monetary policy|press conference/.test(text)) {
    sources.push({ label: "Bank of Canada", url: "https://www.bankofcanada.ca/core-functions/monetary-policy/key-interest-rate/", type: "official" });
  }
  if (isUsd && /\bcpi\b|employment cost|nonfarm|payroll|jolts|unemployment rate/.test(text)) {
    sources.push({ label: "BLS", url: "https://www.bls.gov/schedule/news_release/", type: "official" });
  }
  if (isUsd && /\bpce\b|personal income|personal spending|gdp|goods trade|wholesale inventories/.test(text)) {
    sources.push({ label: "BEA", url: "https://www.bea.gov/news/schedule", type: "official" });
  }
  if (isUsd && /unemployment claims|jobless claims/.test(text)) {
    sources.push({ label: "US Labor Dept", url: "https://www.dol.gov/ui/data.pdf", type: "official" });
  }
  if (isUsd && /ism|pmi/.test(text)) {
    sources.push({
      label: "ISM",
      url: "https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/",
      type: "official",
    });
  }
  if (isUsd && /crude oil|natural gas|inventories|storage/.test(text)) {
    sources.push({ label: "EIA", url: "https://www.eia.gov/petroleum/supply/weekly/", type: "official" });
  }
  if (isUsd && /treasury|bond auction|note auction|bill auction/.test(text)) {
    sources.push({ label: "US Treasury", url: "https://www.treasurydirect.gov/auctions/announcements-data-results/", type: "official" });
  }
  if (isUsd && /consumer confidence/.test(text)) {
    sources.push({ label: "Conference Board", url: "https://www.conference-board.org/topics/consumer-confidence", type: "source" });
  }

  return sources;
}

function dedupeSources(sources) {
  const seen = new Set();
  return sources.filter((source) => {
    const key = `${source.label}|${source.url}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeValues(values) {
  return uniq(values.map((value) => String(value || "").trim()).filter(Boolean));
}

function catalystMergeWords(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\bus\b/g, "united states")
    .replace(/\brelease window\b/g, "")
    .replace(/\brisk window\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !TITLE_STOP_WORDS.has(word));
}

function catalystThemeScore(left, right) {
  const leftWords = catalystMergeWords(`${left.title} ${left.category}`);
  const rightWords = catalystMergeWords(`${right.title} ${right.category}`);
  const rightSet = new Set(rightWords);
  const sharedWords = leftWords.filter((word) => rightSet.has(word)).length;
  const sharedCategory = String(left.category || "").toLowerCase() === String(right.category || "").toLowerCase();
  const sharedCountry = String(left.country || "").toUpperCase() && String(left.country || "").toUpperCase() === String(right.country || "").toUpperCase();

  return sharedWords + (sharedCategory ? 3 : 0) + (sharedCountry ? 1 : 0);
}

function isSameCatalyst(left, right) {
  const leftTime = Date.parse(left.scheduledAt || "");
  const rightTime = Date.parse(right.scheduledAt || "");
  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) {
    return false;
  }

  const sameWindow = Math.abs(leftTime - rightTime) <= 2 * 3_600_000;
  return sameWindow && catalystThemeScore(left, right) >= 3;
}

function preferCatalystTitle(left, right) {
  const leftTitle = String(left.title || "");
  const rightTitle = String(right.title || "");
  const leftIsModel = /window/i.test(leftTitle);
  const rightIsModel = /window/i.test(rightTitle);
  if (leftIsModel && !rightIsModel) return rightTitle;
  if (rightIsModel && !leftIsModel) return leftTitle;
  return rightTitle.length > leftTitle.length ? rightTitle : leftTitle;
}

function combineCatalysts(existing, incoming) {
  const sources = dedupeSources([...(existing.sources || []), ...(incoming.sources || [])]);
  const dataSources = dedupeValues([existing.dataSource, incoming.dataSource, ...(existing.dataSources || []), ...(incoming.dataSources || [])]);
  const impactScore = Math.max(Number(existing.impactScore || 0), Number(incoming.impactScore || 0));
  const impactRank = { high: 3, medium: 2, low: 1 };
  const impact =
    (impactRank[incoming.impact] || 0) > (impactRank[existing.impact] || 0)
      ? incoming.impact
      : existing.impact;

  return {
    ...existing,
    title: preferCatalystTitle(existing, incoming),
    category: incoming.category || existing.category,
    impact,
    scheduledAt: existing.scheduledAt || incoming.scheduledAt,
    country: existing.country || incoming.country,
    forecast: existing.forecast || incoming.forecast,
    previous: existing.previous || incoming.previous,
    sources,
    sourceCount: sources.length,
    sourceLabel: sources.length > 1 ? `${sources.length} sources` : sources[0]?.label || existing.sourceLabel || incoming.sourceLabel,
    dataSource: dataSources.join(" + "),
    dataSources,
    whyItMatters: existing.whyItMatters || incoming.whyItMatters,
    tradeRisk: existing.tradeRisk || incoming.tradeRisk,
    impactScore,
    id: existing.id || incoming.id,
  };
}

function classifyXauusdCatalyst(event) {
  const title = String(event.title || "");
  const country = String(event.country || "");
  const text = `${title} ${country}`.toLowerCase();
  const calendarImpact = String(event.calendarImpact || "").toLowerCase();
  const isUsd = country.toUpperCase() === "USD";
  const isHigh = calendarImpact === "high";
  const isMedium = calendarImpact === "medium";
  const centralBank = /\bfomc\b|fed\b|federal funds|rate statement|policy statement|press conference|central bank|ecb|boj|boe|boc/.test(text);
  const inflation = /\bcpi\b|\bpce\b|inflation|price index|prices|employment cost/.test(text);
  const labor = /payroll|employment|unemployment|claims|jolts|adp/.test(text);
  const growth = /\bgdp\b|retail sales|consumer confidence|durable goods|ism|pmi|manufacturing/.test(text);
  const energy = /crude oil|natural gas|inventories|storage/.test(text);
  const rates = /treasury|bond auction|yield|federal funds|rate/.test(text);
  const globalRisk = ["EUR", "JPY", "GBP", "CAD", "CNY", "AUD"].includes(country.toUpperCase()) && isHigh && centralBank;

  if (!isUsd && !globalRisk) {
    return null;
  }

  if (!isHigh && !isMedium && !energy && !rates) {
    return null;
  }

  let score = isHigh ? 78 : isMedium ? 58 : 36;
  if (isUsd) score += 16;
  if (centralBank) score += 18;
  if (inflation) score += 18;
  if (labor) score += 12;
  if (growth) score += 9;
  if (energy) score += 8;
  if (rates) score += 10;
  if (globalRisk) score += 8;

  score = clamp(score, 1, 100);

  const category = centralBank
    ? "Rates"
    : inflation
      ? "Inflation"
      : labor
        ? "Labor"
        : growth
          ? "Growth"
          : energy
            ? "Energy"
            : rates
              ? "Rates"
              : "Macro";
  const impact = score >= 82 ? "high" : score >= 55 ? "medium" : "low";
  const drivers = [
    centralBank ? "central-bank repricing" : "",
    inflation ? "inflation impulse" : "",
    labor ? "labor-market signal" : "",
    growth ? "growth signal" : "",
    energy ? "oil/inflation channel" : "",
    rates ? "yield sensitivity" : "",
  ].filter(Boolean);
  const sources = dedupeSources([
    { label: "ForexFactory", url: event.url || "https://www.forexfactory.com/calendar", type: "calendar" },
    ...officialSourcesForCatalyst(title, country),
  ]);

  return {
    id: `ff-${country}-${title}-${event.scheduledAt}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title,
    category,
    impact,
    scheduledAt: event.scheduledAt,
    watchlistId: "xauusd",
    watchlistLabel: "XAUUSD",
    country,
    forecast: event.forecast,
    previous: event.previous,
    sourceLabel: sources.length > 1 ? `${sources.length} sources` : sources[0]?.label || "ForexFactory",
    sourceCount: sources.length,
    sources,
    dataSource: "ForexFactory weekly calendar",
    whyItMatters:
      drivers.length > 0
        ? `Gold is sensitive to ${drivers.join(", ")} through the dollar, Treasury yields, and real-rate expectations.`
        : "Relevant scheduled macro event for XAUUSD risk management.",
    tradeRisk:
      impact === "high"
        ? "High gap/slippage risk around the release. Wait for dollar and yield confirmation before chasing the first move."
        : "Medium event risk. Use the timing as a volatility marker and confirm with DXY and US yields.",
    impactScore: score,
  };
}

function buildOfficialScheduleCatalysts(watchlist, now, end, watchlistId) {
  return CATALYST_DEFINITIONS
    .filter((definition) => definition.watchlists.includes(watchlistId))
    .flatMap((definition) =>
      definition.schedule(now, end).map((scheduledAt) => {
        const sources = dedupeSources([
          { label: "Desk timing model", url: "", type: "model" },
          ...officialSourcesForCatalyst(definition.title),
        ]);

        return {
          id: `${definition.id}-${scheduledAt.toISOString()}`,
          title: definition.title,
          category: definition.category,
          impact: definition.impact,
          scheduledAt: scheduledAt.toISOString(),
          watchlistId,
          watchlistLabel: watchlist?.label || watchlistId.toUpperCase(),
          sourceLabel: sources.length > 1 ? `${sources.length} sources` : "Desk timing model",
          sourceCount: sources.length,
          sources,
          dataSource: "Official schedule model",
          whyItMatters: definition.whyItMatters,
          tradeRisk: definition.tradeRisk,
          impactScore: catalystImpactScore(definition.impact) * 20,
        };
      })
    );
}

function mergeCatalysts(...groups) {
  const merged = [];

  groups.flat().filter(Boolean).forEach((item) => {
    const existingIndex = merged.findIndex((candidate) => isSameCatalyst(candidate, item));
    if (existingIndex === -1) {
      merged.push(item);
      return;
    }

    merged[existingIndex] = combineCatalysts(merged[existingIndex], item);
  });

  return merged;
}

function catalystStatus(catalyst, now = new Date()) {
  const scheduledAt = Date.parse(catalyst.scheduledAt || "");
  if (!Number.isFinite(scheduledAt)) {
    return "upcoming";
  }

  const deltaMinutes = (scheduledAt - now.getTime()) / 60_000;
  if (deltaMinutes > 0) {
    return "upcoming";
  }

  if (deltaMinutes >= -90) {
    return "live";
  }

  return "recent";
}

function catalystMatchKeywords(catalyst) {
  const title = String(catalyst.title || "").toLowerCase();
  const category = String(catalyst.category || "").toLowerCase();
  const keywords = [
    ...title
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !TITLE_STOP_WORDS.has(word)),
  ];

  if (category === "inflation") keywords.push("cpi", "pce", "inflation", "prices");
  if (category === "rates") keywords.push("fed", "fomc", "rate", "powell", "yields", "treasury");
  if (category === "labor") keywords.push("jobs", "claims", "payrolls", "unemployment", "employment");
  if (category === "growth") keywords.push("gdp", "ism", "pmi", "consumer", "confidence");
  if (category === "energy") keywords.push("oil", "crude", "inventories", "energy");
  keywords.push("gold", "xauusd", "dollar", "yields");

  return uniq(keywords);
}

function relatedNewsScore(catalyst, item) {
  const scheduledAt = Date.parse(catalyst.scheduledAt || "");
  const itemTime = itemTimestamp(item);
  if (!Number.isFinite(scheduledAt) || !itemTime) {
    return 0;
  }

  const windowStart = scheduledAt - 2 * 3_600_000;
  const windowEnd = scheduledAt + CATALYST_FOLLOWUP_HOURS * 3_600_000;
  if (itemTime < windowStart || itemTime > windowEnd) {
    return 0;
  }

  const text = `${item.title} ${item.generatedSummary || ""} ${item.summary || ""} ${item.whyItMatters || ""}`.toLowerCase();
  const keywords = catalystMatchKeywords(catalyst);
  const keywordHits = keywords.reduce((count, keyword) => (text.includes(keyword) ? count + 1 : count), 0);
  const sourceBonus = Number(item.sourceAuthorityScore || 0);
  const impactBonus = item.impact === "high" ? 3 : item.impact === "medium" ? 1.5 : 0;

  return keywordHits * 2 + sourceBonus + impactBonus;
}

function inferXauusdImpact(catalyst, relatedNews) {
  if (!relatedNews.length) {
    return catalyst.status === "upcoming"
      ? "When this event hits, watch DXY and US yields first. The post-event read will update here when matching headlines arrive."
      : "Event window has passed, but no matching headline is confirmed yet. Treat the first move as unconfirmed until fresh source coverage appears.";
  }

  const text = relatedNews.map((item) => `${item.title} ${item.sourceName}`).join(" ").toLowerCase();
  const bullishHits = countMatches(text, [
    "gold rises",
    "gold rallies",
    "gold surges",
    "gold gains",
    "dollar weakens",
    "dollar falls",
    "yields fall",
    "yields drop",
    "rate cut",
    "dovish",
    "war",
    "attack",
    "safe haven",
    "inflation shock",
  ]);
  const bearishHits = countMatches(text, [
    "gold falls",
    "gold drops",
    "gold dips",
    "gold slides",
    "dollar rises",
    "dollar gains",
    "yields rise",
    "yields climb",
    "hawkish",
    "rate hike",
    "profit booking",
    "risk-on",
  ]);

  if (bullishHits > bearishHits) {
    return "Post-event read: bullish risk for XAUUSD. Headlines point to safe-haven demand, weaker dollar/yields, or inflation stress. Confirm with DXY and US10Y before chasing.";
  }

  if (bearishHits > bullishHits) {
    return "Post-event read: bearish risk for XAUUSD. Headlines point to stronger dollar/yields, hawkish repricing, or profit-taking. Avoid longs unless gold reclaims the first reaction.";
  }

  return "Post-event read: mixed for XAUUSD. News flow is active but not one-sided; use DXY, US10Y, and gold's first 15-minute range for confirmation.";
}

function attachCatalystFollowups(catalysts, relatedItems, now = new Date()) {
  return catalysts.map((catalyst) => {
    const status = catalystStatus(catalyst, now);
    const relatedNews =
      status === "upcoming"
        ? []
        : relatedItems
            .map((item) => ({ item, score: relatedNewsScore(catalyst, item) }))
            .filter((entry) => entry.score >= 5)
            .sort((left, right) => {
              if (right.score !== left.score) return right.score - left.score;
              return itemTimestamp(right.item) - itemTimestamp(left.item);
            })
            .slice(0, 3)
            .map((entry) => ({
              title: entry.item.title,
              sourceName: entry.item.sourceName,
              publishedAt: entry.item.publishedAt || entry.item.firstSeenAt,
              link: entry.item.link,
              impact: entry.item.impact,
              score: entry.item.score,
            }));

    return {
      ...catalyst,
      status,
      relatedNews,
      marketImpactRead: inferXauusdImpact({ ...catalyst, status }, relatedNews),
    };
  });
}

async function getUpcomingCatalysts(watchlist, { hours = CATALYST_WINDOW_HOURS, relatedItems = [] } = {}) {
  const now = new Date();
  const start = new Date(now.getTime() - CATALYST_FOLLOWUP_HOURS * 3_600_000);
  const windowHours = clamp(Number(hours) || CATALYST_WINDOW_HOURS, 24, 336);
  const end = new Date(now.getTime() + windowHours * 3_600_000);
  const watchlistId = watchlist?.id || "xauusd";
  const officialScheduleItems = buildOfficialScheduleCatalysts(watchlist, start, end, watchlistId);
  let liveItems = [];
  let sourceError = "";

  if (watchlistId === "xauusd") {
    const calendar = await fetchForexFactoryCalendar();
    sourceError = calendar.error;
    liveItems = calendar.items
      .filter((item) => {
        const scheduledAt = Date.parse(item.scheduledAt);
        return Number.isFinite(scheduledAt) && scheduledAt > start.getTime() && scheduledAt <= end.getTime();
      })
      .map(classifyXauusdCatalyst)
      .filter(Boolean);
  }

  const sourceItems =
    watchlistId === "xauusd" ? mergeCatalysts(liveItems, officialScheduleItems) : mergeCatalysts(officialScheduleItems);
  const items = attachCatalystFollowups(sourceItems, relatedItems, now)
    .sort((left, right) => {
      const statusRank = { live: 0, recent: 1, upcoming: 2 };
      const statusDiff = (statusRank[left.status] ?? 2) - (statusRank[right.status] ?? 2);
      if (statusDiff !== 0) return statusDiff;
      const timeDiff = Date.parse(left.scheduledAt) - Date.parse(right.scheduledAt);
      if (timeDiff !== 0) return timeDiff;
      return right.impactScore - left.impactScore;
    })
    .slice(0, CATALYST_MAX_ITEMS);
  const sourceNames = uniq(items.flatMap((item) => (item.sources || []).map((source) => source.label)).filter(Boolean));

  return {
    generatedAt: now.toISOString(),
    windowHours,
    watchlistId,
    watchlistLabel: watchlist?.label || watchlistId.toUpperCase(),
    sourceLabel: watchlistId === "xauusd" ? "Multi-source calendar" : "Official schedule model",
    sourceError,
    sourceNames,
    disclaimer:
      watchlistId === "xauusd"
        ? "Live calendar events, official release references, and desk risk windows are merged into one deduped XAUUSD catalyst tape."
        : "Official release references and desk risk windows are merged into one catalyst tape.",
    items,
  };
}

function yahooChartUrl(symbol) {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;
}

function yahooChartRangeUrl(symbol, range = "5d", interval = "15m") {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(
    range
  )}&interval=${encodeURIComponent(interval)}`;
}

function stooqQuoteUrl(symbol) {
  return `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
}

function vangSpotUrl(symbol) {
  return `https://www.vang.today/api/prices?type=${encodeURIComponent(symbol)}`;
}

function goldApiSpotUrl(symbol) {
  return `https://api.gold-api.com/price/${encodeURIComponent(symbol)}`;
}

function latestFinite(values) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = Number(values[index]);
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

async function fetchMarketInstrument(instrument) {
  if (instrument.source === "goldapi") {
    try {
      return await fetchGoldApiSpotInstrument(instrument);
    } catch {
      return fetchYahooGoldProxyInstrument(instrument);
    }
  }

  if (instrument.source === "goldproxy") {
    return fetchYahooGoldProxyInstrument(instrument);
  }

  if (instrument.source === "vang") {
    return fetchVangSpotInstrument(instrument);
  }

  if (instrument.source === "stooq") {
    return fetchStooqInstrument(instrument);
  }

  const response = await fetch(yahooChartUrl(instrument.symbol), {
    headers: {
      "User-Agent": "MarketIntelligenceDesk/1.0",
      Accept: "application/json,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`${instrument.label} failed with ${response.status}`);
  }

  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  if (!result) {
    throw new Error(`${instrument.label} returned no data`);
  }

  const meta = result.meta || {};
  const closeValues = result.indicators?.quote?.[0]?.close || [];
  const latest = Number(meta.regularMarketPrice) || latestFinite(closeValues);
  const previousClose = Number(meta.previousClose || meta.chartPreviousClose);
  const firstClose = latestFinite(closeValues.slice(0, 4)) || previousClose;

  if (!Number.isFinite(latest) || !Number.isFinite(previousClose)) {
    throw new Error(`${instrument.label} has incomplete price data`);
  }

  const dayChange = latest - previousClose;
  const dayChangePercent = previousClose ? (dayChange / previousClose) * 100 : 0;
  const intradayChange = Number.isFinite(firstClose) ? latest - firstClose : dayChange;
  const intradayChangePercent = Number.isFinite(firstClose) && firstClose ? (intradayChange / firstClose) * 100 : dayChangePercent;

  return {
    ...instrument,
    name: meta.shortName || instrument.label,
    price: latest,
    previousClose,
    dayChange,
    dayChangePercent,
    intradayChange,
    intradayChangePercent,
    updatedAt: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
  };
}

async function fetchGoldApiSpotInstrument(instrument) {
  const response = await fetch(goldApiSpotUrl(instrument.symbol), {
    headers: {
      "User-Agent": "MarketIntelligenceDesk/1.0",
      Accept: "application/json,*/*;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`${instrument.label} failed with ${response.status}`);
  }

  const payload = await response.json();
  const latest = Number(payload.price);
  const updatedAt = payload.updatedAt ? new Date(payload.updatedAt).toISOString() : new Date().toISOString();

  if (!Number.isFinite(latest)) {
    throw new Error(`${instrument.label} returned no spot price`);
  }

  const staleMs = Date.now() - Date.parse(updatedAt);
  if (Number.isFinite(staleMs) && staleMs > 15_000) {
    throw new Error(`${instrument.label} spot quote is stale`);
  }

  return {
    ...instrument,
    name: payload.name ? `${payload.name} (XAU/USD)` : instrument.label,
    price: latest,
    previousClose: latest,
    dayChange: 0,
    dayChangePercent: 0,
    intradayChange: 0,
    intradayChangePercent: 0,
    updatedAt,
  };
}

async function fetchYahooGoldProxyInstrument(instrument) {
  const response = await fetch(yahooChartUrl("GC=F"), {
    headers: {
      "User-Agent": "MarketIntelligenceDesk/1.0",
      Accept: "application/json,*/*;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`${instrument.label} fallback failed with ${response.status}`);
  }

  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  if (!result) {
    throw new Error(`${instrument.label} fallback returned no data`);
  }

  const meta = result.meta || {};
  const closeValues = result.indicators?.quote?.[0]?.close || [];
  const latest = Number(meta.regularMarketPrice) || latestFinite(closeValues);
  const previousClose = Number(meta.previousClose || meta.chartPreviousClose);
  const firstClose = latestFinite(closeValues.slice(0, 4)) || previousClose;

  if (!Number.isFinite(latest) || !Number.isFinite(previousClose)) {
    throw new Error(`${instrument.label} fallback has incomplete price data`);
  }

  const dayChange = latest - previousClose;
  const dayChangePercent = previousClose ? (dayChange / previousClose) * 100 : 0;
  const intradayChange = Number.isFinite(firstClose) ? latest - firstClose : dayChange;
  const intradayChangePercent = Number.isFinite(firstClose) && firstClose ? (intradayChange / firstClose) * 100 : dayChangePercent;

  return {
    ...instrument,
    name: "Gold futures (GC=F)",
    price: latest,
    previousClose,
    dayChange,
    dayChangePercent,
    intradayChange,
    intradayChangePercent,
    updatedAt: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
    sourceLabel: "Yahoo Gold futures",
  };
}

async function fetchVangSpotInstrument(instrument) {
  const response = await fetch(vangSpotUrl(instrument.symbol), {
    headers: {
      "User-Agent": "MarketIntelligenceDesk/1.0",
      Accept: "application/json,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`${instrument.label} failed with ${response.status}`);
  }

  const payload = await response.json();
  if (!payload?.success) {
    throw new Error(`${instrument.label} returned no spot data`);
  }

  const latest = Number(payload.buy);
  const dayChange = Number(payload.change_buy);
  const previousClose = Number.isFinite(latest) && Number.isFinite(dayChange) ? latest - dayChange : NaN;
  const updatedAt =
    Number.isFinite(Number(payload.timestamp)) && Number(payload.timestamp) > 0
      ? new Date(Number(payload.timestamp) * 1000).toISOString()
      : new Date().toISOString();

  if (!Number.isFinite(latest) || !Number.isFinite(previousClose) || previousClose <= 0) {
    throw new Error(`${instrument.label} has incomplete spot data`);
  }

  const dayChangePercent = previousClose ? (dayChange / previousClose) * 100 : 0;

  return {
    ...instrument,
    name: payload.name || instrument.label,
    price: latest,
    previousClose,
    dayChange,
    dayChangePercent,
    intradayChange: dayChange,
    intradayChangePercent: dayChangePercent,
    updatedAt,
  };
}

async function fetchStooqInstrument(instrument) {
  const response = await fetch(stooqQuoteUrl(instrument.symbol), {
    headers: {
      "User-Agent": "MarketIntelligenceDesk/1.0",
      Accept: "text/csv,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`${instrument.label} failed with ${response.status}`);
  }

  const csv = await response.text();
  const [headerLine, rowLine] = csv.trim().split(/\r?\n/);
  if (!headerLine || !rowLine) {
    throw new Error(`${instrument.label} returned no quote data`);
  }

  const headers = headerLine.split(",");
  const values = rowLine.split(",");
  const quote = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  const latest = Number(quote.Close);
  const open = Number(quote.Open);
  const previousClose = Number.isFinite(open) ? open : latest;

  if (!Number.isFinite(latest) || !Number.isFinite(previousClose)) {
    throw new Error(`${instrument.label} has incomplete quote data`);
  }

  const dayChange = latest - previousClose;
  const dayChangePercent = previousClose ? (dayChange / previousClose) * 100 : 0;
  const updatedAt = quote.Date && quote.Time ? new Date(`${quote.Date}T${quote.Time}Z`).toISOString() : new Date().toISOString();

  return {
    ...instrument,
    name: instrument.label,
    price: latest,
    previousClose,
    dayChange,
    dayChangePercent,
    intradayChange: dayChange,
    intradayChangePercent: dayChangePercent,
    updatedAt,
  };
}

function classifyMove(item) {
  const percent = Number(item.dayChangePercent || 0);
  const rawChange = Number(item.dayChange || 0);
  const threshold = item.format === "yield" ? 0.005 : 0.08;

  if (item.format === "yield") {
    if (rawChange > threshold) return "up";
    if (rawChange < -threshold) return "down";
    return "flat";
  }

  if (percent > threshold) return "up";
  if (percent < -threshold) return "down";
  return "flat";
}

function marketInstrumentLabel(item) {
  if (item.format === "yield") {
    return `${item.price.toFixed(3)}%`;
  }

  if (item.price >= 1000) {
    return item.price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  return item.price.toFixed(2);
}

function marketMoveLabel(item) {
  if (item.format === "yield") {
    const bps = item.dayChange * 100;
    return `${bps >= 0 ? "+" : ""}${bps.toFixed(1)} bp`;
  }

  return `${item.dayChange >= 0 ? "+" : ""}${item.dayChange.toFixed(2)} (${item.dayChangePercent >= 0 ? "+" : ""}${item.dayChangePercent.toFixed(2)}%)`;
}

function headlineReactionMoveLabel(item) {
  if (item.format === "yield") {
    const bps = item.change * 100;
    return `${bps >= 0 ? "+" : ""}${bps.toFixed(1)} bp`;
  }

  return `${item.change >= 0 ? "+" : ""}${item.change.toFixed(2)} (${item.changePercent >= 0 ? "+" : ""}${item.changePercent.toFixed(2)}%)`;
}

function goldHourMoveLabel(item) {
  return `${item.change >= 0 ? "+" : ""}${item.change.toFixed(2)} (${item.changePercent >= 0 ? "+" : ""}${item.changePercent.toFixed(2)}%)`;
}

function classifyHeadlineMove(item) {
  const threshold = item.format === "yield" ? 0.004 : 0.06;
  const value = item.format === "yield" ? Number(item.change || 0) : Number(item.changePercent || 0);
  if (value > threshold) return "up";
  if (value < -threshold) return "down";
  return "flat";
}

async function fetchGoldRecentVolatility() {
  const now = Date.now();
  if (goldVolatilityCache.payload && now - goldVolatilityCache.fetchedAt < 60_000) {
    return goldVolatilityCache.payload;
  }

  const response = await fetch(yahooChartRangeUrl("GC=F", "1d", "5m"), {
    headers: {
      "User-Agent": "MarketIntelligenceDesk/1.0",
      Accept: "application/json,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Gold volatility failed with ${response.status}`);
  }

  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closeValues = result?.indicators?.quote?.[0]?.close || [];
  const points = timestamps
    .map((timestamp, index) => ({
      time: Number(timestamp) * 1000,
      close: Number(closeValues[index]),
    }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.close) && point.close > 0);

  if (points.length < 2) {
    throw new Error("Gold volatility returned no recent points");
  }

  const latest = points[points.length - 1];
  const recentPoints = points.filter((point) => latest.time - point.time <= 90 * 60_000);
  const changes = [];
  for (let index = 1; index < recentPoints.length; index += 1) {
    changes.push(Math.abs(recentPoints[index].close - recentPoints[index - 1].close));
  }

  const averageFiveMinuteMove = changes.length
    ? changes.reduce((total, value) => total + value, 0) / changes.length
    : 4;
  const thirtyMinuteRange = recentPoints
    .filter((point) => latest.time - point.time <= 30 * 60_000)
    .reduce(
      (range, point) => ({
        high: Math.max(range.high, point.close),
        low: Math.min(range.low, point.close),
      }),
      { high: latest.close, low: latest.close }
    );
  const thirtyMinuteMove = thirtyMinuteRange.high - thirtyMinuteRange.low;
  const sixtyMinutePoints = recentPoints.filter((point) => latest.time - point.time <= 60 * 60_000);
  const oneHourRange = sixtyMinutePoints.reduce(
    (range, point) => ({
      high: Math.max(range.high, point.close),
      low: Math.min(range.low, point.close),
    }),
    { high: latest.close, low: latest.close }
  );
  const thirtyMinuteBaseline = [...recentPoints].reverse().find((point) => latest.time - point.time >= 30 * 60_000) || recentPoints[0];
  const sixtyMinuteBaseline = [...recentPoints].reverse().find((point) => latest.time - point.time >= 60 * 60_000) || recentPoints[0];
  const move30 = latest.close - thirtyMinuteBaseline.close;
  const move60 = latest.close - sixtyMinuteBaseline.close;
  const oneHourRangeSize = oneHourRange.high - oneHourRange.low;
  const rangePosition = oneHourRangeSize > 0 ? (latest.close - oneHourRange.low) / oneHourRangeSize : 0.5;
  const stretchedUp = oneHourRangeSize > 0 && rangePosition >= 0.82 && move30 > averageFiveMinuteMove * 2.2;
  const stretchedDown = oneHourRangeSize > 0 && rangePosition <= 0.18 && move30 < -averageFiveMinuteMove * 2.2;
  const cap = clamp(Math.max(8, averageFiveMinuteMove * 3.2, thirtyMinuteMove * 0.65), 8, 16);

  goldVolatilityCache = {
    fetchedAt: now,
    payload: {
      averageFiveMinuteMove: Number(averageFiveMinuteMove.toFixed(2)),
      thirtyMinuteRange: Number(thirtyMinuteMove.toFixed(2)),
      oneHourRange: Number(oneHourRangeSize.toFixed(2)),
      move30: Number(move30.toFixed(2)),
      move60: Number(move60.toFixed(2)),
      rangePosition: Number(rangePosition.toFixed(2)),
      support: Number(oneHourRange.low.toFixed(2)),
      resistance: Number(oneHourRange.high.toFixed(2)),
      stretchedUp,
      stretchedDown,
      cap: Number(cap.toFixed(2)),
      updatedAt: new Date(latest.time).toISOString(),
    },
  };

  return goldVolatilityCache.payload;
}

async function fetchGoldPastHourMove() {
  const instrument = { id: "gold", label: "Gold futures", symbol: "GC=F", format: "price" };
  const response = await fetch(yahooChartRangeUrl(instrument.symbol, "1d", "5m"), {
    headers: {
      "User-Agent": "MarketIntelligenceDesk/1.0",
      Accept: "application/json,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Gold chart failed with ${response.status}`);
  }

  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closeValues = result?.indicators?.quote?.[0]?.close || [];
  const points = timestamps
    .map((timestamp, index) => ({
      time: Number(timestamp) * 1000,
      close: Number(closeValues[index]),
    }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.close));

  if (!points.length) {
    throw new Error("Gold chart returned no recent points");
  }

  const latest = points[points.length - 1];
  const oneHourAgo = latest.time - 60 * 60 * 1000;
  const baseline = [...points].reverse().find((point) => point.time <= oneHourAgo) || points[0];
  const change = latest.close - baseline.close;
  const changePercent = baseline.close ? (change / baseline.close) * 100 : 0;
  const move = {
    ...instrument,
    baselinePrice: baseline.close,
    latestPrice: latest.close,
    baselineAt: new Date(baseline.time).toISOString(),
    updatedAt: new Date(latest.time).toISOString(),
    change,
    changePercent,
  };

  return {
    ...move,
    direction: classifyHeadlineMove(move),
    displayChange: goldHourMoveLabel(move),
    summary: `From ${baseline.close.toFixed(2)} to ${latest.close.toFixed(2)} using recent 5-minute gold futures data.`,
  };
}

async function fetchGoldPastHoursMove(hours = 4) {
  const response = await fetch(yahooChartRangeUrl("GC=F", "1d", "5m"), {
    headers: {
      "User-Agent": "MarketIntelligenceDesk/1.0",
      Accept: "application/json,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Gold multi-hour chart failed with ${response.status}`);
  }

  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closeValues = result?.indicators?.quote?.[0]?.close || [];
  const points = timestamps
    .map((timestamp, index) => ({
      time: Number(timestamp) * 1000,
      close: Number(closeValues[index]),
    }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.close) && point.close > 0);

  if (!points.length) {
    return null;
  }

  const latest = points[points.length - 1];
  const lookbackMs = clamp(Number(hours) || 4, 2, 8) * 60 * 60 * 1000;
  const baseline = [...points].reverse().find((point) => latest.time - point.time >= lookbackMs) || points[0];
  const change = latest.close - baseline.close;
  const changePercent = baseline.close ? (change / baseline.close) * 100 : 0;

  return {
    hours: clamp(Number(hours) || 4, 2, 8),
    baselinePrice: Number(baseline.close.toFixed(2)),
    latestPrice: Number(latest.close.toFixed(2)),
    baselineAt: new Date(baseline.time).toISOString(),
    updatedAt: new Date(latest.time).toISOString(),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    direction: classifyHeadlineMove({ change, changePercent, format: "price" }),
  };
}

function pickGoldHourReason(items, direction) {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  const candidates = items
    .filter((item) => item && !item.filteredOut)
    .filter((item) => itemTimestamp(item) >= cutoff)
    .filter((item) => Number(item.score || 0) >= 8 || item.impact === "high" || item.urgency === "immediate")
    .filter((item) => {
      if (direction === "up") return item.bias === "bullish" || item.bias === "mixed";
      if (direction === "down") return item.bias === "bearish" || item.bias === "mixed";
      return true;
    })
    .sort((left, right) => {
      const scoreDiff = Number(right.score || 0) - Number(left.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return itemTimestamp(right) - itemTimestamp(left);
    });

  const item = candidates[0];
  if (!item) {
    return {
      driver: "NONE",
      title: "",
      summary: "No major matching headline from the last two hours is strong enough to explain the move.",
    };
  }

  return {
    driver: classifyReasonDriver(item),
    key: item.key,
    title: item.title,
    sourceName: item.sourceName,
    publishedAt: item.publishedAt || item.firstSeenAt,
    score: item.score,
    bias: item.bias,
    summary: item.whyItMatters || item.generatedSummary || item.summary || "Recent high-impact headline matched the current gold direction.",
  };
}

function classifyReasonDriver(item) {
  const text = `${item?.title || ""} ${item?.whyItMatters || ""} ${(item?.matchedKeywords || []).join(" ")}`.toLowerCase();
  if (/\bfed\b|fomc|rate|yield|treasury|dollar|usd|inflation|cpi|pce|jobs|nfp/.test(text)) return "MACRO";
  if (/war|geopolitic|sanction|oil|middle east|attack|ceasefire|risk off|safe-haven/.test(text)) return "HAVEN";
  if (/trump|tariff|china|trade war/.test(text)) return "POLICY";
  if (/gold|xauusd|bullion/.test(text)) return "GOLD";
  return "NEWS";
}

function describeGoldDriver(driver, direction) {
  if (driver === "MACRO") {
    return direction === "up"
      ? "That usually means rates or dollar expectations softened enough to support gold."
      : direction === "down"
        ? "That usually means rates or dollar expectations firmed enough to pressure gold."
        : "That points to macro pricing without a strong directional follow-through.";
  }

  if (driver === "HAVEN") {
    return direction === "up"
      ? "That reads like safe-haven buying into uncertainty or geopolitical stress."
      : direction === "down"
        ? "That suggests haven demand faded and traders rotated away from defensive positioning."
        : "That points to haven headlines, but without a decisive move in gold.";
  }

  if (driver === "POLICY") {
    return direction === "up"
      ? "That suggests policy risk increased uncertainty enough to support bullion."
      : direction === "down"
        ? "That suggests policy headlines favored the dollar or reduced demand for gold protection."
        : "That points to policy noise without a clear gold trend.";
  }

  if (driver === "GOLD") {
    return direction === "up"
      ? "That looks like gold-specific buying rather than a broad macro move."
      : direction === "down"
        ? "That looks like gold-specific selling or liquidation."
        : "That points to gold-specific flow without a strong directional break.";
  }

  return direction === "up"
    ? "That suggests buyers stayed in control even without one dominant macro headline."
    : direction === "down"
      ? "That suggests sellers stayed in control even without one dominant macro headline."
      : "That suggests mixed flow rather than one clean driver.";
}

function buildGoldMultiHourSummary(relatedItems, move) {
  const alignedItems = (Array.isArray(relatedItems) ? relatedItems : [])
    .filter((item) => item && !item.filteredOut)
    .filter((item) => Number(item.score || 0) >= 7 || item.impact === "high" || item.urgency === "immediate")
    .filter((item) => {
      if (move.direction === "up") return item.bias === "bullish" || item.bias === "mixed";
      if (move.direction === "down") return item.bias === "bearish" || item.bias === "mixed";
      return true;
    })
    .sort((left, right) => {
      const scoreDiff = Number(right.score || 0) - Number(left.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return itemTimestamp(right) - itemTimestamp(left);
    })
    .slice(0, 3);

  const driverCounts = alignedItems.reduce((counts, item) => {
    const driver = classifyReasonDriver(item);
    counts[driver] = (counts[driver] || 0) + 1;
    return counts;
  }, {});
  const topDriver =
    Object.entries(driverCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ||
    (move.direction === "up" || move.direction === "down" ? "MACRO" : "NONE");
  const headlines = alignedItems.map((item) => ({
    title: item.title,
    sourceName: item.sourceName,
    bias: item.bias,
    score: item.score,
    publishedAt: item.publishedAt || item.firstSeenAt,
    why: item.whyItMatters || item.generatedSummary || item.summary || "",
  }));
  const moveText =
    move.direction === "up"
      ? `Gold rose ${move.change.toFixed(2)} over the last ${move.hours} hours.`
      : move.direction === "down"
        ? `Gold fell ${Math.abs(move.change).toFixed(2)} over the last ${move.hours} hours.`
        : `Gold stayed broadly flat over the last ${move.hours} hours.`;
  const moveContext =
    move.direction === "up"
      ? "The tape has been favoring upside flow."
      : move.direction === "down"
        ? "The tape has been favoring downside pressure."
        : "Price action has been range-bound.";
  const keyTakeaway = headlines.length
    ? `${headlines[0].sourceName} led the news tape with: ${headlines[0].title}`
    : "No strong gold-relevant headline cluster stood out in the last few hours.";
  const driverEffect = describeGoldDriver(topDriver, move.direction);

  return {
    driver: topDriver,
    move,
    summary: `${moveText} ${moveContext}`,
    takeaway: keyTakeaway,
    narrative: headlines.length ? `Likely driver: ${topDriver}. ${driverEffect}` : `Likely driver remains unclear. ${driverEffect}`,
    composed:
      headlines.length > 0
        ? `${moveText} ${moveContext} The clearest theme was ${topDriver.toLowerCase()} flow. ${driverEffect} ${headlines[0].sourceName} was the main headline source, and the key message was: ${headlines[0].why || headlines[0].title}`
        : `${moveText} ${moveContext} ${driverEffect} No strong gold-specific headline cluster stood out, so the move looks more flow-driven than headline-driven.`,
    headlines,
  };
}

function buildGoldNewsOnlySummary(relatedItems, hours) {
  const items = (Array.isArray(relatedItems) ? relatedItems : [])
    .filter((item) => item && !item.filteredOut)
    .filter((item) => Number(item.score || 0) >= 7 || item.impact === "high" || item.urgency === "immediate")
    .sort((left, right) => {
      const scoreDiff = Number(right.score || 0) - Number(left.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return itemTimestamp(right) - itemTimestamp(left);
    })
    .slice(0, 3);

  const driverCounts = items.reduce((counts, item) => {
    const driver = classifyReasonDriver(item);
    counts[driver] = (counts[driver] || 0) + 1;
    return counts;
  }, {});
  const topDriver = Object.entries(driverCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || "NEWS";
  const driverEffect = describeGoldDriver(topDriver, "flat");

  return {
    driver: topDriver,
    move: {
      hours,
      change: 0,
      direction: "flat",
    },
    summary: `Recent chart data is unavailable, but the strongest gold-relevant headlines from the last ${hours} hours point to ${topDriver.toLowerCase()} flow.`,
    takeaway: items.length ? `${items[0].sourceName} led the tape with: ${items[0].title}` : "No strong recent gold-relevant headline cluster was available.",
    narrative: `Likely driver: ${topDriver}. ${driverEffect}`,
    composed: items.length
      ? `Chart-based gold movement is unavailable right now, but the strongest news from the last ${hours} hours points to ${topDriver.toLowerCase()} flow. ${driverEffect} The main headline cluster was led by ${items[0].sourceName}, which suggests ${items[0].whyItMatters || items[0].generatedSummary || items[0].summary || items[0].title}.`
      : `Chart-based gold movement is unavailable right now, and there was no strong gold-relevant headline cluster in the last ${hours} hours. ${driverEffect}`,
    headlines: items.map((item) => ({
      title: item.title,
      sourceName: item.sourceName,
      bias: item.bias,
      score: item.score,
      publishedAt: item.publishedAt || item.firstSeenAt,
      why: item.whyItMatters || item.generatedSummary || item.summary || "",
    })),
  };
}

async function fetchHeadlineInstrumentReaction(instrument, eventTime) {
  const response = await fetch(yahooChartRangeUrl(instrument.symbol), {
    headers: {
      "User-Agent": "MarketIntelligenceDesk/1.0",
      Accept: "application/json,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`${instrument.label} failed with ${response.status}`);
  }

  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closeValues = result?.indicators?.quote?.[0]?.close || [];
  const points = timestamps
    .map((timestamp, index) => ({
      time: Number(timestamp) * 1000,
      close: Number(closeValues[index]),
    }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.close));

  if (!points.length) {
    throw new Error(`${instrument.label} returned no chart points`);
  }

  const baseline = points.find((point) => point.time >= eventTime) || points[0];
  const latest = points[points.length - 1];
  if (!baseline || !latest || latest.time <= baseline.time) {
    throw new Error(`${instrument.label} has no post-headline movement yet`);
  }

  const change = latest.close - baseline.close;
  const changePercent = baseline.close ? (change / baseline.close) * 100 : 0;
  const reaction = {
    ...instrument,
    baselinePrice: baseline.close,
    latestPrice: latest.close,
    baselineAt: new Date(baseline.time).toISOString(),
    updatedAt: new Date(latest.time).toISOString(),
    change,
    changePercent,
  };

  return {
    ...reaction,
    move: classifyHeadlineMove(reaction),
    displayChange: headlineReactionMoveLabel(reaction),
  };
}

function expectedHeadlineDirection(item) {
  if (item.bias === "bullish") return 1;
  if (item.bias === "bearish") return -1;
  return 0;
}

function interpretHeadlineReaction(item, instruments, eventTime) {
  const expected = expectedHeadlineDirection(item);
  const gold = instruments.find((instrument) => instrument.id === "gold");
  const confirmingDrivers = instruments.filter((instrument) => {
    if (instrument.id === "gold" || !expected) return false;
    const actual = instrument.move === "up" ? 1 : instrument.move === "down" ? -1 : 0;
    return actual && actual * instrument.expectedForGold === expected;
  });
  const conflictingDrivers = instruments.filter((instrument) => {
    if (instrument.id === "gold" || !expected) return false;
    const actual = instrument.move === "up" ? 1 : instrument.move === "down" ? -1 : 0;
    return actual && actual * instrument.expectedForGold === -expected;
  });
  const goldDirection = gold?.move === "up" ? 1 : gold?.move === "down" ? -1 : 0;
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - eventTime) / 60_000));

  if (!instruments.length) {
    return {
      confirmation: "mixed",
      title: "No price confirmation yet",
      summary: "The trial reaction read could not load enough market data for this headline.",
    };
  }

  if (!expected) {
    return {
      confirmation: "mixed",
      title: "Mixed headline bias",
      summary: `Price reaction is shown as context only because the headline bias is mixed. ${elapsedMinutes}m since headline.`,
    };
  }

  if (goldDirection === expected && confirmingDrivers.length) {
    return {
      confirmation: expected > 0 ? "bullish" : "bearish",
      title: "Price action confirms the headline",
      summary: `Gold and ${confirmingDrivers.map((driver) => driver.label).join(", ")} moved in the expected direction. ${elapsedMinutes}m since headline.`,
    };
  }

  if (goldDirection === expected) {
    return {
      confirmation: expected > 0 ? "bullish" : "bearish",
      title: "Gold confirms, drivers are not clean",
      summary: `Gold moved in the expected direction, but dollar/yield confirmation is incomplete. ${elapsedMinutes}m since headline.`,
    };
  }

  if (goldDirection === -expected || conflictingDrivers.length > confirmingDrivers.length) {
    return {
      confirmation: "conflict",
      title: "Price action conflicts with the headline",
      summary: `Gold or its key drivers are moving against the expected read. Treat the headline as unconfirmed. ${elapsedMinutes}m since headline.`,
    };
  }

  return {
    confirmation: "mixed",
    title: "Price reaction still forming",
    summary: `Market movement since the headline is not decisive yet. ${elapsedMinutes}m since headline.`,
  };
}

async function getHeadlineReaction(item) {
  if (!item) {
    throw new Error("Headline was not found");
  }

  const eventTime = itemTimestamp(item);
  if (!eventTime) {
    throw new Error("Headline has no usable timestamp");
  }

  const cacheKey = `${item.key}|${eventTime}`;
  const cached = headlineReactionCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < HEADLINE_REACTION_CACHE_MS) {
    return cached.payload;
  }

  const results = await Promise.allSettled(
    HEADLINE_REACTION_SYMBOLS.map((instrument) => fetchHeadlineInstrumentReaction(instrument, eventTime))
  );
  const instruments = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
  const errors = results
    .map((result, index) =>
      result.status === "rejected"
        ? {
            id: HEADLINE_REACTION_SYMBOLS[index].id,
            label: HEADLINE_REACTION_SYMBOLS[index].label,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          }
        : null
    )
    .filter(Boolean);
  const read = interpretHeadlineReaction(item, instruments, eventTime);
  const payload = {
    generatedAt: new Date().toISOString(),
    headlineKey: item.key,
    headlineAt: new Date(eventTime).toISOString(),
    sourceLabel: "Yahoo market charts",
    reaction: {
      ...read,
      instruments,
    },
    errors,
  };

  headlineReactionCache.set(cacheKey, {
    fetchedAt: Date.now(),
    payload,
  });

  return payload;
}

function interpretXauusdReaction(items) {
  const byId = Object.fromEntries(items.map((item) => [item.id, item]));
  const gold = byId.xauusd || byId.gold;
  const dxy = byId.dxy;
  const us10y = byId.us10y;
  const us02y = byId.us02y;
  const oil = byId.oil;
  const spx = byId.spx;
  const goldMove = gold ? classifyMove(gold) : "flat";
  const dxyMove = dxy ? classifyMove(dxy) : "flat";
  const us10yMove = us10y ? classifyMove(us10y) : "flat";
  const us02yMove = us02y ? classifyMove(us02y) : "flat";
  const oilMove = oil ? classifyMove(oil) : "flat";
  const spxMove = spx ? classifyMove(spx) : "flat";

  let bias = "mixed";
  let title = "XAUUSD live quote";
  let summary = "Current XAUUSD spot quote is loaded for the market reaction panel.";

  if (gold && classifyMove(gold) === "up") {
    bias = "bullish";
    title = "XAUUSD is higher";
    summary = "Spot gold is trading above the current session open.";
  } else if (gold && classifyMove(gold) === "down") {
    bias = "bearish";
    title = "XAUUSD is lower";
    summary = "Spot gold is trading below the current session open.";
  }

  if (goldMove === "up" && (dxyMove === "down" || us10yMove === "down" || oilMove === "up")) {
    bias = "bullish";
    title = "Gold has driver support";
    summary = "Gold is rising while at least one key driver is supportive: softer dollar/yields or stronger oil/inflation pressure.";
  } else if (goldMove === "down" && (dxyMove === "up" || us10yMove === "up" || us02yMove === "up")) {
    bias = "bearish";
    title = "Gold is under pressure";
    summary = "Gold is falling while dollar or yields are firmer, so the market is validating pressure on XAUUSD.";
  } else if (goldMove === "up" && (dxyMove === "up" || us10yMove === "up")) {
    bias = "mixed";
    title = "Gold up against headwinds";
    summary = "Gold is rising despite firmer dollar or yields. Treat the move as fragile unless safe-haven headlines continue.";
  } else if (goldMove === "down" && (dxyMove === "down" || us10yMove === "down")) {
    bias = "mixed";
    title = "Gold down despite support";
    summary = "Gold is falling even though dollar or yields are softer. That suggests liquidation or risk-on flow may be dominating.";
  }

  const drivers = [
    gold ? `XAUUSD ${classifyMove(gold)}` : "",
    dxy ? `DXY ${classifyMove(dxy)}` : "",
    us10y ? `US10Y ${classifyMove(us10y)}` : "",
    us02y ? `US02Y ${classifyMove(us02y)}` : "",
    oil ? `oil ${classifyMove(oil)}` : "",
    spx ? `S&P futures ${classifyMove(spx)}` : "",
  ].filter(Boolean);

  return {
    bias,
    title,
    summary,
    drivers,
  };
}

function buildMarketRegime(items) {
  const byId = Object.fromEntries(items.map((item) => [item.id, item]));
  const gold = byId.xauusd || byId.gold;
  const dxy = byId.dxy;
  const us10y = byId.us10y;
  const goldMove = gold ? classifyMove(gold) : "flat";
  const dxyMove = dxy ? classifyMove(dxy) : "flat";
  const us10yMove = us10y ? classifyMove(us10y) : "flat";

  if (!gold) {
    return {
      label: "Market regime loading",
      tone: "mixed",
      summary: "Waiting for XAUUSD before classifying the current gold regime.",
    };
  }

  if (goldMove === "flat") {
    return {
      label: "Gold detached / noisy",
      tone: "mixed",
      summary: "XAUUSD is not moving enough yet to identify whether dollar, yields, or haven flow is in control.",
    };
  }

  const supportiveDollarYield =
    (goldMove === "up" && (dxyMove === "down" || us10yMove === "down")) ||
    (goldMove === "down" && (dxyMove === "up" || us10yMove === "up"));

  if (supportiveDollarYield) {
    return {
      label: "Gold following dollar/yields",
      tone: goldMove === "up" ? "bullish" : "bearish",
      summary:
        goldMove === "up"
          ? "XAUUSD is rising while the dollar or yields are softer, so macro drivers are confirming the move."
          : "XAUUSD is falling while the dollar or yields are firmer, so macro drivers are pressuring gold.",
    };
  }

  if (goldMove === "up" && (dxyMove === "up" || us10yMove === "up")) {
    return {
      label: "Gold following safe-haven flow",
      tone: "bullish",
      summary: "XAUUSD is rising despite firmer dollar or yields, which points to haven demand or gold-specific buying.",
    };
  }

  if (goldMove === "down" && (dxyMove === "down" || us10yMove === "down")) {
    return {
      label: "Gold detached / noisy",
      tone: "bearish",
      summary: "XAUUSD is falling even though dollar or yields are softer, so liquidation or position flow may be dominating.",
    };
  }

  return {
    label: "Gold-specific flow",
    tone: goldMove === "up" ? "bullish" : "bearish",
    summary: "XAUUSD is moving without clean confirmation from dollar or yields. Treat news confirmation as more important.",
  };
}

async function getMarketReaction(watchlist) {
  const now = Date.now();
  if (marketReactionCache.payload && now - marketReactionCache.fetchedAt < MARKET_REACTION_CACHE_MS) {
    return marketReactionCache.payload;
  }

  const results = await Promise.allSettled(MARKET_REACTION_SYMBOLS.map(fetchMarketInstrument));
  const items = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => ({
      ...result.value,
      move: classifyMove(result.value),
      displayPrice: marketInstrumentLabel(result.value),
      displayChange: marketMoveLabel(result.value),
    }));
  const errors = results
    .map((result, index) =>
      result.status === "rejected"
        ? {
            id: MARKET_REACTION_SYMBOLS[index].id,
            label: MARKET_REACTION_SYMBOLS[index].label,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          }
        : null
    )
    .filter(Boolean);

  const visibleItems = items.filter((item) => item.visible !== false);
  const reaction = interpretXauusdReaction(items);
  const session = goldMarketSessionMeta();
  const payload = {
    generatedAt: new Date().toISOString(),
    watchlistId: watchlist?.id || "xauusd",
    watchlistLabel: watchlist?.label || "XAUUSD",
    sourceLabel: items[0]?.sourceLabel || "Gold-API XAU spot",
    marketSession: session,
    reaction,
    marketRegime: buildMarketRegime(items),
    items: visibleItems,
    errors,
  };

  marketReactionCache = {
    fetchedAt: now,
    payload,
  };

  return payload;
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
  if (
    [
      "tradeable",
      "support",
      "all",
      "market-moving",
      "catalyst",
      "gold",
      "usd-rates",
      "geopolitics",
      "clean",
    ].includes(mode)
  ) {
    return mode;
  }

  return "tradeable";
}

function itemSearchText(item) {
  return [
    item.title,
    item.summary,
    item.generatedSummary,
    item.whyItMatters,
    ...(item.categories || []),
    ...(item.symbols || []),
    ...(item.matchedKeywords || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function itemHasAnyText(item, keywords) {
  const text = itemSearchText(item);
  return keywords.some((keyword) => text.includes(keyword));
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
        Number(item.confidence || 0) >= 52 ||
        Number(item.combinedCount || 1) > 1
    );
  }

  return Boolean(
    item.urgency !== "background" &&
      (item.eventDriven || item.impact !== "low" || Number(item.confidence || 0) >= 58 || Number(item.combinedCount || 1) > 1)
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
  const categories = item.categories || [];
  const symbols = item.symbols || [];
  const score = Number(item.score || 0);
  const hasGlobalMarketRisk = categories.some((category) =>
    ["Global Shock", "Global Central Banks", "Geopolitics"].includes(category)
  );
  const isMarketMoving = Boolean(
    item.eventDriven ||
      item.urgency === "immediate" ||
      item.impact === "high" ||
      hasGlobalMarketRisk ||
      Number(item.combinedCount || 1) > 1 ||
      (score >= 10 && Number(item.confidence || 0) >= 58)
  );

  if (mode === "market-moving") {
    return Boolean(sourceScore >= 1.2 && (hasAssetLink || hasGlobalMarketRisk) && item.urgency !== "background" && isMarketMoving);
  }

  if (mode === "catalyst") {
    return Boolean(
      sourceScore >= 1.2 &&
        hasAssetLink &&
        (item.eventDriven ||
          categories.some((category) => ["Macro", "Rates"].includes(category)) ||
          itemHasAnyText(item, [
            "cpi",
            "pce",
            "nfp",
            "nonfarm",
            "payrolls",
            "jobless claims",
            "fomc",
            "powell",
            "fed",
            "treasury auction",
            "gdp",
            "pmi",
            "ism",
          ]))
    );
  }

  if (mode === "gold") {
    return Boolean(
      sourceScore >= 1.2 &&
        (symbols.includes("XAUUSD") ||
          symbols.includes("GLD") ||
          itemHasAnyText(item, ["xauusd", "gold", "bullion", "kitco", "precious metal"]))
    );
  }

  if (mode === "usd-rates") {
    return Boolean(
      sourceScore >= 1.2 &&
        (categories.some((category) => ["Macro", "Rates"].includes(category)) ||
          symbols.includes("DXY") ||
          symbols.includes("US10Y") ||
          itemHasAnyText(item, ["dollar", "dxy", "fed", "fomc", "powell", "treasury", "yield", "rate cut", "rate hike"]))
    );
  }

  if (mode === "geopolitics") {
    return Boolean(
      sourceScore >= 1.2 &&
        (categories.includes("Geopolitics") ||
          itemHasAnyText(item, ["war", "missile", "attack", "sanctions", "tariff", "middle east", "iran", "israel", "russia", "ukraine", "oil"]))
    );
  }

  if (mode === "clean") {
    return Boolean(
      sourceScore >= 1.5 &&
        hasAssetLink &&
        item.urgency !== "background" &&
        item.impact !== "low" &&
        Number(item.confidence || 0) >= 55 &&
        !itemHasAnyText(item, LOW_SIGNAL_KEYWORDS)
    );
  }

  if (mode === "support") {
    return Boolean(sourceScore >= 0.9 && (hasAssetLink || hasGlobalMarketRisk) && hasDecisionSignal);
  }

  return Boolean(
    sourceScore >= 1.2 &&
      (hasAssetLink || hasGlobalMarketRisk) &&
      item.urgency !== "background" &&
      (item.eventDriven || item.impact !== "low" || Number(item.confidence || 0) >= 58 || Number(item.combinedCount || 1) > 1)
  );
}

function buildTradingWhyItMatters(item, context = {}) {
  const baseReason =
    buildMarketContextSentence(item) ||
    buildMechanismSentence(item) ||
    "Markets care because this can affect the active watchlist through rates, risk appetite, or asset-specific flow.";
  const qualifiers = [];

  if (context.eventDriven || item.eventDriven) {
    qualifiers.push("event-driven");
  }
  if ((context.sourceQuality || item.sourceAuthorityScore || 0) >= 2) {
    qualifiers.push("higher-trust source");
  }
  if ((context.recency || 0) >= 2) {
    qualifiers.push("fresh");
  }
  if ((context.uniqueSources || item.combinedCount || 1) > 1) {
    qualifiers.push(`confirmed by ${context.uniqueSources || item.combinedCount} sources`);
  }

  return qualifiers.length ? `${baseReason} Signal quality: ${qualifiers.join(", ")}.` : baseReason;
}

function createDeskHeadline(title, sourceFeed) {
  const cleanTitle = cleanHeadlineForSummary(title);
  const feed = String(sourceFeed || "").toLowerCase();
  const text = cleanTitle.toLowerCase();

  if (!feed.includes("trump / x")) {
    return cleanTitle;
  }

  if (/\btariff|china|trade war|import duty/.test(text)) {
    return `Trump tariff risk: ${cleanTitle}`;
  }

  if (/\bfed|powell|rate|dollar|treasury|yield|inflation/.test(text)) {
    return `Trump macro risk: ${cleanTitle}`;
  }

  if (/\boil|iran|sanction|war|middle east|israel/.test(text)) {
    return `Trump geopolitical risk: ${cleanTitle}`;
  }

  return `Trump statement risk: ${cleanTitle}`;
}

function analyzeItem(rawItem, watchlist) {
  const split = splitSourceFromTitle(rawItem.title, rawItem.sourceFeed);
  const deskTitle = createDeskHeadline(split.cleanTitle, rawItem.sourceFeed);
  const text = `${deskTitle} ${rawItem.description}`.toLowerCase();
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
  const analyzedItem = {
    key: normalizeKey(deskTitle, rawItem.link),
    title: deskTitle,
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
    filteredOut: shouldSuppressItem(split.cleanTitle, rawItem.description, categories, matchedFocus),
  };

  return {
    ...analyzedItem,
    whyItMatters: buildTradingWhyItMatters(analyzedItem, { eventDriven, sourceQuality, recency }),
  };
}

function articleLogPath(watchlistId) {
  const safeId = String(watchlistId || "watchlist").replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  return path.join(ARTICLE_LOG_DIR, `${safeId}-articles.json`);
}

function estimateLogPath(watchlistId) {
  const safeId = String(watchlistId || "watchlist").replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  return path.join(ARTICLE_LOG_DIR, `${safeId}-estimates.json`);
}

function readEstimateLog(watchlistId) {
  try {
    const filePath = estimateLogPath(watchlistId);
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(payload.entries) ? payload.entries.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeEstimateLog(watchlistId, entries) {
  fs.mkdirSync(ARTICLE_LOG_DIR, { recursive: true });
  const filePath = estimateLogPath(watchlistId);
  const tempPath = `${filePath}.tmp`;
  const payload = {
    version: 1,
    watchlistId: watchlistId || "xauusd",
    savedAt: new Date().toISOString(),
    entryCount: entries.length,
    entries,
  };
  fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}

const ESTIMATE_INTERVAL_MINUTES = 30;

function estimatePeriodStart(date = new Date()) {
  const value = new Date(date);
  const minutes = value.getUTCMinutes();
  value.setUTCMinutes(minutes < 30 ? 0 : 30, 0, 0);
  return value;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60_000);
}

function isGoldMarketOpen(now = new Date()) {
  const parts = zonedParts(now, NEW_YORK_TIME_ZONE);
  const day = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0)).getUTCDay();
  const minutes = parts.hour * 60 + parts.minute;

  if (day === 6) {
    return false;
  }

  if (day === 5 && minutes >= 17 * 60) {
    return false;
  }

  if (day === 0 && minutes < 18 * 60) {
    return false;
  }

  return !(minutes >= 17 * 60 && minutes < 18 * 60);
}

function goldMarketSessionMeta(now = new Date()) {
  return {
    open: isGoldMarketOpen(now),
    label: isGoldMarketOpen(now) ? "Gold market open" : "Gold market closed",
    summary: isGoldMarketOpen(now)
      ? "Gold is in an active trading session."
      : "Gold is in the weekend or daily closed session, so live interpretation should be treated as stale context only.",
  };
}

function pickProjectionNewsItem(items) {
  const list = Array.isArray(items) ? items : [];
  const relevant = list.filter((item) => {
    const categories = Array.isArray(item?.categories) ? item.categories : [];
    const symbols = Array.isArray(item?.symbols) ? item.symbols : [];
    const keywords = Array.isArray(item?.matchedKeywords) ? item.matchedKeywords : [];
    const hasGoldMacroSymbol = symbols.some((symbol) => ["XAUUSD", "DXY", "US10Y"].includes(symbol));
    const hasGoldMacroCategory = categories.some((category) =>
      ["Macro", "Rates", "Geopolitics", "Political Risk", "Global Shock", "Global Central Banks"].includes(category)
    );
    const hasGoldKeyword = keywords.some((keyword) =>
      /gold|bullion|xauusd|dollar|yield|treasury|fed|fomc|inflation|cpi|pce|tariff|risk off|safe haven/i.test(keyword)
    );
    return hasGoldMacroSymbol || hasGoldMacroCategory || hasGoldKeyword;
  });
  const candidates = relevant.length ? relevant : list;
  return (
    candidates.find((item) => item?.tradingAction === "trade_now" || item?.urgency === "immediate") ||
    candidates.find((item) => item?.impact === "high") ||
    candidates[0] ||
    null
  );
}

function estimateFeedback(entries) {
  const completed = (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry?.actualAt && Number.isFinite(Number(entry.error)))
    .slice(-6);
  if (!completed.length) {
    return {
      missBias: 0,
      averageAbsoluteError: 0,
      preferFlat: false,
      dampening: 1,
    };
  }

  const averageAbsoluteError =
    completed.reduce((total, entry) => total + Math.abs(Number(entry.error) || 0), 0) / completed.length;
  const largeMisses = completed.filter((entry) => Math.abs(Number(entry.error) || 0) >= 12).length;
  const missBias =
    completed.reduce((total, entry) => {
      const direction = entry.direction === "up" ? 1 : entry.direction === "down" ? -1 : 0;
      const error = Number(entry.error) || 0;
      return total + direction * error;
    }, 0) / completed.length;

  return {
    missBias: Number(missBias.toFixed(2)),
    averageAbsoluteError: Number(averageAbsoluteError.toFixed(2)),
    preferFlat: largeMisses >= 3,
    dampening: largeMisses >= 4 ? 0.55 : largeMisses >= 2 ? 0.72 : 0.88,
  };
}

function roundToNearestFive(value) {
  return Math.round(Number(value || 0) / 5) * 5;
}

function buildGoldProjection(marketPayload, newsItems, volatility = null, feedback = null) {
  const marketItem = Array.isArray(marketPayload?.items) ? marketPayload.items[0] : null;
  const price = Number(marketItem?.price);
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  const bestItem = pickProjectionNewsItem(newsItems);
  const regimeTone = marketPayload?.marketRegime?.tone || "mixed";
  const move = marketItem.move || "flat";
  const bias = bestItem?.bias || "mixed";
  const votes = [
    move === "up" ? 1 : move === "down" ? -1 : 0,
    regimeTone === "bullish" ? 1 : regimeTone === "bearish" ? -1 : 0,
    bias === "bullish" ? 1 : bias === "bearish" ? -1 : 0,
  ];
  const voteScore = votes.reduce((total, vote) => total + vote, 0);
  const directionValue = voteScore >= 2 ? 1 : voteScore <= -2 ? -1 : 0;
  const dayMove = Math.abs(Number(marketItem.dayChangePercent) || 0);
  const score = Number(bestItem?.score || 0);
  const confidenceRaw = Number(bestItem?.confidence || 45);
  const signalStrength = score >= 18 && confidenceRaw >= 70 ? 1.2 : score >= 12 && confidenceRaw >= 58 ? 1.05 : 0.85;
  const support = Number(volatility?.support) > 0 ? Number(volatility.support) : Number.NaN;
  const resistance = Number(volatility?.resistance) > 0 ? Number(volatility.resistance) : Number.NaN;
  const move30 = Number(volatility?.move30 || 0);
  const rangePosition = Number(volatility?.rangePosition || 0.5);
  const stretchedUp = Boolean(volatility?.stretchedUp);
  const stretchedDown = Boolean(volatility?.stretchedDown);
  const feedbackModel = feedback || { missBias: 0, averageAbsoluteError: 0, preferFlat: false, dampening: 1 };
  let adjustedDirection = directionValue;

  if ((adjustedDirection > 0 && stretchedUp) || (adjustedDirection < 0 && stretchedDown)) {
    adjustedDirection = 0;
  }

  if (
    feedbackModel.preferFlat &&
    Math.abs(move30) >= Math.max(6, Number(volatility?.averageFiveMinuteMove || 0) * 2) &&
    Math.abs(voteScore) < 3
  ) {
    adjustedDirection = 0;
  }

  if (adjustedDirection > 0 && rangePosition >= 0.78 && Math.abs(move30) >= 8) {
    adjustedDirection = 0;
  }

  if (adjustedDirection < 0 && rangePosition <= 0.22 && Math.abs(move30) >= 8) {
    adjustedDirection = 0;
  }

  const direction = adjustedDirection > 0 ? "up" : adjustedDirection < 0 ? "down" : "flat";
  const suggestedDistance =
    adjustedDirection === 0 ? 0 : price * (clamp(dayMove * 0.18 + 0.08 * signalStrength, 0.08, 0.32) / 100);
  const volatilityCap = Number(volatility?.cap);
  const maxDistance = Number.isFinite(volatilityCap) ? volatilityCap : 12;
  const minDistance = adjustedDirection === 0 ? 0 : 5;
  const targetDistance = clamp(suggestedDistance * feedbackModel.dampening, minDistance, maxDistance);
  let targetRaw = adjustedDirection === 0 ? price : price + adjustedDirection * targetDistance;

  if (adjustedDirection > 0 && Number.isFinite(resistance)) {
    targetRaw = Math.min(targetRaw, resistance - 2);
  }

  if (adjustedDirection < 0 && Number.isFinite(support)) {
    targetRaw = Math.max(targetRaw, support + 2);
  }

  if (adjustedDirection === 0) {
    targetRaw = price + (feedbackModel.missBias > 8 ? -2 : feedbackModel.missBias < -8 ? 2 : 0);
  }

  const target = roundToNearestFive(targetRaw);
  const low = target - 5;
  const high = target + 5;
  const agreement = Math.abs(voteScore);
  const confidence =
    bestItem && adjustedDirection !== 0
      ? clamp(
          Math.round(confidenceRaw * 0.58 + agreement * 8 + Math.min(10, dayMove * 2) - feedbackModel.averageAbsoluteError * 0.35),
          38,
          84
        )
      : clamp(35 - Math.round(feedbackModel.averageAbsoluteError * 0.2), 24, 40);

  return {
    basePrice: Number(price.toFixed(2)),
    direction,
    target,
    low,
    high,
    confidence,
    reason: `${agreement}/3 signals agreed: price ${move}, regime ${regimeTone}, news ${bias}`,
    signal: {
      priceMove: move,
      regimeTone,
      newsBias: bias,
      newsTitle: bestItem?.title || "",
      newsSource: bestItem?.sourceName || "",
      targetDistance: Number(targetDistance.toFixed(2)),
      volatilityCap: Number(maxDistance.toFixed(2)),
      thirtyMinuteRange: Number(volatility?.thirtyMinuteRange || 0),
      support: Number.isFinite(support) ? Number(support.toFixed(2)) : null,
      resistance: Number.isFinite(resistance) ? Number(resistance.toFixed(2)) : null,
      move30: Number(move30.toFixed(2)),
      rangePosition: Number(rangePosition.toFixed(2)),
      stretchedUp,
      stretchedDown,
      missBias: feedbackModel.missBias,
      missAverage: feedbackModel.averageAbsoluteError,
      preferFlat: feedbackModel.preferFlat,
    },
  };
}

function updateGoldEstimateLog(watchlistId, marketPayload, newsItems, volatility = null) {
  const marketItem = Array.isArray(marketPayload?.items) ? marketPayload.items[0] : null;
  const actualPrice = Number(marketItem?.price);
  if (!Number.isFinite(actualPrice) || actualPrice <= 0) {
    return null;
  }

  const now = new Date();
  const marketOpen = isGoldMarketOpen(now);
  const currentPeriod = estimatePeriodStart(now);
  const currentPeriodKey = currentPeriod.toISOString();
  const entries = readEstimateLog(watchlistId);
  const feedback = estimateFeedback(entries);
  let changed = false;

  entries.forEach((entry) => {
    if (entry?.actualAt || !entry?.targetHourKey) {
      return;
    }

    const targetTime = Date.parse(entry.targetHourKey);
    if (!Number.isFinite(targetTime) || now.getTime() < targetTime) {
      return;
    }

    const error = Number((actualPrice - Number(entry.target)).toFixed(2));
    const directionHit =
      entry.direction === "flat"
        ? actualPrice >= Number(entry.low) && actualPrice <= Number(entry.high)
        : entry.direction === "up"
          ? actualPrice > Number(entry.basePrice)
          : actualPrice < Number(entry.basePrice);

    entry.actualAt = now.toISOString();
    entry.actualPrice = Number(actualPrice.toFixed(2));
    entry.error = error;
    entry.absoluteError = Math.abs(error);
    entry.directionHit = directionHit;
    entry.zoneHit = actualPrice >= Number(entry.low) && actualPrice <= Number(entry.high);
    changed = true;
  });

  if (
    marketOpen &&
    !entries.some((entry) => entry?.hourKey === currentPeriodKey && Number(entry.intervalMinutes || 60) === ESTIMATE_INTERVAL_MINUTES)
  ) {
    const projection = buildGoldProjection(marketPayload, newsItems, volatility, feedback);
    if (projection) {
      entries.push({
        hourKey: currentPeriodKey,
        intervalMinutes: ESTIMATE_INTERVAL_MINUTES,
        targetHourKey: addMinutes(currentPeriod, ESTIMATE_INTERVAL_MINUTES).toISOString(),
        createdAt: now.toISOString(),
        ...projection,
        actualAt: "",
        actualPrice: null,
        error: null,
        absoluteError: null,
        directionHit: null,
        zoneHit: null,
      });
      changed = true;
    }
  }

  const trimmedEntries = entries
    .filter((entry) => entry && entry.hourKey)
    .sort((left, right) => Date.parse(left.hourKey) - Date.parse(right.hourKey))
    .slice(-240);

  if (changed || trimmedEntries.length !== entries.length) {
    writeEstimateLog(watchlistId, trimmedEntries);
  }

  if (!marketOpen) {
    return {
      marketClosed: true,
      marketOpen: false,
      reason: "Gold market is closed. No new XAUUSD estimate is being locked right now.",
    };
  }

  return trimmedEntries[trimmedEntries.length - 1] || null;
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
    this.feedErrors = [];
    this.inFlight = null;
    this.intervalHandle = null;
    this.cacheWriteTimer = null;
    this.loadArticleLog();
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
    this.saveArticleLogNow();
  }

  loadArticleLog() {
    try {
      const filePath = articleLogPath(this.watchlist.id);
      if (!fs.existsSync(filePath)) {
        return;
      }

      const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const items = Array.isArray(payload.items) ? payload.items : [];
      this.items = items
        .filter((item) => item && item.key && item.title && item.link)
        .slice(0, MAX_ITEMS);
      this.seenKeys = new Set(this.items.map((item) => item.key));
      this.lastSuccessfulPollAt = payload.lastSuccessfulPollAt || null;
      this.pruneExpiredItems();
    } catch (error) {
      this.lastError = `Article log read failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  scheduleArticleLogSave() {
    if (this.cacheWriteTimer) {
      clearTimeout(this.cacheWriteTimer);
    }

    this.cacheWriteTimer = setTimeout(() => {
      this.cacheWriteTimer = null;
      this.saveArticleLogNow();
    }, 500);
  }

  saveArticleLogNow() {
    try {
      fs.mkdirSync(ARTICLE_LOG_DIR, { recursive: true });
      const filePath = articleLogPath(this.watchlist.id);
      const tempPath = `${filePath}.tmp`;
      const payload = {
        version: 1,
        watchlistId: this.watchlist.id,
        savedAt: new Date().toISOString(),
        lastSuccessfulPollAt: this.lastSuccessfulPollAt,
        itemCount: this.items.length,
        items: this.items.slice(0, MAX_ITEMS),
      };
      fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), "utf8");
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      this.lastError = `Article log write failed: ${error instanceof Error ? error.message : String(error)}`;
    }
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
    this.scheduleArticleLogSave();
  }

  async refresh() {
    if (this.inFlight) return this.inFlight;

    this.pruneExpiredItems();
    this.lastCheckedAt = new Date().toISOString();

    this.inFlight = Promise.allSettled(
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
      .then((results) => {
        const responses = results.filter((result) => result.status === "fulfilled").map((result) => result.value);
        const feedErrors = results
          .map((result, index) => {
            if (result.status === "fulfilled") {
              return null;
            }

            return {
              id: this.watchlist.feeds[index].id,
              label: this.watchlist.feeds[index].label,
              error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            };
          })
          .filter(Boolean);

        if (!responses.length) {
          throw new Error(feedErrors.map((feedError) => feedError.error).join("; ") || "All feeds failed");
        }

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
        this.feedErrors = feedErrors;
        this.scheduleArticleLogSave();
      })
      .catch((error) => {
        this.lastError = error instanceof Error ? error.message : String(error);
        this.feedErrors = this.watchlist.feeds.map((feed) => ({ id: feed.id, label: feed.label, error: this.lastError }));
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
      feedErrors: this.feedErrors,
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
      [WATCHLISTS.xauusd].map((watchlist) => [watchlist.id, new NewsMonitor(watchlist, options)])
    );
    this.marketReactionIntervalHandle = null;
    this.marketReactionInFlight = false;
    this.estimateIntervalHandle = null;
    this.estimateInFlight = false;
  }

  start() {
    this.monitors.forEach((monitor) => monitor.start());
    this.startMarketReactionFeed();
    this.startEstimateAudit();
  }

  stop() {
    this.stopMarketReactionFeed();
    this.stopEstimateAudit();
    this.monitors.forEach((monitor) => monitor.stop());
  }

  startMarketReactionFeed() {
    if (this.marketReactionIntervalHandle) {
      return;
    }

    this.runMarketReactionFeed().catch(() => {});
    this.marketReactionIntervalHandle = setInterval(() => {
      this.runMarketReactionFeed().catch(() => {});
    }, MARKET_REACTION_POLL_MS);
  }

  stopMarketReactionFeed() {
    if (!this.marketReactionIntervalHandle) {
      return;
    }

    clearInterval(this.marketReactionIntervalHandle);
    this.marketReactionIntervalHandle = null;
  }

  async runMarketReactionFeed() {
    if (this.marketReactionInFlight) {
      return;
    }

    this.marketReactionInFlight = true;
    try {
      await getMarketReaction(this.getMonitor("xauusd").watchlist);
    } finally {
      this.marketReactionInFlight = false;
    }
  }

  startEstimateAudit() {
    if (this.estimateIntervalHandle) {
      return;
    }

    this.runEstimateAudit().catch(() => {});
    this.estimateIntervalHandle = setInterval(() => {
      this.runEstimateAudit().catch(() => {});
    }, 60_000);
  }

  stopEstimateAudit() {
    if (!this.estimateIntervalHandle) {
      return;
    }

    clearInterval(this.estimateIntervalHandle);
    this.estimateIntervalHandle = null;
  }

  async runEstimateAudit() {
    if (this.estimateInFlight) {
      return;
    }

    this.estimateInFlight = true;
    try {
      await this.getMarketReaction("xauusd");
    } finally {
      this.estimateInFlight = false;
    }
  }

  getWatchlists() {
    return [WATCHLISTS.xauusd].map((watchlist) => ({
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
    const relatedItems = monitor.getItems({
      limit: MAX_ITEMS,
      minScore: 0,
      maxAgeHours: 48,
      signalMode: "broad",
      sourceMode: "all",
      tradingMode: "all",
    });
    return getUpcomingCatalysts(monitor.watchlist, { ...options, relatedItems });
  }

  async getMarketReaction(id) {
    const monitor = this.getMonitor(id);
    const reaction = await getMarketReaction(monitor.watchlist);
    let volatility = null;
    try {
      volatility = await fetchGoldRecentVolatility();
    } catch {
      volatility = null;
    }
    const recentItems = monitor.getItems({
      limit: MAX_ITEMS,
      minScore: 0,
      maxAgeHours: 3,
      signalMode: "broad",
      sourceMode: "all",
      tradingMode: "all",
    });
    const estimateAudit = updateGoldEstimateLog(monitor.watchlist.id, reaction, recentItems, volatility);
    return {
      ...reaction,
      estimateAudit,
    };
  }

  getEstimateLog(id, options = {}) {
    const monitor = this.getMonitor(id);
    const limit = clamp(Number(options.limit) || 100, 1, 240);
    const entries = readEstimateLog(monitor.watchlist.id).slice(-limit).reverse();
    return {
      generatedAt: new Date().toISOString(),
      watchlistId: monitor.watchlist.id,
      entries,
    };
  }

  async getGoldHour(id) {
    const monitor = this.getMonitor(id);
    const session = goldMarketSessionMeta();
    if (!session.open) {
      return {
        generatedAt: new Date().toISOString(),
        sourceLabel: "Weekend / closed-session guard",
        watchlistId: monitor.watchlist.id,
        marketClosed: true,
        marketSession: session,
        move: null,
        reason: {
          driver: "CLOSED",
          title: "Gold market closed",
          summary: session.summary,
        },
      };
    }

    const move = await fetchGoldPastHourMove();
    const relatedItems = monitor.getItems({
      limit: MAX_ITEMS,
      minScore: 0,
      maxAgeHours: 3,
      signalMode: "broad",
      sourceMode: "all",
      tradingMode: "all",
    });

    return {
      generatedAt: new Date().toISOString(),
      sourceLabel: "Yahoo Gold futures 5m chart + filtered news",
      watchlistId: monitor.watchlist.id,
      marketClosed: false,
      marketSession: session,
      move,
      reason: pickGoldHourReason(relatedItems, move.direction),
    };
  }

  async getGoldSummary(id, options = {}) {
    const monitor = this.getMonitor(id);
    const hours = clamp(Number(options.hours) || 4, 2, 8);
    const session = goldMarketSessionMeta();
    const relatedItems = monitor.getItems({
      limit: MAX_ITEMS,
      minScore: 0,
      maxAgeHours: hours + 1,
      signalMode: "broad",
      sourceMode: "all",
      tradingMode: "all",
    });
    let move = null;
    try {
      move = await fetchGoldPastHoursMove(hours);
      if (!move) {
        const hourMove = await fetchGoldPastHourMove();
        move = {
          hours,
          baselinePrice: Number(hourMove.baselinePrice || 0),
          latestPrice: Number(hourMove.latestPrice || 0),
          baselineAt: hourMove.baselineAt,
          updatedAt: hourMove.updatedAt,
          change: Number(hourMove.change || 0),
          changePercent: Number(hourMove.changePercent || 0),
          direction: hourMove.direction || "flat",
        };
      }
    } catch {
      move = null;
    }

    return {
      generatedAt: new Date().toISOString(),
      watchlistId: monitor.watchlist.id,
      hours,
      marketClosed: !session.open,
      marketSession: session,
      sourceLabel: "Yahoo Gold futures 5m chart + filtered recent news",
      summary: move ? buildGoldMultiHourSummary(relatedItems, move) : buildGoldNewsOnlySummary(relatedItems, hours),
    };
  }

  async getHeadlineReaction(id, key) {
    const monitor = this.getMonitor(id);
    return getHeadlineReaction(monitor.findItem(key));
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
