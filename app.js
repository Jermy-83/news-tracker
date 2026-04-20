(function () {
  const scenarioSelect = document.getElementById("scenarioSelect");
  const scenarioChart = document.getElementById("scenarioChart");
  const scenarioTitle = document.getElementById("scenarioTitle");
  const scenarioSubtitle = document.getElementById("scenarioSubtitle");
  const scenarioBiasPill = document.getElementById("scenarioBiasPill");
  const scenarioSummary = document.getElementById("scenarioSummary");
  const scenarioChecklist = document.getElementById("scenarioChecklist");
  const scenarioThought = document.getElementById("scenarioThought");
  const factorChips = document.getElementById("factorChips");
  const scenarioQuality = document.getElementById("scenarioQuality");
  const toggleResolutionBtn = document.getElementById("toggleResolutionBtn");
  const shuffleScenarioBtn = document.getElementById("shuffleScenarioBtn");
  const heroShuffleBtn = document.getElementById("heroShuffleBtn");
  const heroTrainerBtn = document.getElementById("heroTrainerBtn");

  const builderDirection = document.getElementById("builderDirection");
  const builderBody = document.getElementById("builderBody");
  const builderUpperWick = document.getElementById("builderUpperWick");
  const builderLowerWick = document.getElementById("builderLowerWick");
  const builderChart = document.getElementById("builderChart");
  const builderLabel = document.getElementById("builderLabel");
  const builderExplanation = document.getElementById("builderExplanation");
  const builderNotes = document.getElementById("builderNotes");

  const trainerSection = document.getElementById("trainerSection");
  const trainerChart = document.getElementById("trainerChart");
  const trainerTitle = document.getElementById("trainerTitle");
  const trainerPrompt = document.getElementById("trainerPrompt");
  const trainerFeedback = document.getElementById("trainerFeedback");
  const scoreCorrect = document.getElementById("scoreCorrect");
  const scoreTotal = document.getElementById("scoreTotal");
  const newChallengeBtn = document.getElementById("newChallengeBtn");
  const revealChallengeBtn = document.getElementById("revealChallengeBtn");
  const confidenceSlider = document.getElementById("confidenceSlider");
  const confidenceLabel = document.getElementById("confidenceLabel");
  const profileScenarioSelect = document.getElementById("profileScenarioSelect");
  const profileChart = document.getElementById("profileChart");
  const profileLessonTitle = document.getElementById("profileLessonTitle");
  const profileLessonSubtitle = document.getElementById("profileLessonSubtitle");
  const profileBiasPill = document.getElementById("profileBiasPill");
  const profileSummary = document.getElementById("profileSummary");
  const profileExplanation = document.getElementById("profileExplanation");
  const profileChecklist = document.getElementById("profileChecklist");
  const goodTimingChart = document.getElementById("goodTimingChart");
  const badTimingChart = document.getElementById("badTimingChart");
  const goodTimingTitle = document.getElementById("goodTimingTitle");
  const goodTimingSubtitle = document.getElementById("goodTimingSubtitle");
  const goodTimingSummary = document.getElementById("goodTimingSummary");
  const goodTimingChecklist = document.getElementById("goodTimingChecklist");
  const badTimingTitle = document.getElementById("badTimingTitle");
  const badTimingSubtitle = document.getElementById("badTimingSubtitle");
  const badTimingSummary = document.getElementById("badTimingSummary");
  const badTimingChecklist = document.getElementById("badTimingChecklist");

  const guessButtons = Array.from(document.querySelectorAll(".guessBtn"));

  function candle(o, h, l, c) {
    return { o, h, l, c };
  }

  const scenarios = [
    {
      id: "hammer-support",
      title: "XAUUSD long lower wick at support",
      subtitle: "Gold sells into a prior support pocket, then buyers step in fast",
      bias: "bullish",
      quality: 4,
      factors: ["Price was falling", "Support is nearby", "Buyers rejected lower prices", "Still needs confirmation"],
      summary:
        "This candle matters because price dropped, touched an important area, and then bounced before the candle closed.",
      thought:
        "A beginner should notice the long lower wick first. It suggests buyers stepped in. The setup gets stronger only if the next candle keeps moving up.",
      checklist: [
        "Did price actually fall before this candle appeared?",
        "Is the wick touching a real support area?",
        "Does the long lower wick show rejection?",
        "Did the next candle confirm the bounce?"
      ],
      decisionIndex: 7,
      revealLabel: "Bounce confirms the rejection.",
      trainerPrompt: "The last candle shows a long lower wick at support. Does that give a better clue for up, down, or wait?",
      bars: [
        candle(2378, 2382, 2372, 2374),
        candle(2374, 2377, 2366, 2369),
        candle(2369, 2371, 2359, 2362),
        candle(2362, 2365, 2352, 2355),
        candle(2355, 2358, 2346, 2349),
        candle(2349, 2352, 2340, 2343),
        candle(2343, 2346, 2334, 2337),
        candle(2337.5, 2341.2, 2326.8, 2340.1),
        candle(2340.1, 2348.6, 2338.9, 2346.8),
        candle(2346.8, 2355.4, 2344.6, 2352.7),
        candle(2352.7, 2361.0, 2350.8, 2358.9)
      ]
    },
    {
      id: "shooting-star-resistance",
      title: "XAUUSD long upper wick into resistance",
      subtitle: "Gold runs into a prior high, then sellers reject the breakout",
      bias: "bearish",
      quality: 4,
      factors: ["Price was rising", "Resistance is nearby", "Sellers rejected higher prices", "Watch the next candle"],
      summary:
        "This candle says buyers pushed price higher, but sellers took control before the candle closed.",
      thought:
        "A beginner should focus on the upper wick. It shows that the market tried higher prices but could not stay there.",
      checklist: [
        "Did price rise before this candle appeared?",
        "Is the upper wick hitting resistance?",
        "Did buyers fail to hold the highs?",
        "Did the next candle confirm weakness?"
      ],
      decisionIndex: 7,
      revealLabel: "The next candles unwind the failed push.",
      trainerPrompt: "Price pushed up but could not hold the highs. Is the better clue up, down, or wait?",
      bars: [
        candle(2394, 2400, 2391, 2398),
        candle(2398, 2406, 2395, 2404),
        candle(2404, 2412, 2401, 2409),
        candle(2409, 2417, 2406, 2414),
        candle(2414, 2421, 2411, 2418),
        candle(2418, 2426, 2415, 2423),
        candle(2423, 2431, 2420, 2427),
        candle(2427, 2442, 2423, 2425),
        candle(2425, 2427, 2414, 2418),
        candle(2418, 2420, 2408, 2411),
        candle(2411, 2414, 2401, 2404)
      ]
    },
    {
      id: "bullish-engulfing",
      title: "XAUUSD bullish engulfing after a failed breakdown",
      subtitle: "Gold sweeps under support, then snaps back with a strong reversal candle",
      bias: "bullish",
      quality: 5,
      factors: ["Failed breakdown", "Buyers stepped in", "Large reversal candle", "Momentum changed fast"],
      summary:
        "This large candle is important because buyers completely erased the prior bearish candle.",
      thought:
        "A beginner should notice how strong the candle body is. It shows buyers took control quickly after sellers failed.",
      checklist: [
        "Did this candle fully cover the prior bearish body?",
        "Did it happen after a failed move lower?",
        "Is the body big enough to matter?",
        "Is there a clear place where the idea is wrong?"
      ],
      decisionIndex: 6,
      revealLabel: "The reversal body launches a recovery leg.",
      trainerPrompt: "A strong up candle appeared right after a failed drop. Is the better clue up, down, or wait?",
      bars: [
        candle(2336, 2340, 2330, 2332),
        candle(2332, 2336, 2324, 2328),
        candle(2328, 2331, 2318, 2322),
        candle(2322, 2325, 2312, 2316),
        candle(2316, 2319, 2308, 2311),
        candle(2311, 2314, 2302, 2306),
        candle(2304, 2321, 2299, 2319),
        candle(2319, 2328, 2315, 2325),
        candle(2325, 2334, 2321, 2331),
        candle(2331, 2339, 2327, 2336)
      ]
    },
    {
      id: "bearish-engulfing",
      title: "XAUUSD bearish engulfing after a failed breakout",
      subtitle: "Gold breaks above the highs, fails to hold, and reverses lower",
      bias: "bearish",
      quality: 4,
      factors: ["Failed breakout", "Resistance overhead", "Large bearish body", "Buyers may be trapped"],
      summary:
        "This setup matters because buyers tried to break higher but failed, and sellers quickly took control.",
      thought:
        "A beginner should notice that price could not stay above the old highs. That failed breakout is the real clue.",
      checklist: [
        "Did price first move above a clear high?",
        "Did it then close back inside the old range?",
        "Was the down candle strong enough to matter?",
        "Is there room for price to fall?"
      ],
      decisionIndex: 6,
      revealLabel: "The failed breakout starts an unwind.",
      trainerPrompt: "The breakout failed and a strong down candle appeared. Is the better clue up, down, or wait?",
      bars: [
        candle(2388, 2393, 2384, 2391),
        candle(2391, 2399, 2388, 2397),
        candle(2397, 2405, 2394, 2402),
        candle(2402, 2410, 2398, 2407),
        candle(2407, 2416, 2404, 2413),
        candle(2413, 2422, 2410, 2419),
        candle(2421, 2426, 2405, 2408),
        candle(2408, 2411, 2398, 2401),
        candle(2401, 2404, 2390, 2394),
        candle(2394, 2398, 2385, 2389)
      ]
    },
    {
      id: "doji-range",
      title: "XAUUSD indecision inside a messy range",
      subtitle: "Gold is rotating in balance with no clean level holding the move",
      bias: "wait",
      quality: 2,
      factors: ["Sideways market", "No clear level", "Mixed signals", "Best answer may be wait"],
      summary:
        "This candle is not very useful by itself because the chart around it is messy and there is no clear level nearby.",
      thought:
        "A beginner should learn this early: doing nothing is often better than forcing a weak idea.",
      checklist: [
        "Is the chart moving sideways?",
        "Is the candle far from support or resistance?",
        "Would this still look important without its pattern name?",
        "Is waiting the smarter choice?"
      ],
      decisionIndex: 7,
      revealLabel: "Price stays noisy with no clean follow-through.",
      trainerPrompt: "The chart looks mixed and messy. Is the better clue up, down, or wait?",
      bars: [
        candle(2360, 2366, 2354, 2364),
        candle(2364, 2369, 2357, 2361),
        candle(2361, 2367, 2356, 2363),
        candle(2363, 2368, 2358, 2360),
        candle(2360, 2366, 2355, 2362),
        candle(2362, 2367, 2357, 2361),
        candle(2361, 2365, 2356, 2363),
        candle(2362.4, 2366.2, 2358.0, 2362.3),
        candle(2362.3, 2368.1, 2357.4, 2364.2),
        candle(2364.2, 2367.0, 2358.1, 2360.8),
        candle(2360.8, 2366.5, 2356.7, 2363.4)
      ]
    },
    {
      id: "trend-pullback",
      title: "XAUUSD trend pause, then buyers push again",
      subtitle: "Gold pauses in an uptrend, holds the pullback, then resumes higher",
      bias: "bullish",
      quality: 4,
      factors: ["Trend is still up", "Pullback stayed small", "Buyers returned", "Continuation setup"],
      summary:
        "Not every good candle is a reversal. In a healthy uptrend, a strong continuation candle can be the better clue.",
      thought:
        "A beginner should notice that price never really broke the uptrend. That makes the strong up candle more meaningful.",
      checklist: [
        "Is the uptrend still intact?",
        "Was the pullback calm rather than sharp?",
        "Did the strong candle restart momentum?",
        "Is there room for price to keep moving?"
      ],
      decisionIndex: 7,
      revealLabel: "Momentum resumes in the trend direction.",
      trainerPrompt: "The uptrend stayed intact and buyers printed a strong candle. Is the better clue up, down, or wait?",
      bars: [
        candle(2288, 2296, 2284, 2294),
        candle(2294, 2303, 2290, 2301),
        candle(2301, 2311, 2296, 2308),
        candle(2308, 2318, 2304, 2315),
        candle(2315, 2319, 2307, 2310),
        candle(2310, 2313, 2303, 2307),
        candle(2307, 2310, 2301, 2305),
        candle(2305, 2323, 2304, 2320),
        candle(2320, 2329, 2316, 2326),
        candle(2326, 2335, 2322, 2332)
      ]
    },
    {
      id: "morning-star",
      title: "XAUUSD three-candle bounce after a sharp drop",
      subtitle: "Gold flushes lower, stalls, then begins a cleaner reversal sequence",
      bias: "bullish",
      quality: 4,
      factors: ["Sharp drop first", "Selling slowed", "Buyers stepped in", "Three-candle reversal"],
      summary:
        "This pattern is useful because it shows a sequence: hard selling, slowdown, then a stronger bounce candle.",
      thought:
        "A beginner should watch the third candle most closely. It shows whether buyers truly took control or not.",
      checklist: [
        "Was the first candle clearly bearish?",
        "Did the middle candle show slowing momentum?",
        "Did the third candle bounce strongly enough to matter?",
        "Did all this happen after a real drop?"
      ],
      decisionIndex: 6,
      revealLabel: "The base holds and the reversal sequence completes.",
      trainerPrompt: "After a sharp drop, the market formed a three-candle bounce pattern. Is the better clue up, down, or wait?",
      bars: [
        candle(2396, 2399, 2388, 2390),
        candle(2390, 2392, 2381, 2384),
        candle(2384, 2386, 2371, 2375),
        candle(2375, 2377, 2362, 2367),
        candle(2366.5, 2370.2, 2361.8, 2366.9),
        candle(2367.2, 2380.5, 2365.8, 2378.9),
        candle(2378.9, 2389.2, 2375.6, 2386.8),
        candle(2386.8, 2394.0, 2383.9, 2391.6),
        candle(2391.6, 2398.4, 2388.7, 2395.2)
      ]
    }
  ];

  const profileScenarios = [
    {
      id: "hvn-rejection",
      title: "XAUUSD value-area pullback holds",
      subtitle: "Gold rotates back into accepted value, then buyers defend the high-volume pocket.",
      bias: "bullish",
      summary:
        "The market comes down into a thick high-volume area, stalls, and then prints a bullish rejection. That says buyers are willing to do business there again.",
      explanation:
        "The high-volume node matters because it is a price area the market already accepted. If candles reject that area instead of slicing through it, the bounce idea becomes more reasonable.",
      checklist: [
        "Is price reacting inside a thick high-volume zone rather than random space?",
        "Did the reaction candle reject lower prices cleanly?",
        "Is there room back toward the next major profile node overhead?",
        "If the node fails, where is the trade idea invalid?"
      ],
      bars: [
        candle(2372, 2379, 2368, 2377),
        candle(2377, 2386, 2373, 2383),
        candle(2383, 2391, 2378, 2388),
        candle(2388, 2392, 2379, 2381),
        candle(2381, 2384, 2369, 2372),
        candle(2372, 2376, 2358, 2364),
        candle(2364, 2369, 2352, 2366),
        candle(2366, 2380, 2361, 2377),
        candle(2377, 2388, 2372, 2384)
      ],
      profileLevels: [
        { price: 2392, volume: 0.28, type: "lvn", label: "Thin zone above" },
        { price: 2385, volume: 0.48, type: "mid", label: "Upper rotation" },
        { price: 2378, volume: 0.95, type: "hvn", label: "HVN / POC" },
        { price: 2371, volume: 0.82, type: "hvn", label: "Accepted value" },
        { price: 2365, volume: 0.92, type: "hvn", label: "Buyers defend here" },
        { price: 2358, volume: 0.55, type: "mid", label: "Transition" },
        { price: 2350, volume: 0.24, type: "lvn", label: "Fast zone below" }
      ],
      focusIndex: 6,
      annotations: [
        { price: 2365, text: "Rejection at HVN" },
        { price: 2378, text: "POC can attract price" }
      ]
    },
    {
      id: "lvn-acceptance-break",
      title: "XAUUSD breakout through a low-volume gap",
      subtitle: "Gold leaves balance, enters a thin zone, and expands quickly toward the next heavy node.",
      bias: "bullish",
      summary:
        "The market accepts above the old value area, then pushes through a low-volume pocket with little friction. That often leads to a faster move.",
      explanation:
        "Low-volume zones show prices where the market previously spent less time. Once price escapes value and holds above it, those thin zones can act like air pockets until the next heavy node.",
      checklist: [
        "Did price first leave the old value area with strong candles?",
        "Is the move traveling through a low-volume gap rather than into a thick node?",
        "Are continuation candles holding above the breakout area?",
        "Where is the next high-volume area that may slow the move?"
      ],
      bars: [
        candle(2318, 2324, 2313, 2322),
        candle(2322, 2328, 2318, 2326),
        candle(2326, 2329, 2320, 2324),
        candle(2324, 2328, 2319, 2322),
        candle(2322, 2340, 2320, 2337),
        candle(2337, 2354, 2334, 2350),
        candle(2350, 2362, 2346, 2358),
        candle(2358, 2368, 2353, 2364)
      ],
      profileLevels: [
        { price: 2364, volume: 0.84, type: "hvn", label: "Next HVN target" },
        { price: 2352, volume: 0.34, type: "lvn", label: "Thin zone" },
        { price: 2343, volume: 0.22, type: "lvn", label: "Fast area" },
        { price: 2335, volume: 0.41, type: "mid", label: "Leaving value" },
        { price: 2326, volume: 0.97, type: "hvn", label: "Old POC" },
        { price: 2319, volume: 0.88, type: "hvn", label: "Old value" },
        { price: 2311, volume: 0.56, type: "mid", label: "Lower balance" }
      ],
      focusIndex: 4,
      annotations: [
        { price: 2326, text: "Old value left behind" },
        { price: 2343, text: "LVN can move fast" }
      ]
    },
    {
      id: "poc-failure",
      title: "XAUUSD POC reclaim fails",
      subtitle: "Gold retests the busiest price from below, fails to accept, and turns lower.",
      bias: "bearish",
      summary:
        "Price tests the point of control from below, but buyers cannot accept back above it. The failed reclaim becomes the clue for a move down.",
      explanation:
        "The point of control is important because a lot of business happened there. If price reaches it and quickly gets rejected, that tells you the market is not accepting back into old value yet.",
      checklist: [
        "Did price test the POC from below rather than bounce cleanly through it?",
        "Did candles show rejection and weak closes near the node?",
        "Is the market failing to regain acceptance back inside value?",
        "Where is the next lower node or support area?"
      ],
      bars: [
        candle(2381, 2385, 2372, 2375),
        candle(2375, 2379, 2365, 2368),
        candle(2368, 2372, 2358, 2361),
        candle(2361, 2378, 2359, 2374),
        candle(2374, 2384, 2369, 2381),
        candle(2381, 2383, 2367, 2370),
        candle(2370, 2373, 2356, 2362),
        candle(2362, 2365, 2349, 2353)
      ],
      profileLevels: [
        { price: 2382, volume: 0.93, type: "hvn", label: "POC" },
        { price: 2374, volume: 0.78, type: "hvn", label: "Upper value" },
        { price: 2366, volume: 0.46, type: "mid", label: "Transition" },
        { price: 2358, volume: 0.31, type: "lvn", label: "Weak support" },
        { price: 2351, volume: 0.74, type: "hvn", label: "Lower node" },
        { price: 2344, volume: 0.58, type: "mid", label: "Next support" }
      ],
      focusIndex: 5,
      annotations: [
        { price: 2382, text: "POC rejects reclaim" },
        { price: 2351, text: "Next lower node" }
      ]
    }
  ];

  const timingExamples = {
    good: {
      title: "XAUUSD pullback into support, then strong rejection",
      subtitle: "Gold sells into a prior support shelf around 2330, rejects lower prices, then pushes back toward the next resistance.",
      summary:
        "This is good timing because the trade idea is clear: gold pulled back into a known level, printed rejection, and still had room to move before the next obstacle.",
      checklist: [
        "The entry is near support, not in random space.",
        "The rejection candle gives a clear reason for buyers to step in.",
        "The invalidation is obvious below the sweep low.",
        "There is room back toward the next resistance zone."
      ],
      decisionIndex: 7,
      revealLabel: "The bounce works because timing, location, and reaction all align.",
      bars: [
        candle(2368, 2374, 2362, 2371),
        candle(2371, 2376, 2364, 2367),
        candle(2367, 2370, 2358, 2361),
        candle(2361, 2365, 2352, 2356),
        candle(2356, 2359, 2345, 2349),
        candle(2349, 2351, 2338, 2342),
        candle(2342, 2345, 2329, 2334),
        candle(2334, 2342, 2324, 2340),
        candle(2340, 2351, 2337, 2348),
        candle(2348, 2359, 2344, 2355),
        candle(2355, 2364, 2351, 2361)
      ]
    },
    bad: {
      title: "XAUUSD chasing after the move already happened",
      subtitle: "Gold already expanded hard from support, then prints a small indecision candle under resistance with poor reward left.",
      summary:
        "This is bad timing because the easy part of the move is already gone. You would be buying late into nearby resistance without a clean invalidation.",
      checklist: [
        "Price is no longer near the original support entry.",
        "The candle is small and not showing clear strength.",
        "Resistance is close overhead, so reward is limited.",
        "The stop would likely be wide or arbitrary."
      ],
      decisionIndex: 8,
      revealLabel: "Late entries often stall because the move is already stretched.",
      bars: [
        candle(2328, 2335, 2324, 2332),
        candle(2332, 2341, 2329, 2338),
        candle(2338, 2348, 2334, 2345),
        candle(2345, 2356, 2341, 2352),
        candle(2352, 2363, 2348, 2359),
        candle(2359, 2370, 2355, 2366),
        candle(2366, 2376, 2362, 2372),
        candle(2372, 2380, 2368, 2377),
        candle(2377, 2382, 2372, 2378),
        candle(2378, 2381, 2369, 2371),
        candle(2371, 2375, 2363, 2366)
      ]
    }
  };

  const state = {
    scenarioId: scenarios[0].id,
    showScenarioResolution: false,
    profileScenarioId: profileScenarios[0].id,
    trainer: {
      scenarioId: scenarios[0].id,
      revealed: false,
      answered: false,
      guess: "",
      correct: 0,
      total: 0,
    },
  };

  function svgEl(name, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, String(value)));
    return el;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(start, end, ratio) {
    return start + (end - start) * ratio;
  }

  function getScenario(id) {
    return scenarios.find((item) => item.id === id) || scenarios[0];
  }

  function getProfileScenario(id) {
    return profileScenarios.find((item) => item.id === id) || profileScenarios[0];
  }

  function randomScenarioId(exceptId) {
    const pool = scenarios.filter((item) => item.id !== exceptId);
    const source = pool.length ? pool : scenarios;
    return source[Math.floor(Math.random() * source.length)].id;
  }

  function setBiasPill(node, bias) {
    node.className = `biasPill ${bias}`;
    node.textContent =
      bias === "bullish" ? "Best clue: up" : bias === "bearish" ? "Best clue: down" : "Best clue: wait";
  }

  function drawQualityMeter(node, quality) {
    clear(node);
    for (let i = 0; i < 5; i += 1) {
      const dot = document.createElement("span");
      dot.className = `qualityDot${i < quality ? " active" : ""}`;
      node.appendChild(dot);
    }
  }

  function priceScale(bars) {
    const low = Math.min(...bars.map((bar) => bar.l));
    const high = Math.max(...bars.map((bar) => bar.h));
    const pad = (high - low || 1) * 0.12;
    return {
      min: low - pad,
      max: high + pad,
    };
  }

  function mapY(price, scale, innerHeight, top) {
    const ratio = (price - scale.min) / (scale.max - scale.min || 1);
    return top + innerHeight - ratio * innerHeight;
  }

  function buildProfileBins(scale, levels, count) {
    const bins = [];
    const span = scale.max - scale.min || 1;
    const sigma = span / 10;

    for (let index = 0; index < count; index += 1) {
      const ratio = index / Math.max(count - 1, 1);
      const price = lerp(scale.max, scale.min, ratio);
      let volume = 0.06;

      levels.forEach((level) => {
        const distance = price - level.price;
        const weight = Math.exp(-(distance * distance) / (2 * sigma * sigma));
        const typeBoost = level.type === "hvn" ? 1 : level.type === "lvn" ? 0.48 : 0.72;
        volume += level.volume * typeBoost * weight;
      });

      bins.push({ index, price, volume });
    }

    const maxVolume = Math.max(...bins.map((bin) => bin.volume), 1);
    bins.forEach((bin) => {
      bin.volume = bin.volume / maxVolume;
    });

    const sorted = [...bins].sort((a, b) => b.volume - a.volume);
    const totalVolume = bins.reduce((sum, bin) => sum + bin.volume, 0) || 1;
    let running = 0;
    const valueAreaIndexes = new Set();

    sorted.forEach((bin) => {
      if (running / totalVolume <= 0.7) {
        valueAreaIndexes.add(bin.index);
        running += bin.volume;
      }
    });

    const pocIndex = bins.reduce((best, bin, index, source) => (bin.volume > source[best].volume ? index : best), 0);

    return {
      bins: bins.map((bin) => ({
        ...bin,
        isValueArea: valueAreaIndexes.has(bin.index),
        isPoc: bin.index === pocIndex,
      })),
      poc: bins[pocIndex],
    };
  }

  function drawCandlestickChart(svg, bars, options) {
    clear(svg);
    const viewBox = (svg.getAttribute("viewBox") || "0 0 920 360").split(/\s+/).map(Number);
    const width = viewBox[2] || 920;
    const height = viewBox[3] || 360;
    const padding = { top: 28, right: 20, bottom: 28, left: 26 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const visibleCount = options.visibleCount || bars.length;
    const visibleBars = bars.slice(0, visibleCount);
    const scale = priceScale(visibleBars);
    const step = innerWidth / Math.max(visibleBars.length, 1);
    const candleWidth = Math.min(28, step * 0.62);

    for (let line = 0; line <= 4; line += 1) {
      const y = padding.top + (innerHeight / 4) * line;
      svg.appendChild(svgEl("line", { x1: padding.left, y1: y, x2: width - padding.right, y2: y, class: "gridLine" }));
    }

    if (typeof options.focusIndex === "number" && options.focusIndex < visibleCount) {
      const focusX = padding.left + step * options.focusIndex;
      svg.appendChild(
        svgEl("rect", {
          x: focusX + step * 0.08,
          y: padding.top,
          width: step * 0.84,
          height: innerHeight,
          rx: 12,
          class: "focusZone",
        })
      );
    }

    if (typeof options.resolutionFrom === "number" && options.resolutionFrom < visibleCount) {
      const x = padding.left + step * options.resolutionFrom;
      svg.appendChild(
        svgEl("rect", {
          x,
          y: padding.top,
          width: step * (visibleCount - options.resolutionFrom),
          height: innerHeight,
          class: "resolutionZone",
        })
      );
    }

    visibleBars.forEach((bar, index) => {
      const centerX = padding.left + step * index + step / 2;
      const wickY1 = mapY(bar.h, scale, innerHeight, padding.top);
      const wickY2 = mapY(bar.l, scale, innerHeight, padding.top);
      const openY = mapY(bar.o, scale, innerHeight, padding.top);
      const closeY = mapY(bar.c, scale, innerHeight, padding.top);
      const topY = Math.min(openY, closeY);
      const bodyHeight = Math.max(4, Math.abs(closeY - openY));
      const bodyColor = bar.c >= bar.o ? "var(--bull)" : "var(--bear)";

      svg.appendChild(
        svgEl("line", {
          x1: centerX,
          y1: wickY1,
          x2: centerX,
          y2: wickY2,
          stroke: bodyColor,
          "stroke-width": 2.5,
          "stroke-linecap": "round",
        })
      );

      svg.appendChild(
        svgEl("rect", {
          x: centerX - candleWidth / 2,
          y: topY,
          width: candleWidth,
          height: bodyHeight,
          rx: 4,
          fill: bodyColor,
          opacity: 0.96,
        })
      );
    });

    svg.appendChild(svgEl("line", { x1: padding.left, y1: height - padding.bottom, x2: width - padding.right, y2: height - padding.bottom, class: "axisLine" }));

    const topLabel = svgEl("text", { x: width - padding.right - 4, y: padding.top - 6, "text-anchor": "end", class: "chartLabel" });
    topLabel.textContent = scale.max.toFixed(1);
    svg.appendChild(topLabel);

    const bottomLabel = svgEl("text", { x: width - padding.right - 4, y: height - padding.bottom + 18, "text-anchor": "end", class: "chartLabel" });
    bottomLabel.textContent = scale.min.toFixed(1);
    svg.appendChild(bottomLabel);

    if (options.annotation) {
      const annotation = svgEl("text", { x: padding.left + 8, y: padding.top + 18, class: "chartAnnotation" });
      annotation.textContent = options.annotation;
      svg.appendChild(annotation);
    }
  }

  function drawVolumeProfileChart(svg, scenario) {
    clear(svg);
    const viewBox = (svg.getAttribute("viewBox") || "0 0 980 420").split(/\s+/).map(Number);
    const width = viewBox[2] || 980;
    const height = viewBox[3] || 420;
    const padding = { top: 28, right: 28, bottom: 32, left: 32 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const profileWidth = innerWidth * 0.33;
    const chartWidth = innerWidth - profileWidth - 22;
    const chartLeft = padding.left;
    const profileLeft = padding.left + chartWidth + 22;
    const bars = scenario.bars;
    const scale = priceScale(bars);
    const step = chartWidth / Math.max(bars.length, 1);
    const candleWidth = Math.min(24, step * 0.58);
    const profile = buildProfileBins(scale, scenario.profileLevels, 28);
    const pocY = mapY(profile.poc.price, scale, innerHeight, padding.top);
    const majorLevels = [
      scenario.profileLevels.find((level) => level.label.includes("POC")) || scenario.profileLevels.find((level) => level.type === "hvn"),
      scenario.profileLevels.find((level) => level.type === "lvn"),
    ].filter(Boolean);

    for (let line = 0; line <= 4; line += 1) {
      const y = padding.top + (innerHeight / 4) * line;
      svg.appendChild(svgEl("line", { x1: padding.left, y1: y, x2: width - padding.right, y2: y, class: "gridLine" }));
    }

    svg.appendChild(
      svgEl("rect", {
        x: profileLeft,
        y: padding.top,
        width: profileWidth,
        height: innerHeight,
        class: "profilePanelShade",
        rx: 16,
      })
    );

    svg.appendChild(
      svgEl("line", {
        x1: chartLeft,
        y1: pocY,
        x2: profileLeft + profileWidth,
        y2: pocY,
        class: "pocGuideLine",
      })
    );

    bars.forEach((bar, index) => {
      const centerX = chartLeft + step * index + step / 2;
      const wickY1 = mapY(bar.h, scale, innerHeight, padding.top);
      const wickY2 = mapY(bar.l, scale, innerHeight, padding.top);
      const openY = mapY(bar.o, scale, innerHeight, padding.top);
      const closeY = mapY(bar.c, scale, innerHeight, padding.top);
      const topY = Math.min(openY, closeY);
      const bodyHeight = Math.max(4, Math.abs(closeY - openY));
      const bodyColor = bar.c >= bar.o ? "var(--bull)" : "var(--bear)";

      if (index === scenario.focusIndex) {
        svg.appendChild(
          svgEl("rect", {
            x: chartLeft + step * index + step * 0.08,
            y: padding.top,
            width: step * 0.84,
            height: innerHeight,
            class: "focusZone",
            rx: 12,
          })
        );
      }

      svg.appendChild(
        svgEl("line", {
          x1: centerX,
          y1: wickY1,
          x2: centerX,
          y2: wickY2,
          stroke: bodyColor,
          "stroke-width": 2.5,
          "stroke-linecap": "round",
        })
      );

      svg.appendChild(
        svgEl("rect", {
          x: centerX - candleWidth / 2,
          y: topY,
          width: candleWidth,
          height: bodyHeight,
          rx: 4,
          fill: bodyColor,
          opacity: 0.96,
        })
      );
    });

    profile.bins.forEach((bin, index, source) => {
      const nextPrice = source[index + 1] ? source[index + 1].price : lerp(bin.price, scale.min, 1 / source.length);
      const yTop = mapY(bin.price, scale, innerHeight, padding.top);
      const yBottom = mapY(nextPrice, scale, innerHeight, padding.top);
      const binHeight = Math.max(6, yBottom - yTop + 1);
      const barWidth = clamp((profileWidth - 24) * bin.volume, 10, profileWidth - 20);
      let className = "profileBar";

      if (bin.isPoc) {
        className += " poc";
      } else if (bin.isValueArea) {
        className += " value";
      } else {
        className += " outer";
      }

      svg.appendChild(
        svgEl("rect", {
          x: profileLeft + profileWidth - 10 - barWidth,
          y: yTop,
          width: barWidth,
          height: binHeight,
          rx: Math.min(6, binHeight / 2),
          class: className,
        })
      );
    });

    majorLevels.forEach((level, index) => {
      const y = mapY(level.price, scale, innerHeight, padding.top);
      const text = svgEl("text", {
        x: profileLeft + profileWidth - 12,
        y: y + (index === 0 ? -10 : 18),
        "text-anchor": "end",
        class: "profileText",
      });
      text.textContent = level.label;
      svg.appendChild(text);
    });

    scenario.annotations.forEach((annotation, index) => {
      const y = mapY(annotation.price, scale, innerHeight, padding.top);
      const calloutX = chartLeft + (index === 0 ? 18 : chartWidth * 0.46);
      const calloutY = y + (index === 0 ? -24 : 26);

      svg.appendChild(
        svgEl("line", {
          x1: calloutX + 6,
          y1: calloutY + 4,
          x2: chartLeft + chartWidth * 0.78,
          y2: y,
          class: "profileCalloutLine",
        })
      );

      const label = svgEl("text", {
        x: calloutX,
        y: calloutY,
        class: "profileAnnotation",
      });
      label.textContent = annotation.text;
      svg.appendChild(label);
    });

    const chartLabel = svgEl("text", {
      x: chartLeft + 8,
      y: padding.top + 18,
      class: "chartAnnotation",
    });
    chartLabel.textContent = "Price candles";
    svg.appendChild(chartLabel);

    const profileLabel = svgEl("text", {
      x: profileLeft + 10,
      y: padding.top + 18,
      class: "chartAnnotation",
    });
    profileLabel.textContent = "Volume profile by price";
    svg.appendChild(profileLabel);

    svg.appendChild(svgEl("line", { x1: chartLeft, y1: height - padding.bottom, x2: profileLeft + profileWidth, y2: height - padding.bottom, class: "axisLine" }));

    const topLabel = svgEl("text", { x: width - padding.right - 4, y: padding.top - 6, "text-anchor": "end", class: "chartLabel" });
    topLabel.textContent = scale.max.toFixed(1);
    svg.appendChild(topLabel);

    const bottomLabel = svgEl("text", { x: width - padding.right - 4, y: height - padding.bottom + 18, "text-anchor": "end", class: "chartLabel" });
    bottomLabel.textContent = scale.min.toFixed(1);
    svg.appendChild(bottomLabel);
  }

  function renderScenario() {
    const scenario = getScenario(state.scenarioId);
    scenarioTitle.textContent = scenario.title;
    scenarioSubtitle.textContent = scenario.subtitle;
    scenarioSummary.textContent = scenario.summary;
    scenarioThought.textContent = scenario.thought;
    setBiasPill(scenarioBiasPill, scenario.bias);
    drawQualityMeter(scenarioQuality, scenario.quality);

    clear(factorChips);
    scenario.factors.forEach((factor) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = factor;
      factorChips.appendChild(chip);
    });

    clear(scenarioChecklist);
    scenario.checklist.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      scenarioChecklist.appendChild(li);
    });

    const visibleCount = state.showScenarioResolution ? scenario.bars.length : scenario.decisionIndex + 1;
    drawCandlestickChart(scenarioChart, scenario.bars, {
      visibleCount,
      focusIndex: scenario.decisionIndex,
      resolutionFrom: state.showScenarioResolution ? scenario.decisionIndex + 1 : undefined,
      annotation: state.showScenarioResolution ? scenario.revealLabel : "Study the highlighted candle before revealing what happened next",
    });

    toggleResolutionBtn.textContent = state.showScenarioResolution ? "Hide what happened next" : "Show what happened next";
  }

  function classifyBuilder(direction, body, upperWick, lowerWick) {
    const bodyRatio = body / 100;
    const upperRatio = upperWick / 100;
    const lowerRatio = lowerWick / 100;

    if (bodyRatio < 0.18 && upperRatio > 0.42 && lowerRatio > 0.42) {
      return {
        label: "Doji-like indecision",
        explanation:
          "A tiny body with long wicks means neither side clearly won. This usually means be careful, not trade now.",
        notes: [
          "This is not a strong signal by itself.",
          "Near support or resistance, it can warn that momentum is slowing.",
          "In the middle of a range, it often means noise."
        ]
      };
    }

    if (bodyRatio < 0.34 && lowerRatio > 0.5 && upperRatio < 0.24) {
      return {
        label: direction === "bullish" ? "Hammer-like rejection" : "Hanging man-like warning",
        explanation:
          "The long lower wick shows price moved down, but buyers pushed it back up before the close.",
        notes: [
          "After a selloff near support, this can support a bounce idea.",
          "After a long uptrend, the same shape can be less bullish.",
          "The next candle tells you whether the rejection mattered."
        ]
      };
    }

    if (bodyRatio < 0.34 && upperRatio > 0.5 && lowerRatio < 0.24) {
      return {
        label: direction === "bearish" ? "Shooting star-like rejection" : "Inverted hammer-like probe",
        explanation:
          "The long upper wick means price moved higher, but sellers pushed it back down before the close.",
        notes: [
          "At resistance, this can warn that price may turn lower.",
          "After a selloff, it may only be an early sign, not confirmation.",
          "The next candle matters a lot here."
        ]
      };
    }

    if (bodyRatio > 0.55 && upperRatio < 0.18 && lowerRatio < 0.18) {
      return {
        label: direction === "bullish" ? "Momentum breakout candle" : "Momentum breakdown candle",
        explanation:
          "A large body with small wicks usually means one side stayed strong for most of the candle.",
        notes: [
          "These candles are often good continuation clues.",
          "They work best when they break an important level cleanly.",
          "If the next candle stalls right away, the signal was weaker than it looked."
        ]
      };
    }

    return {
      label: "Balanced pressure candle",
      explanation:
        "This candle is mixed. It is not strongly bullish or bearish by itself.",
      notes: [
        "Ask whether it formed at an important level.",
        "Check if the market is trending or moving sideways.",
        "Wait for more clues."
      ]
    };
  }

  function renderBuilder() {
    const direction = builderDirection.value;
    const body = Number(builderBody.value);
    const upperWick = Number(builderUpperWick.value);
    const lowerWick = Number(builderLowerWick.value);
    const classification = classifyBuilder(direction, body, upperWick, lowerWick);

    builderLabel.textContent = classification.label;
    builderExplanation.textContent = classification.explanation;
    clear(builderNotes);
    classification.notes.forEach((note) => {
      const li = document.createElement("li");
      li.textContent = note;
      builderNotes.appendChild(li);
    });

    const bodyCenter = 100;
    const halfBody = body / 2;
    const bodyLow = bodyCenter - halfBody;
    const bodyHigh = bodyCenter + halfBody;
    const open = direction === "bullish" ? bodyLow : bodyHigh;
    const close = direction === "bullish" ? bodyHigh : bodyLow;
    const high = bodyHigh + upperWick;
    const low = bodyLow - lowerWick;
    const bars = [
      candle(open, high, low, close),
    ];
    drawCandlestickChart(builderChart, bars, {
      visibleCount: 1,
      annotation: "Body and wick size change the message",
    });

    const guide = svgEl("text", { x: 250, y: 324, "text-anchor": "middle", class: "chartLabel" });
    guide.textContent = `Upper wick ${upperWick}%  |  Body ${body}%  |  Lower wick ${lowerWick}%`;
    builderChart.appendChild(guide);
  }

  function renderProfileLesson() {
    const scenario = getProfileScenario(state.profileScenarioId);
    profileLessonTitle.textContent = scenario.title;
    profileLessonSubtitle.textContent = scenario.subtitle;
    profileSummary.textContent = scenario.summary;
    profileExplanation.textContent = scenario.explanation;
    setBiasPill(profileBiasPill, scenario.bias);

    clear(profileChecklist);
    scenario.checklist.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      profileChecklist.appendChild(li);
    });

    drawVolumeProfileChart(profileChart, scenario);
  }

  function renderTimingExamples() {
    const good = timingExamples.good;
    goodTimingTitle.textContent = good.title;
    goodTimingSubtitle.textContent = good.subtitle;
    goodTimingSummary.textContent = good.summary;
    clear(goodTimingChecklist);
    good.checklist.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      goodTimingChecklist.appendChild(li);
    });
    drawCandlestickChart(goodTimingChart, good.bars, {
      visibleCount: good.bars.length,
      focusIndex: good.decisionIndex,
      resolutionFrom: good.decisionIndex + 1,
      annotation: good.revealLabel,
    });

    const bad = timingExamples.bad;
    badTimingTitle.textContent = bad.title;
    badTimingSubtitle.textContent = bad.subtitle;
    badTimingSummary.textContent = bad.summary;
    clear(badTimingChecklist);
    bad.checklist.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      badTimingChecklist.appendChild(li);
    });
    drawCandlestickChart(badTimingChart, bad.bars, {
      visibleCount: bad.bars.length,
      focusIndex: bad.decisionIndex,
      resolutionFrom: bad.decisionIndex + 1,
      annotation: bad.revealLabel,
    });
  }

  function trainerOutcomeText(scenario) {
    return scenario.bias === "bullish"
      ? "Bullish follow-through was the better read."
      : scenario.bias === "bearish"
        ? "Bearish follow-through was the better read."
        : "The higher-quality decision was to wait for cleaner structure.";
  }

  function renderTrainerFeedback(message, tone) {
    trainerFeedback.innerHTML = "";
    const strong = document.createElement("strong");
    strong.textContent = tone;
    trainerFeedback.appendChild(strong);
    const body = document.createElement("div");
    body.textContent = message;
    trainerFeedback.appendChild(body);
  }

  function renderConfidenceLabel() {
    const value = Number(confidenceSlider.value);
    const label =
      value <= 2 ? "low confidence" : value === 3 ? "medium confidence" : value === 4 ? "high confidence" : "very high confidence";
    confidenceLabel.textContent = `${value} / 5 - ${label}`;
  }

  function renderTrainer() {
    const scenario = getScenario(state.trainer.scenarioId);
    trainerTitle.textContent = scenario.title;
    trainerPrompt.textContent = scenario.trainerPrompt;
    scoreCorrect.textContent = String(state.trainer.correct);
    scoreTotal.textContent = String(state.trainer.total);

    const visibleCount = state.trainer.revealed ? scenario.bars.length : scenario.decisionIndex + 1;
    drawCandlestickChart(trainerChart, scenario.bars, {
      visibleCount,
      focusIndex: scenario.decisionIndex,
      resolutionFrom: state.trainer.revealed ? scenario.decisionIndex + 1 : undefined,
      annotation: state.trainer.revealed ? scenario.revealLabel : "Choose your best guess before revealing the next candles",
    });

    guessButtons.forEach((button) => {
      button.classList.remove("selected", "correct", "wrong");
      if (state.trainer.guess && button.dataset.guess === state.trainer.guess) {
        button.classList.add("selected");
      }
      if (state.trainer.revealed) {
        if (button.dataset.guess === scenario.bias) button.classList.add("correct");
        if (state.trainer.guess === button.dataset.guess && state.trainer.guess !== scenario.bias) {
          button.classList.add("wrong");
        }
      }
    });

    if (!state.trainer.answered) {
      renderTrainerFeedback("Pick the simplest answer: up, down, or wait. Then reveal the next candles.", "Trainer ready");
      return;
    }

    if (!state.trainer.revealed) {
      renderTrainerFeedback("Good. Now reveal the next candles and compare your guess with what actually happened.", "Guess saved");
      return;
    }

    const confidence = Number(confidenceSlider.value);
    const wasCorrect = state.trainer.guess === scenario.bias;
    if (wasCorrect) {
      renderTrainerFeedback(
        `${trainerOutcomeText(scenario)} Your confidence was ${confidence}/5. Try to explain what clue helped most: the wick, the body, the trend, or the level.`,
        "Nice read"
      );
    } else {
      renderTrainerFeedback(
        `${trainerOutcomeText(scenario)} You guessed "${state.trainer.guess}". That is fine. The goal is to learn which clue mattered more: trend, location, or the candle shape itself.`,
        "Review the clue"
      );
    }
  }

  function startTrainerRound(nextId) {
    state.trainer.scenarioId = nextId || randomScenarioId(state.trainer.scenarioId);
    state.trainer.revealed = false;
    state.trainer.answered = false;
    state.trainer.guess = "";
    renderTrainer();
  }

  function submitGuess(guess) {
    if (state.trainer.revealed) return;
    state.trainer.guess = guess;
    state.trainer.answered = true;
    renderTrainer();
  }

  function revealTrainer() {
    if (!state.trainer.answered || state.trainer.revealed) return;
    state.trainer.revealed = true;
    state.trainer.total += 1;
    if (state.trainer.guess === getScenario(state.trainer.scenarioId).bias) {
      state.trainer.correct += 1;
    }
    renderTrainer();
  }

  function populateScenarioSelect() {
    clear(scenarioSelect);
    scenarios.forEach((scenario) => {
      const option = document.createElement("option");
      option.value = scenario.id;
      option.textContent = scenario.title;
      scenarioSelect.appendChild(option);
    });
    scenarioSelect.value = state.scenarioId;
  }

  function populateProfileScenarioSelect() {
    clear(profileScenarioSelect);
    profileScenarios.forEach((scenario) => {
      const option = document.createElement("option");
      option.value = scenario.id;
      option.textContent = scenario.title;
      profileScenarioSelect.appendChild(option);
    });
    profileScenarioSelect.value = state.profileScenarioId;
  }

  scenarioSelect.addEventListener("change", () => {
    state.scenarioId = scenarioSelect.value;
    state.showScenarioResolution = false;
    renderScenario();
  });

  profileScenarioSelect.addEventListener("change", () => {
    state.profileScenarioId = profileScenarioSelect.value;
    renderProfileLesson();
  });

  [builderDirection, builderBody, builderUpperWick, builderLowerWick].forEach((control) =>
    control.addEventListener("input", renderBuilder)
  );

  toggleResolutionBtn.addEventListener("click", () => {
    state.showScenarioResolution = !state.showScenarioResolution;
    renderScenario();
  });

  shuffleScenarioBtn.addEventListener("click", () => {
    state.scenarioId = randomScenarioId(state.scenarioId);
    scenarioSelect.value = state.scenarioId;
    state.showScenarioResolution = false;
    renderScenario();
  });

  heroShuffleBtn.addEventListener("click", () => {
    state.scenarioId = randomScenarioId(state.scenarioId);
    scenarioSelect.value = state.scenarioId;
    state.showScenarioResolution = false;
    renderScenario();
  });

  heroTrainerBtn.addEventListener("click", () => {
    trainerSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  guessButtons.forEach((button) => {
    button.addEventListener("click", () => submitGuess(button.dataset.guess));
  });

  newChallengeBtn.addEventListener("click", () => startTrainerRound());
  revealChallengeBtn.addEventListener("click", revealTrainer);
  confidenceSlider.addEventListener("input", renderConfidenceLabel);

  populateScenarioSelect();
  populateProfileScenarioSelect();
  renderScenario();
  renderBuilder();
  renderTimingExamples();
  renderProfileLesson();
  renderConfidenceLabel();
  startTrainerRound(scenarios[2].id);
})();
