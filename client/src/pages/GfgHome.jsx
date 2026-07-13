import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { fetchJson } from "../utils/api.js";
import { BG_OPTIONS, useBg } from "../App.jsx";

const difficultyLabels = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  unspecified: "Unspecified",
};

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeDifficulty(value) {
  const v = (value || "").toLowerCase();
  if (v === "easy" || v === "medium" || v === "hard") return v;
  return "unspecified";
}

export default function GfgHome() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [sort, setSort] = useState("updated-desc");
  const [selectedId, setSelectedId] = useState(null);
  const { bgIndex, setBgIndex } = useBg();
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchJson("/gfg");
        if (!cancelled) {
          setProblems(data.items || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load GFG problems.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const topicList = useMemo(() => {
    const set = new Set();
    problems.forEach((p) => (p.topics || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [problems]);

  const filteredProblems = useMemo(() => {
    let result = [...problems];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }
    if (difficulty !== "all") {
      result = result.filter(
        (p) => normalizeDifficulty(p.difficulty) === difficulty
      );
    }
    if (sort) {
      result.sort((a, b) => {
        switch (sort) {
          case "title-asc": return a.title.localeCompare(b.title);
          case "title-desc": return b.title.localeCompare(a.title);
          case "updated-desc": return (b.lastUpdated || "").localeCompare(a.lastUpdated || "");
          case "updated-asc": return (a.lastUpdated || "").localeCompare(b.lastUpdated || "");
          default: return a.title.localeCompare(b.title);
        }
      });
    }
    return result;
  }, [problems, search, difficulty, sort]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let cancelled = false;
    async function loadDetail() {
      setDetailLoading(true);
      try {
        const data = await fetchJson(`/gfg/${selectedId}`);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    loadDetail();
    return () => { cancelled = true; };
  }, [selectedId]);

  const stats = useMemo(() => {
    const byDiff = { easy: 0, medium: 0, hard: 0, unspecified: 0 };
    problems.forEach((p) => {
      const d = normalizeDifficulty(p.difficulty);
      byDiff[d] = (byDiff[d] || 0) + 1;
    });
    return { total: problems.length, byDiff };
  }, [problems]);

  return (
    <div className="grid gap-5 lg:gap-6">
      <button
        type="button"
        title={`Background: ${BG_OPTIONS[bgIndex].label}`}
        onClick={() => setBgIndex((i) => (i + 1) % BG_OPTIONS.length)}
        className="fixed bottom-6 right-6 z-20 glass-icon-button flex h-10 w-10 items-center justify-center"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </button>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 sm:px-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30"
          >
            LeetCode
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">GeeksforGeeks</p>
            <h1 className="mt-1 font-display text-2xl text-ivory sm:text-3xl">GFG Dashboard</h1>
            <p className="mt-1 text-sm text-white/60">{stats.total} problems solved</p>
          </div>
        </div>
        <div className="flex gap-2">
          {Object.entries(stats.byDiff).filter(([, v]) => v > 0).map(([k, v]) => (
            <span key={k} className={`glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] is-${k}`}>
              {v} {difficultyLabels[k]}
            </span>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.85fr]">
        {/* Left: Problem List */}
        <div className="glass-card flex flex-col gap-4 p-4 sm:p-6">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="glass-input flex-1 rounded-full px-4 py-3 text-sm"
              placeholder="Search GFG problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="glass-select rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="all">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              className="glass-select rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="updated-desc">Updated (newest)</option>
              <option value="updated-asc">Updated (oldest)</option>
            </select>
          </div>

          {/* Problem List */}
          <div className="glass-scrollbar max-h-[42rem] space-y-3 overflow-y-auto pr-1">
            {loading && (
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-6 text-center text-sm text-white/68">
                Loading GFG problems...
              </div>
            )}
            {!loading && filteredProblems.length === 0 && (
              <div className="rounded-[22px] border border-white/10 bg-white/6 p-6 text-center text-sm text-white/68">
                No GFG problems found. {error && `(${error})`}
              </div>
            )}
            {filteredProblems.map((problem) => {
              const dk = normalizeDifficulty(problem.difficulty);
              const isActive = problem.id === selectedId;
              return (
                <button
                  key={problem.id}
                  type="button"
                  onClick={() => setSelectedId(problem.id)}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-white/20 bg-white/12 shadow-[0_12px_36px_rgba(16,10,6,0.18)]"
                      : "border-white/10 bg-white/[0.06] hover:bg-white/[0.1]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base text-white sm:text-lg">{problem.title}</h3>
                      <p className="mt-1 text-xs text-white/55">{formatDate(problem.lastUpdated)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {problem.companies && problem.companies.length > 0 && (
                        <span className="glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/55">
                          {problem.companies.slice(0, 2).join(", ")}
                        </span>
                      )}
                      <span className={`glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] is-${dk}`}>
                        {difficultyLabels[dk]}
                      </span>
                    </div>
                  </div>
                  {problem.topics && problem.topics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {problem.topics.slice(0, 4).map((t) => (
                        <span key={t} className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white/45">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detail Preview */}
        <div className="glass-card flex flex-col gap-4 p-4 sm:p-6">
          {!selectedId && (
            <div className="flex flex-1 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/45">
              Select a problem to preview
            </div>
          )}
          {selectedId && detailLoading && (
            <div className="rounded-[22px] border border-white/10 bg-white/6 p-6 text-sm text-white/68">
              Loading preview...
            </div>
          )}
          {selectedId && !detailLoading && detail && (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/55">Problem Detail</p>
                <h2 className="mt-2 font-display text-xl text-white">{detail.problem.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/64">
                  <span className={`glass-pill px-3 py-1 text-[10px] uppercase tracking-[0.22em] is-${normalizeDifficulty(detail.problem.difficulty)}`}>
                    {difficultyLabels[normalizeDifficulty(detail.problem.difficulty)]}
                  </span>
                  <span>{formatDate(detail.problem.lastUpdated)}</span>
                </div>
                {detail.problem.companies && detail.problem.companies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {detail.problem.companies.map((c) => (
                      <span key={c} className="rounded-full border border-sky/30 bg-sky/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-sky">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-scrollbar max-h-[26rem] overflow-auto rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                {detail.description ? (
                  <div className="prose prose-invert lc-prose max-w-none text-sm leading-relaxed text-white/85">
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
                                className="rounded-2xl border border-white/10 bg-black/60 p-4 text-xs"
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
                  </div>
                ) : (
                  <p className="text-sm text-white/50">No description available.</p>
                )}
              </div>

              {detail.code && (
                <div className="rounded-[22px] border border-white/10 bg-[rgba(18,11,8,0.42)] p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <h3 className="font-display text-lg text-white">Solution Code</h3>
                    <span className="text-[10px] uppercase tracking-[0.24em] text-white/50">C++</span>
                  </div>
                  <div className="glass-scrollbar mt-4 max-h-[20rem] overflow-auto rounded-2xl border border-white/10 bg-[rgba(8,8,10,0.66)] p-4">
                    <SyntaxHighlighter
                      style={oneDark}
                      language="cpp"
                      PreTag="div"
                      className="!m-0 !bg-transparent !p-0 text-xs"
                    >
                      {detail.code}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )}
            </>
          )}
          {selectedId && !detailLoading && !detail && (
            <div className="rounded-[22px] border border-white/10 bg-white/6 p-6 text-sm text-white/68">
              Failed to load problem details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
