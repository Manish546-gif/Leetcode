import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { fetchJson, postJson } from "../utils/api.js";

const DAILY_GOAL = 3;

const difficultyLabels = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  unspecified: "Unspecified",
};

const STORAGE_KEYS = {
  bookmarks: "lc-bookmarks",
  searchHistory: "lc-search-history",
  theme: "lc-theme",
  contestTracker: "lc-contest-tracker",
  planner: "lc-planner",
  collections: "lc-collections",
  reviewQueue: "lc-review-queue",
  codeHistory: "lc-code-history",
  interviewMode: "lc-interview-mode",
};

const THEME_OPTIONS = [
  { value: "mono", label: "Mono" },
  { value: "noir", label: "Noir" },
  { value: "pearl", label: "Pearl" },
];

const DEFAULT_CONTEST_TRACKER = {
  rating: "",
  bestRank: "",
  contests: "",
  lastContest: "",
};

const DEFAULT_PLANNER = {
  focus: "",
  minutes: "45",
  dueDate: "",
  notes: "",
};

const DEFAULT_INTERVIEW_MODE = {
  company: "",
  focusTopic: "",
  duration: "45",
  active: false,
};

function readStoredJson(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);

    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function dedupeRecent(items, nextItem) {
  return [nextItem, ...items.filter((item) => item !== nextItem)].slice(0, 8);
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toProblemMap(problems) {
  return problems.reduce((accumulator, problem) => {
    accumulator[problem.id] = problem;
    return accumulator;
  }, {});
}

function buildRecommendedQueue(problems, selectedTopics) {
  const ranked = [...problems].sort((left, right) => {
    const leftSolved = (left.status || "").toLowerCase() === "solved";
    const rightSolved = (right.status || "").toLowerCase() === "solved";
    if (leftSolved !== rightSolved) return leftSolved ? 1 : -1;

    const leftUpdated = new Date(left.lastUpdated || 0).getTime();
    const rightUpdated = new Date(right.lastUpdated || 0).getTime();
    if (leftUpdated !== rightUpdated) return leftUpdated - rightUpdated;

    const leftTopicMatch = selectedTopics.some((topic) => (left.topics || []).includes(topic));
    const rightTopicMatch = selectedTopics.some((topic) => (right.topics || []).includes(topic));
    if (leftTopicMatch !== rightTopicMatch) return leftTopicMatch ? -1 : 1;

    return Number(left.number) - Number(right.number);
  });

  return ranked.slice(0, 6);
}

function buildSnapshot(payload) {
  return JSON.stringify(payload, null, 2);
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatLongDate(value) {
  const date = parseDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatGreetingHour() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function countByDifficulty(problems) {
  return problems.reduce((accumulator, problem) => {
    const key = (problem.difficulty || "unspecified").toLowerCase();
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function buildActivityMap(problems) {
  return problems.reduce((accumulator, problem) => {
    const key = problem.lastUpdated ? dayKey(new Date(problem.lastUpdated)) : null;
    if (!key) return accumulator;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function computeStreak(activityMap) {
  const keys = Object.keys(activityMap).sort();
  if (!keys.length) return 0;

  const anchor = keys[keys.length - 1];
  let current = new Date(`${anchor}T00:00:00Z`);
  let streak = 0;

  while (activityMap[dayKey(current)]) {
    streak += 1;
    current.setUTCDate(current.getUTCDate() - 1);
  }

  return streak;
}

function getHeatLevel(count) {
  if (count >= 4) return 4;
  if (count === 3) return 3;
  if (count === 2) return 2;
  if (count === 1) return 1;
  return 0;
}

function getDifficultyMeta(difficulty) {
  const key = (difficulty || "unspecified").toLowerCase();
  return {
    key,
    label: difficultyLabels[key] || difficultyLabels.unspecified,
  };
}

function IconHome({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10.5V20h13V10.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

function IconSearch({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function IconBookmark({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M7 4.5h10a1 1 0 0 1 1 1V21l-6-3.5L6 21V5.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function IconSettings({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M10.5 4.5h3l.7 2.1a6.6 6.6 0 0 1 1.8 1l2.1-.5 1.5 2.6-1.6 1.5c.1.4.1.8.1 1.2s0 .8-.1 1.2l1.6 1.5-1.5 2.6-2.1-.5a6.6 6.6 0 0 1-1.8 1l-.7 2.1h-3l-.7-2.1a6.6 6.6 0 0 1-1.8-1l-2.1.5-1.5-2.6 1.6-1.5a6.9 6.9 0 0 1 0-2.4L4.4 10l1.5-2.6 2.1.5a6.6 6.6 0 0 1 1.8-1Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function IconProfile({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function IconBell({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M6.5 9.5A5.5 5.5 0 0 1 12 4a5.5 5.5 0 0 1 5.5 5.5c0 4 1.3 4.8 2 6H4.5c.7-1.2 2-2 2-6Z" />
      <path d="M9.2 18a2.8 2.8 0 0 0 5.6 0" />
    </svg>
  );
}

function IconGfg({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 2L2 7l10 5 10-5-10-5Z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function DifficultyChart({ stats }) {
  const entries = Object.entries(stats?.byDifficulty || {});
  const total = entries.reduce((sum, [, value]) => sum + value, 0) || 1;
  const colors = {
    easy: "#d8b48c",
    medium: "#c79b66",
    hard: "#9f6f4f",
    unspecified: "#b8a291",
  };

  let start = 0;
  const gradient = entries.length
    ? entries
        .map(([key, value]) => {
          const end = start + (value / total) * 360;
          const segment = `${colors[key] || colors.unspecified} ${start}deg ${end}deg`;
          start = end;
          return segment;
        })
        .join(", ")
    : `${colors.unspecified} 0deg 360deg`;

  return (
    <div className="glass-card flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Difficulty</p>
          <h3 className="mt-2 font-display text-xl text-white">Breakdown</h3>
        </div>
        <div className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/70">
          {total} solved
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div
          className="relative h-32 w-32 rounded-full"
          style={{
            background: `conic-gradient(${gradient})`,
          }}
        >
          <div className="absolute inset-[18%] rounded-full border border-white/10 bg-[rgba(34,22,16,0.58)] shadow-inner shadow-black/20" />
          <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full text-center">
            <span className="text-[10px] uppercase tracking-[0.28em] text-white/50">Solved</span>
            <span className="mt-1 font-display text-2xl text-white">{stats?.total || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-2 text-sm">
        {Object.entries(difficultyLabels).map(([key, label]) => {
          const value = stats?.byDifficulty?.[key] || 0;
          return (
            <div key={key} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/6 px-3 py-2">
              <span className="text-white/72">{label}</span>
              <span className="font-semibold text-white">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SidebarButton({ active = false, children, title, onClick }) {
  return (
    <button type="button" title={title} onClick={onClick} className={`glass-icon-button ${active ? "is-active" : ""}`}>
      {children}
    </button>
  );
}

export default function Home() {
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [sort, setSort] = useState("updated-desc");
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [detail, setDetail] = useState(null);
  const [notes, setNotes] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    const saved = readStoredJson(STORAGE_KEYS.bookmarks, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = readStoredJson(STORAGE_KEYS.searchHistory, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [theme, setTheme] = useState(() => readStoredJson(STORAGE_KEYS.theme, "mono"));
  const [contestTracker, setContestTracker] = useState(() => ({
    ...DEFAULT_CONTEST_TRACKER,
    ...readStoredJson(STORAGE_KEYS.contestTracker, DEFAULT_CONTEST_TRACKER),
  }));
  const [planner, setPlanner] = useState(() => ({
    ...DEFAULT_PLANNER,
    ...readStoredJson(STORAGE_KEYS.planner, DEFAULT_PLANNER),
  }));
  const [collections, setCollections] = useState(() => normalizeArray(readStoredJson(STORAGE_KEYS.collections, [])));
  const [reviewQueue, setReviewQueue] = useState(() => normalizeArray(readStoredJson(STORAGE_KEYS.reviewQueue, [])));
  const [codeHistory, setCodeHistory] = useState(() => normalizeArray(readStoredJson(STORAGE_KEYS.codeHistory, [])));
  const [interviewMode, setInterviewMode] = useState(() => ({
    ...DEFAULT_INTERVIEW_MODE,
    ...readStoredJson(STORAGE_KEYS.interviewMode, DEFAULT_INTERVIEW_MODE),
  }));
  const [collectionName, setCollectionName] = useState("");
  const [snapshotText, setSnapshotText] = useState("");
  const [syncStatus, setSyncStatus] = useState("loading");
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [hydratedFromServer, setHydratedFromServer] = useState(false);
  const searchRef = useRef(null);
  const recentRef = useRef(null);
  const detailRef = useRef(null);
  const activityRef = useRef(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [topicData, statsData] = await Promise.all([
          fetchJson("/topics"),
          fetchJson("/stats"),
        ]);
        setTopics(topicData.items || []);
        setStats(statsData);
      } catch (err) {
        setError("Unable to load topics or stats.");
      }
    }

    loadMeta();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      async function loadProblems() {
        setLoading(true);
        setError("");
        const query = search.trim();

        const params = new URLSearchParams();
        if (query) params.set("search", query);
        if (difficulty !== "all") params.set("difficulty", difficulty);
        if (selectedTopics.length) params.set("topics", selectedTopics.join(","));
        if (sort) params.set("sort", sort);

        try {
          const data = await fetchJson(`/problems?${params.toString()}`);
          setProblems(data.items || []);

          if (query) {
            setSearchHistory((current) => dedupeRecent(current, query));
          }
        } catch (err) {
          setError("Unable to load problems.");
        } finally {
          setLoading(false);
        }
      }

      loadProblems();
    }, 250);

    return () => clearTimeout(timeout);
  }, [search, difficulty, sort, selectedTopics]);

  useEffect(() => {
    if (!selectedProblemId && problems.length > 0) {
      setSelectedProblemId(problems[0].id);
    }
  }, [problems, selectedProblemId]);

  useEffect(() => {
    async function loadDetail() {
      if (!selectedProblemId) {
        setDetail(null);
        setNotes(null);
        return;
      }

      setDetailLoading(true);
      try {
        const [detailData, notesData] = await Promise.all([
          fetchJson(`/problem/${selectedProblemId}`),
          fetchJson(`/problem-notes/${selectedProblemId}`),
        ]);
        setDetail(detailData);
        setNotes(notesData);
      } catch (err) {
        setDetail(null);
        setNotes(null);
      } finally {
        setDetailLoading(false);
      }
    }

    loadDetail();
  }, [selectedProblemId]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardState() {
      setSyncStatus("loading");

      try {
        const document = await fetchJson("/dashboard-state");
        if (!cancelled) {
          hydrateDashboardState(document?.state || document || {});
          setLastSyncedAt(document?.updatedAt || new Date().toISOString());
          setSyncStatus("synced");
        }
      } catch (error) {
        if (!cancelled) {
          setSyncStatus("local");
        }
      } finally {
        if (!cancelled) {
          setHydratedFromServer(true);
        }
      }
    }

    loadDashboardState();

    return () => {
      cancelled = true;
    };
  }, []);

  const topicList = useMemo(() => topics.slice().sort(), [topics]);
  const sortedRecentProblems = useMemo(
    () => [...problems].sort((left, right) => new Date(right.lastUpdated || 0) - new Date(left.lastUpdated || 0)),
    [problems]
  );
  const solvedCount = useMemo(
    () => problems.filter((problem) => (problem.status || "").toLowerCase() === "solved").length,
    [problems]
  );
  const activityMap = useMemo(() => buildActivityMap(problems), [problems]);
  const streakDays = useMemo(() => computeStreak(activityMap), [activityMap]);
  const todayKey = dayKey(new Date());
  const todaySolved = activityMap[todayKey] || 0;
  const weeklyActivity = useMemo(() => {
    const cells = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() - 34);

    for (let index = 0; index < 35; index += 1) {
      const key = dayKey(cursor);
      cells.push({ key, count: activityMap[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    return cells;
  }, [activityMap]);
  const topTags = useMemo(() => {
    const entries = Object.entries(stats?.byTopic || {}).sort((left, right) => right[1] - left[1]);
    return entries.slice(0, 12).map(([topic]) => topic);
  }, [stats]);

  const selectedProblem = useMemo(
    () => problems.find((problem) => problem.id === selectedProblemId) || null,
    [problems, selectedProblemId]
  );
  const bookmarkedProblems = useMemo(
    () => bookmarkedIds.map((id) => problems.find((problem) => problem.id === id)).filter(Boolean),
    [bookmarkedIds, problems]
  );
  const problemMap = useMemo(() => toProblemMap(problems), [problems]);
  const nextProblem = useMemo(() => {
    const candidates = sortedRecentProblems.filter((problem) => problem.id !== selectedProblemId);
    return candidates[candidates.length - 1] || candidates[0] || null;
  }, [sortedRecentProblems, selectedProblemId]);
  const recommendedQueue = useMemo(
    () => buildRecommendedQueue(problems, selectedTopics),
    [problems, selectedTopics]
  );
  const plannedQueue = useMemo(() => {
    const focusTopics = planner.focus
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean);

    const source = focusTopics.length
      ? problems.filter((problem) => focusTopics.some((topic) => (problem.topics || []).includes(topic)))
      : recommendedQueue;

    return source.slice(0, 4);
  }, [planner.focus, problems, recommendedQueue]);
  const activeCollections = useMemo(
    () =>
      collections.map((collection) => ({
        ...collection,
        items: (collection.problemIds || []).map((problemId) => problemMap[problemId]).filter(Boolean),
      })),
    [collections, problemMap]
  );
  const activeReviewQueue = useMemo(
    () =>
      reviewQueue
        .map((entry) => ({
          ...entry,
          problem: problemMap[entry.problemId] || null,
        }))
        .filter((entry) => entry.problem),
    [reviewQueue, problemMap]
  );
  const latestCodeHistory = useMemo(
    () =>
      [...codeHistory]
        .sort((left, right) => new Date(right.savedAt || 0) - new Date(left.savedAt || 0))
        .slice(0, 5),
    [codeHistory]
  );
  const interviewQueue = useMemo(() => {
    const source = interviewMode.focusTopic
      ? problems.filter((problem) => (problem.topics || []).includes(interviewMode.focusTopic))
      : recommendedQueue;
    return source.slice(0, 3);
  }, [interviewMode.focusTopic, problems, recommendedQueue]);
  const dashboardSnapshot = useMemo(
    () => ({
      search,
      difficulty,
      sort,
      selectedTopics,
      selectedProblemId,
      bookmarks: bookmarkedIds,
      searchHistory,
      theme,
      contestTracker,
      planner,
      collections,
      reviewQueue,
      codeHistory,
      interviewMode,
    }),
    [
      bookmarkedIds,
      codeHistory,
      collections,
      contestTracker,
      difficulty,
      interviewMode,
      planner,
      reviewQueue,
      search,
      searchHistory,
      selectedProblemId,
      selectedTopics,
      sort,
      theme,
    ]
  );
  const syncRate = problems.length ? Math.round((solvedCount / problems.length) * 100) : 0;
  const profileSummary = useMemo(
    () => [
      { label: "Solved", value: solvedCount || 0 },
      { label: "Streak", value: `${streakDays}d` },
      { label: "Bookmarks", value: bookmarkedIds.length },
      { label: "Searches", value: searchHistory.length },
    ],
    [bookmarkedIds.length, searchHistory.length, solvedCount, streakDays]
  );

  useEffect(() => {
    if (!hydratedFromServer) return;

    const timeout = setTimeout(() => {
      setSyncStatus("saving");
      postJson("/dashboard-state", { state: dashboardSnapshot })
        .then((document) => {
          setLastSyncedAt(document?.updatedAt || new Date().toISOString());
          setSyncStatus("synced");
        })
        .catch(() => {
          setSyncStatus("offline");
        });
    }, 500);

    return () => clearTimeout(timeout);
  }, [dashboardSnapshot, hydratedFromServer]);

  function hydrateDashboardState(state) {
    if (!state || typeof state !== "object") return;

    if (typeof state.search === "string") setSearch(state.search);
    if (typeof state.difficulty === "string") setDifficulty(state.difficulty);
    if (typeof state.sort === "string") setSort(state.sort);
    if (Array.isArray(state.selectedTopics)) setSelectedTopics(state.selectedTopics);
    if (typeof state.selectedProblemId === "string") setSelectedProblemId(state.selectedProblemId);
    if (Array.isArray(state.bookmarks)) setBookmarkedIds(state.bookmarks);
    if (Array.isArray(state.searchHistory)) setSearchHistory(state.searchHistory);
    if (typeof state.theme === "string") setTheme(state.theme);
    if (state.contestTracker) setContestTracker({ ...DEFAULT_CONTEST_TRACKER, ...state.contestTracker });
    if (state.planner) setPlanner({ ...DEFAULT_PLANNER, ...state.planner });
    if (Array.isArray(state.collections)) setCollections(state.collections);
    if (Array.isArray(state.reviewQueue)) setReviewQueue(state.reviewQueue);
    if (Array.isArray(state.codeHistory)) setCodeHistory(state.codeHistory);
    if (state.interviewMode) setInterviewMode({ ...DEFAULT_INTERVIEW_MODE, ...state.interviewMode });
  }

  function toggleTopic(topic) {
    setSelectedTopics((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : [...current, topic]
    );
  }

  function toggleBookmark(problemId) {
    setBookmarkedIds((current) =>
      current.includes(problemId)
        ? current.filter((item) => item !== problemId)
        : [problemId, ...current]
    );
  }

  function selectBookmark(problemId) {
    setSelectedProblemId(problemId);
  }

  function updateContestTracker(field, value) {
    setContestTracker((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updatePlanner(field, value) {
    setPlanner((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addCollection() {
    const name = collectionName.trim();
    if (!name) return;

    setCollections((current) => {
      if (current.some((collection) => collection.name.toLowerCase() === name.toLowerCase())) {
        return current;
      }

      return [
        ...current,
        {
          id: createId("collection"),
          name,
          problemIds: [],
        },
      ];
    });
    setCollectionName("");
  }

  function addProblemToCollection(problemId, collectionId) {
    setCollections((current) =>
      current.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              problemIds: dedupeRecent(collection.problemIds || [], problemId).reverse(),
            }
          : collection
      )
    );
  }

  function removeProblemFromCollection(problemId, collectionId) {
    setCollections((current) =>
      current.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              problemIds: (collection.problemIds || []).filter((item) => item !== problemId),
            }
          : collection
      )
    );
  }

  function addToReviewQueue(problemId, reason = "Needs another pass") {
    setReviewQueue((current) => {
      const filtered = current.filter((entry) => entry.problemId !== problemId);
      return [
        {
          id: createId("review"),
          problemId,
          reason,
          createdAt: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 16);
    });
  }

  function removeFromReviewQueue(problemId) {
    setReviewQueue((current) => current.filter((entry) => entry.problemId !== problemId));
  }

  function saveCodeSnapshot() {
    if (!selectedProblem) return;

    setCodeHistory((current) => [
      {
        id: createId("code"),
        problemId: selectedProblem.id,
        title: selectedProblem.title,
        code: detail?.code || "",
        savedAt: new Date().toISOString(),
      },
      ...current.filter((entry) => entry.problemId !== selectedProblem.id),
    ].slice(0, 12));
  }

  function startInterviewMode() {
    setInterviewMode((current) => ({
      ...current,
      active: true,
    }));
  }

  function stopInterviewMode() {
    setInterviewMode((current) => ({
      ...current,
      active: false,
    }));
  }

  function exportSnapshot() {
    const snapshot = buildSnapshot({
      bookmarks: bookmarkedIds,
      searchHistory,
      theme,
      contestTracker,
      planner,
      collections,
      reviewQueue,
      codeHistory,
      interviewMode,
    });
    setSnapshotText(snapshot);

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(snapshot).catch(() => {});
    }
  }

  function syncNow() {
    setSyncStatus("saving");
    postJson("/dashboard-state", { state: dashboardSnapshot })
      .then((document) => {
        setLastSyncedAt(document?.updatedAt || new Date().toISOString());
        setSyncStatus("synced");
      })
      .catch(() => {
        setSyncStatus("offline");
      });
  }

  function importSnapshot() {
    if (!snapshotText.trim()) return;

    try {
      const parsed = JSON.parse(snapshotText);
      if (Array.isArray(parsed.bookmarks)) setBookmarkedIds(parsed.bookmarks);
      if (Array.isArray(parsed.searchHistory)) setSearchHistory(parsed.searchHistory);
      if (parsed.theme) setTheme(parsed.theme);
      if (parsed.contestTracker) setContestTracker({ ...DEFAULT_CONTEST_TRACKER, ...parsed.contestTracker });
      if (parsed.planner) setPlanner({ ...DEFAULT_PLANNER, ...parsed.planner });
      if (Array.isArray(parsed.collections)) setCollections(parsed.collections);
      if (Array.isArray(parsed.reviewQueue)) setReviewQueue(parsed.reviewQueue);
      if (Array.isArray(parsed.codeHistory)) setCodeHistory(parsed.codeHistory);
      if (parsed.interviewMode) setInterviewMode({ ...DEFAULT_INTERVIEW_MODE, ...parsed.interviewMode });
    } catch (error) {
      setError("Snapshot JSON could not be parsed.");
    }
  }

  function focusSearch() {
    searchRef.current?.focus();
  }

  function scrollToRecent() {
    recentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToDetail() {
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToActivity() {
    activityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = theme;
    }
    writeStoredJson(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.bookmarks, bookmarkedIds);
  }, [bookmarkedIds]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.searchHistory, searchHistory);
  }, [searchHistory]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.contestTracker, contestTracker);
  }, [contestTracker]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.planner, planner);
  }, [planner]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.collections, collections);
  }, [collections]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.reviewQueue, reviewQueue);
  }, [reviewQueue]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.codeHistory, codeHistory);
  }, [codeHistory]);

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.interviewMode, interviewMode);
  }, [interviewMode]);

  const selectedDifficulty = getDifficultyMeta(selectedProblem?.difficulty);

  return (
    <div className="lc-home relative flex min-h-[calc(100vh-2rem)] flex-col gap-5 pb-24 lg:gap-6 md:pb-8">
      <aside className="glass-sidebar fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-3 md:bottom-6 md:left-4 md:translate-x-0 md:flex-col md:items-stretch md:px-2 md:py-2">
        <SidebarButton title="Home" active onClick={scrollToRecent}>
          <IconHome className="h-4 w-4" />
        </SidebarButton>
        <SidebarButton title="Search" onClick={focusSearch}>
          <IconSearch className="h-4 w-4" />
        </SidebarButton>
        <SidebarButton title="Bookmarks" onClick={scrollToRecent}>
          <IconBookmark className="h-4 w-4" />
        </SidebarButton>
        <SidebarButton title="Settings" onClick={scrollToActivity}>
          <IconSettings className="h-4 w-4" />
        </SidebarButton>
        <SidebarButton title="Profile" onClick={scrollToDetail}>
          <IconProfile className="h-4 w-4" />
        </SidebarButton>
        <a href="/gfg" title="GFG" className="glass-icon-button flex items-center justify-center">
          <IconGfg className="h-4 w-4" />
        </a>
      </aside>

      <main className="glass-shell relative mx-auto w-full max-w-[1600px] overflow-hidden p-4 pb-28 sm:p-6 md:pl-24 lg:p-7 lg:pb-7 xl:p-8">
        <div className="grid gap-5 lg:gap-6 lg:grid-cols-[1.3fr_0.85fr]">
          <section className="glass-card flex flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/55">Your Progress</p>
                <h1 className="mt-3 font-display text-3xl text-white sm:text-4xl">
                  {formatGreetingHour()}, Manish
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                  Track solved LeetCode problems, review your recent momentum, and keep the archive warm.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-3 py-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/10 text-sm font-semibold text-white">
                  MG
                </div>
                <button type="button" className="glass-icon-button h-10 w-10">
                  <IconBell className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-white/62">
              <span>{loading ? "Loading questions..." : `${stats?.total || problems.length} problems synced`}</span>
              <span>{formatLongDate(new Date())}</span>
            </div>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="glass-card flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Streak</p>
                    <h2 className="mt-2 font-display text-2xl text-white">{streakDays} days</h2>
                  </div>
                  <span className="text-2xl">🔥</span>
                </div>
                <p className="text-sm text-white/68">Archive activity based on your most recent problem updates.</p>
              </div>

              <div className="glass-card flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Today&apos;s Goal</p>
                    <h2 className="mt-2 font-display text-2xl text-white">
                      {todaySolved} / {DAILY_GOAL} solved
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70">
                    Warm pace
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(243,211,178,0.92),rgba(196,148,97,0.88))]"
                    style={{ width: `${Math.min(100, (todaySolved / DAILY_GOAL) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-white/68">Recent submissions and refreshes mapped to the latest activity window.</p>
              </div>

              <DifficultyChart stats={stats} />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="glass-card grid gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Profile Summary</p>
                    <h2 className="mt-2 font-display text-2xl text-white">Workspace overview</h2>
                  </div>
                  <span className="glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/74">
                    {theme}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {profileSummary.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-white/48">{item.label}</p>
                      <p className="mt-2 font-display text-xl text-white">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/70">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>GitHub sync status: {syncRate}% of the repo cache is marked solved.</span>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-white/55">
                      {syncStatus}
                      {lastSyncedAt ? ` · ${formatLongDate(lastSyncedAt)}` : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-card grid gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Next Review</p>
                    <h2 className="mt-2 font-display text-2xl text-white">Suggested problem</h2>
                  </div>
                  <span className="text-sm text-white/60">{nextProblem ? `#${nextProblem.number}` : "—"}</span>
                </div>

                {nextProblem ? (
                  <button
                    type="button"
                    onClick={() => setSelectedProblemId(nextProblem.id)}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-left transition hover:bg-white/[0.1]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg text-white">{nextProblem.title}</h3>
                        <p className="mt-1 text-xs text-white/58">Open this as your next review target.</p>
                      </div>
                      <span className={`glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] is-${getDifficultyMeta(nextProblem.difficulty).key}`}>
                        {getDifficultyMeta(nextProblem.difficulty).label}
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-sm text-white/66">
                    No review target available yet.
                  </div>
                )}

                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Theme Switcher</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {THEME_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTheme(option.value)}
                        className={`glass-chip rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                          theme === option.value ? "is-active" : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Bookmarks</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {bookmarkedProblems.length ? (
                      bookmarkedProblems.map((problem) => (
                        <button
                          key={problem.id}
                          type="button"
                          onClick={() => selectBookmark(problem.id)}
                          className="glass-pill px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/74"
                        >
                          {problem.title}
                        </button>
                      ))
                    ) : (
                      <span className="text-sm text-white/60">Bookmark a problem from the detail panel.</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </section>

          <div className="grid gap-5 lg:gap-6">
            <section className="glass-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Controls</p>
                  <h2 className="mt-2 font-display text-2xl text-white">Search & Filter</h2>
                </div>
                <span className="glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/72">
                  {problems.length} items
                </span>
              </div>

              <div className="mt-5 grid gap-4">
                <input
                  ref={searchRef}
                  className="glass-input w-full rounded-full px-4 py-3 text-sm outline-none placeholder:text-white/48"
                  placeholder="Search by number or title"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "easy", label: "Easy" },
                    { value: "medium", label: "Medium" },
                    { value: "hard", label: "Hard" },
                    { value: "unspecified", label: "Unspecified" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDifficulty(option.value)}
                      className={`glass-chip rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                        difficulty === option.value ? "is-active" : ""
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select
                    className="glass-select rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                  >
                    <option value="updated-desc">Updated (newest)</option>
                    <option value="updated-asc">Updated (oldest)</option>
                    <option value="number-asc">Number (asc)</option>
                    <option value="number-desc">Number (desc)</option>
                    <option value="title-asc">Title (A-Z)</option>
                    <option value="title-desc">Title (Z-A)</option>
                  </select>

                  {selectedTopics.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTopics([])}
                      className="glass-button rounded-full px-4 py-3 text-xs uppercase tracking-[0.22em]"
                    >
                      Clear topics
                    </button>
                  )}
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Search History</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {searchHistory.length ? (
                      searchHistory.map((entry) => (
                        <button
                          key={entry}
                          type="button"
                          onClick={() => setSearch(entry)}
                          className="glass-pill px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/74"
                        >
                          {entry}
                        </button>
                      ))
                    ) : (
                      <span className="text-sm text-white/55">Your recent searches will appear here.</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/52">Topics</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {topicList.length === 0 && <span className="text-sm text-white/55">No topics yet.</span>}
                    {topicList.map((topic) => {
                      const active = selectedTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggleTopic(topic)}
                          className={`glass-chip rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                            active ? "is-active" : ""
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="glass-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Contest Tracker</p>
                  <h2 className="mt-2 font-display text-2xl text-white">Manual stats</h2>
                </div>
                <span className="glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/72">
                  local only
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/52">
                  Rating
                  <input
                    type="number"
                    className="glass-input rounded-full px-4 py-3 text-sm normal-case tracking-normal"
                    placeholder="e.g. 1620"
                    value={contestTracker.rating}
                    onChange={(event) => updateContestTracker("rating", event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/52">
                  Best Rank
                  <input
                    type="text"
                    className="glass-input rounded-full px-4 py-3 text-sm normal-case tracking-normal"
                    placeholder="e.g. 182"
                    value={contestTracker.bestRank}
                    onChange={(event) => updateContestTracker("bestRank", event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/52">
                  Contests
                  <input
                    type="number"
                    className="glass-input rounded-full px-4 py-3 text-sm normal-case tracking-normal"
                    placeholder="e.g. 14"
                    value={contestTracker.contests}
                    onChange={(event) => updateContestTracker("contests", event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/52">
                  Last Contest
                  <input
                    type="date"
                    className="glass-input rounded-full px-4 py-3 text-sm normal-case tracking-normal"
                    value={contestTracker.lastContest}
                    onChange={(event) => updateContestTracker("lastContest", event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="glass-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Recent Problems</p>
                  <h2 className="mt-2 font-display text-2xl text-white">Latest solved entries</h2>
                </div>
                <span className="text-sm text-white/62">{loading ? "Refreshing..." : `${problems.length} loaded`}</span>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-white/12 bg-[rgba(125,70,42,0.25)] px-4 py-3 text-sm text-white/88">
                  {error}
                </div>
              )}

              <div ref={recentRef} className="glass-scrollbar mt-4 max-h-[36rem] space-y-3 overflow-y-auto pr-1">
                {sortedRecentProblems.map((problem) => {
                  const { key: difficultyKey, label } = getDifficultyMeta(problem.difficulty);
                  const isActive = problem.id === selectedProblemId;
                  const solved = (problem.status || "").toLowerCase() === "solved";

                  return (
                    <button
                      key={problem.id}
                      type="button"
                      onClick={() => setSelectedProblemId(problem.id)}
                      className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                        isActive
                          ? "border-white/20 bg-white/12 shadow-[0_12px_36px_rgba(16,10,6,0.18)]"
                          : "border-white/10 bg-white/[0.06] hover:bg-white/[0.1]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] uppercase tracking-[0.28em] text-white/46">#{problem.number}</span>
                            <h3 className="truncate font-display text-base text-white sm:text-lg">{problem.title}</h3>
                          </div>
                          <p className="mt-1 text-xs text-white/55">Last attempted {formatDate(problem.lastUpdated)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/68">
                            {bookmarkedIds.includes(problem.id) ? "Bookmarked" : "Review"}
                          </span>
                          <span className={`glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] is-${difficultyKey}`}>
                            {label}
                          </span>
                          <span className={`lc-status ${solved ? "is-solved" : ""}`}>{solved ? "✓" : "⌛"}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {!loading && problems.length === 0 && !error && (
                  <div className="rounded-[22px] border border-white/10 bg-white/6 px-5 py-6 text-center text-sm text-white/64">
                    No matches. Try clearing filters or adding topics.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <section ref={detailRef} className="mt-5 grid gap-5 lg:gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="glass-card p-4 sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Problem Detail</p>
                <h2 className="mt-2 font-display text-2xl text-white">
                  {selectedProblem?.title || "Select a problem"}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/64">
                  <span>#{selectedProblem?.number || "—"}</span>
                  <span className={`glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] is-${selectedDifficulty.key}`}>
                    {selectedDifficulty.label}
                  </span>
                  <span>{selectedProblem?.lastUpdated ? formatLongDate(selectedProblem.lastUpdated) : "No date"}</span>
                </div>
              </div>

              <Link
                to={selectedProblem ? `/problem/${selectedProblem.id}` : "/"}
                className="glass-button rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em]"
              >
                Open full page
              </Link>
              {selectedProblem && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleBookmark(selectedProblem.id)}
                    className="glass-button rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em]"
                  >
                    {bookmarkedIds.includes(selectedProblem.id) ? "Remove bookmark" : "Bookmark"}
                  </button>
                  <button
                    type="button"
                    onClick={saveCodeSnapshot}
                    className="glass-button rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em]"
                  >
                    Save code
                  </button>
                  <button
                    type="button"
                    onClick={() => addToReviewQueue(selectedProblem.id)}
                    className="glass-button rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em]"
                  >
                    Queue review
                  </button>
                </div>
              )}
            </div>

            <div className="glass-scrollbar mt-5 grid gap-5">
              {detailLoading ? (
                <div className="rounded-[22px] border border-white/10 bg-white/6 p-6 text-sm text-white/68">
                  Loading preview...
                </div>
              ) : (
                <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-5">
                  <div className="prose prose-invert lc-prose max-w-none text-sm leading-relaxed">
                    {detail?.description ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                        components={{
                          code({ inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            if (!inline && match) {
                              return (
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-2xl border border-white/10 bg-[rgba(10,10,12,0.72)] p-4 text-xs"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              );
                            }

                            return (
                              <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.82em] text-white" {...props}>
                                {children}
                              </code>
                            );
                          },
                          pre({ children }) {
                            return <>{children}</>;
                          },
                        }}
                      >
                        {detail.description}
                      </ReactMarkdown>
                    ) : (
                      <div className="text-white/64">Problem description will appear here.</div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-[22px] border border-white/10 bg-[rgba(18,11,8,0.42)] p-4">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <h3 className="font-display text-lg text-white">Code Preview</h3>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-white/50">C++17</span>
                </div>
                <div className="glass-scrollbar mt-4 max-h-[26rem] overflow-auto rounded-2xl border border-white/10 bg-[rgba(8,8,10,0.66)] p-4">
                  {detail?.code ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language="cpp"
                      PreTag="div"
                      className="!m-0 !bg-transparent !p-0 text-xs"
                    >
                      {detail.code}
                    </SyntaxHighlighter>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm text-white/70">No code available for this problem.</pre>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="glass-card p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Complexity</p>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                  <span className="block text-[10px] uppercase tracking-[0.22em] text-white/48">Time</span>
                  <span className="mt-1 block text-white/86">{notes?.timeComplexity || "Add a time complexity note"}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                  <span className="block text-[10px] uppercase tracking-[0.22em] text-white/48">Space</span>
                  <span className="mt-1 block text-white/86">{notes?.spaceComplexity || "Add a space complexity note"}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                  <span className="block text-[10px] uppercase tracking-[0.22em] text-white/48">Solution Notes</span>
                  <span className="mt-1 block text-white/86">{notes?.solutionNotes || "Use this space for your concise approach summary."}</span>
                </div>
              </div>
            </div>

            <div ref={activityRef} className="glass-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Weekly Activity</p>
                  <h3 className="mt-2 font-display text-2xl text-white">Heatmap</h3>
                </div>
                <span className="text-xs uppercase tracking-[0.22em] text-white/56">Warm amber</span>
              </div>

              <div className="mt-5 grid grid-cols-7 gap-2">
                {weeklyActivity.map((cell) => (
                  <div
                    key={cell.key}
                    title={`${cell.key}: ${cell.count} updates`}
                    className={`lc-heat-cell aspect-square ${cell.count ? `level-${getHeatLevel(cell.count)}` : ""}`}
                  />
                ))}
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Category Tags</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {topTags.length ? (
                  topTags.map((topic) => (
                    <span key={topic} className="glass-pill px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/74">
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-white/60">Add topics to your problem metadata.</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="grid gap-5">
            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Smart Practice Planner</p>
                  <h3 className="mt-2 font-display text-2xl text-white">Build today&apos;s queue</h3>
                </div>
                <span className="glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/72">
                  {plannedQueue.length} picks
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/52">
                  Focus topics
                  <input
                    className="glass-input rounded-full px-4 py-3 text-sm normal-case tracking-normal"
                    placeholder="array, dp, graph"
                    value={planner.focus}
                    onChange={(event) => updatePlanner("focus", event.target.value)}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/52">
                    Minutes
                    <input
                      type="number"
                      className="glass-input rounded-full px-4 py-3 text-sm normal-case tracking-normal"
                      value={planner.minutes}
                      onChange={(event) => updatePlanner("minutes", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/52">
                    Due date
                    <input
                      type="date"
                      className="glass-input rounded-full px-4 py-3 text-sm normal-case tracking-normal"
                      value={planner.dueDate}
                      onChange={(event) => updatePlanner("dueDate", event.target.value)}
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/52">
                  Notes
                  <textarea
                    rows={3}
                    className="glass-input rounded-[22px] px-4 py-3 text-sm normal-case tracking-normal"
                    placeholder="What should the session emphasize?"
                    value={planner.notes}
                    onChange={(event) => updatePlanner("notes", event.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 space-y-2">
                {plannedQueue.length ? (
                  plannedQueue.map((problem) => (
                    <button
                      key={problem.id}
                      type="button"
                      onClick={() => setSelectedProblemId(problem.id)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left"
                    >
                      <span className="truncate text-sm text-white">{problem.title}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/52">#{problem.number}</span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/62">
                    Pick a topic focus to generate a queue.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Mistake Review Board</p>
                  <h3 className="mt-2 font-display text-2xl text-white">Retry queue</h3>
                </div>
                <span className="glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/72">
                  {activeReviewQueue.length}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {activeReviewQueue.length ? (
                  activeReviewQueue.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <button type="button" onClick={() => setSelectedProblemId(entry.problem.id)} className="text-left">
                          <div className="text-sm font-medium text-white">{entry.problem.title}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/52">{entry.reason}</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromReviewQueue(entry.problemId)}
                          className="glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/62">
                    Queue missed or hard problems here for spaced repetition.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Custom Collections</p>
                  <h3 className="mt-2 font-display text-2xl text-white">Study folders</h3>
                </div>
                <span className="glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/72">
                  {activeCollections.length}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  className="glass-input min-w-0 flex-1 rounded-full px-4 py-3 text-sm"
                  placeholder="Create a new folder"
                  value={collectionName}
                  onChange={(event) => setCollectionName(event.target.value)}
                />
                <button type="button" onClick={addCollection} className="glass-button rounded-full px-4 py-3 text-xs uppercase tracking-[0.22em]">
                  Add
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {activeCollections.length ? (
                  activeCollections.map((collection) => (
                    <div key={collection.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-display text-lg text-white">{collection.name}</h4>
                          <p className="text-xs text-white/55">{collection.items.length} problems saved</p>
                        </div>
                        {selectedProblem && (
                          <button
                            type="button"
                            onClick={() => addProblemToCollection(selectedProblem.id, collection.id)}
                            className="glass-pill px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/74"
                          >
                            Pin current
                          </button>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {collection.items.length ? (
                          collection.items.map((problem) => (
                            <button
                              key={problem.id}
                              type="button"
                              onClick={() => removeProblemFromCollection(problem.id, collection.id)}
                              className="glass-pill px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/74"
                            >
                              {problem.title}
                            </button>
                          ))
                        ) : (
                          <span className="text-sm text-white/60">Use the current problem to seed this folder.</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/62">
                    Create a folder to organize interview prep or topic sets.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Code History</p>
                  <h3 className="mt-2 font-display text-2xl text-white">Accepted snapshots</h3>
                </div>
                <span className="glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/72">
                  {latestCodeHistory.length}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {latestCodeHistory.length ? (
                  latestCodeHistory.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedProblemId(entry.problemId)}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left"
                    >
                      <div className="text-sm font-medium text-white">{entry.title}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/52">
                        Saved {formatLongDate(entry.savedAt)}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/62">
                    Save a code snapshot from the detail panel.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Interview Mode</p>
                  <h3 className="mt-2 font-display text-2xl text-white">Timed mock session</h3>
                </div>
                <span className={`glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${interviewMode.active ? "is-hard" : ""}`}>
                  {interviewMode.active ? "Running" : "Ready"}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/52">
                    Company
                    <input
                      className="glass-input rounded-full px-4 py-3 text-sm normal-case tracking-normal"
                      placeholder="Google, Meta, Stripe"
                      value={interviewMode.company}
                      onChange={(event) => setInterviewMode((current) => ({ ...current, company: event.target.value }))}
                    />
                  </label>
                  <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/52">
                    Duration
                    <input
                      type="number"
                      className="glass-input rounded-full px-4 py-3 text-sm normal-case tracking-normal"
                      value={interviewMode.duration}
                      onChange={(event) => setInterviewMode((current) => ({ ...current, duration: event.target.value }))}
                    />
                  </label>
                </div>

                <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/52">
                  Focus topic
                  <select
                    className="glass-select rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
                    value={interviewMode.focusTopic}
                    onChange={(event) => setInterviewMode((current) => ({ ...current, focusTopic: event.target.value }))}
                  >
                    <option value="">Use your current filters</option>
                    {topicList.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={startInterviewMode} className="glass-button rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em]">
                  Start session
                </button>
                <button type="button" onClick={stopInterviewMode} className="glass-button rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em]">
                  Stop session
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {interviewQueue.length ? (
                  interviewQueue.map((problem, index) => (
                    <button
                      key={problem.id}
                      type="button"
                      onClick={() => setSelectedProblemId(problem.id)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-left"
                    >
                      <span className="text-sm text-white">{index + 1}. {problem.title}</span>
                      <span className={`glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.2em] is-${getDifficultyMeta(problem.difficulty).key}`}>
                        {getDifficultyMeta(problem.difficulty).label}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/62">
                    Add a focus topic to generate a mock interview set.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Export & Import</p>
                  <h3 className="mt-2 font-display text-2xl text-white">Workspace snapshot</h3>
                </div>
                <button type="button" onClick={exportSnapshot} className="glass-button rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em]">
                  Export
                </button>
                <button type="button" onClick={syncNow} className="glass-button rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em]">
                  Sync now
                </button>
              </div>

              <textarea
                rows={10}
                className="glass-input mt-4 w-full rounded-[22px] px-4 py-3 text-xs leading-6"
                placeholder="Paste a snapshot here to restore your workspace state."
                value={snapshotText}
                onChange={(event) => setSnapshotText(event.target.value)}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={importSnapshot} className="glass-button rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em]">
                  Import
                </button>
                <button type="button" onClick={() => setSnapshotText(buildSnapshot({ bookmarks: bookmarkedIds, searchHistory, theme, contestTracker, planner, collections, reviewQueue, codeHistory, interviewMode }))} className="glass-button rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em]">
                  Refresh JSON
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
