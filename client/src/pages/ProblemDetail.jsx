import { useEffect, useMemo, useRef, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Link, useParams } from "react-router-dom";
import { fetchJson, postJson } from "../utils/api.js";

export default function ProblemDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyPoints, setKeyPoints] = useState([]);
  const [newPoint, setNewPoint] = useState("");
  const [savingPoints, setSavingPoints] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, hints, complexity, cases, snippets, notes
  const [saving, setSaving] = useState(false);

  // Enhanced notes
  const [notes, setNotes] = useState({
    hints: [],
    algorithm: "",
    timeComplexity: "",
    spaceComplexity: "",
    edgeCases: [],
    codeSnippets: [],
    solutionNotes: "",
    relatedProblems: "",
    practiceCount: 0,
    lastPracticed: null,
    difficulty: "",
  });

  const [newHint, setNewHint] = useState("");
  const [newEdgeCase, setNewEdgeCase] = useState("");
  const [snippetTitle, setSnippetTitle] = useState("");
  const [snippetCode, setSnippetCode] = useState("");
  const [snippetLang, setSnippetLang] = useState("cpp");

  const splitRef = useRef(null);

  const markdownComponents = useMemo(
    () => ({
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
          <code
            className="rounded bg-white/10 px-1.5 py-0.5 text-[0.8em] text-ivory"
            {...props}
          >
            {children}
          </code>
        );
      },
      pre({ children }) {
        return <>{children}</>;
      },
    }),
    []
  );

  useEffect(() => {
    function handleResize() {
      setIsDesktopLayout(window.innerWidth >= 1024);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchJson(`/problem/${id}`);
        setDetail(data);
        setCode(data.code || "");

        // Load key points
        const pointsData = await fetchJson(`/keypoints/${id}`);
        setKeyPoints(pointsData.points || []);

        // Load problem notes
        const notesData = await fetchJson(`/problem-notes/${id}`);
        setNotes(notesData);
      } catch (err) {
        setError("Unable to load the problem.");
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [id]);

  async function addKeyPoint() {
    if (!newPoint.trim()) return;

    const updatedPoints = [...keyPoints, newPoint.trim()];
    setKeyPoints(updatedPoints);
    setNewPoint("");

    setSavingPoints(true);
    try {
      await postJson(`/keypoints/${id}`, { points: updatedPoints });
    } catch (err) {
      console.error("Failed to save key points:", err);
      setKeyPoints(keyPoints);
    } finally {
      setSavingPoints(false);
    }
  }

  function removeKeyPoint(index) {
    const updatedPoints = keyPoints.filter((_, i) => i !== index);
    setKeyPoints(updatedPoints);

    setSavingPoints(true);
    postJson(`/keypoints/${id}`, { points: updatedPoints })
      .catch((err) => {
        console.error("Failed to save key points:", err);
        setKeyPoints(keyPoints);
      })
      .finally(() => setSavingPoints(false));
  }

  async function saveNotes() {
    setSaving(true);
    try {
      await postJson(`/problem-notes/${id}`, notes);
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSaving(false);
    }
  }

  function addHint() {
    if (!newHint.trim()) return;
    const updated = { ...notes, hints: [...notes.hints, newHint.trim()] };
    setNotes(updated);
    setNewHint("");
  }

  function removeHint(index) {
    const updated = {
      ...notes,
      hints: notes.hints.filter((_, i) => i !== index),
    };
    setNotes(updated);
  }

  function addEdgeCase() {
    if (!newEdgeCase.trim()) return;
    const updated = {
      ...notes,
      edgeCases: [...notes.edgeCases, newEdgeCase.trim()],
    };
    setNotes(updated);
    setNewEdgeCase("");
  }

  function removeEdgeCase(index) {
    const updated = {
      ...notes,
      edgeCases: notes.edgeCases.filter((_, i) => i !== index),
    };
    setNotes(updated);
  }

  function addSnippet() {
    if (!snippetTitle.trim() || !snippetCode.trim()) return;
    const updated = {
      ...notes,
      codeSnippets: [
        ...notes.codeSnippets,
        { title: snippetTitle.trim(), code: snippetCode.trim(), language: snippetLang },
      ],
    };
    setNotes(updated);
    setSnippetTitle("");
    setSnippetCode("");
  }

  function removeSnippet(index) {
    const updated = {
      ...notes,
      codeSnippets: notes.codeSnippets.filter((_, i) => i !== index),
    };
    setNotes(updated);
  }

  async function recordPractice() {
    try {
      const result = await postJson(`/problem-notes/${id}/practice`, {});
      setNotes((prev) => ({
        ...prev,
        practiceCount: result.practiceCount,
        lastPracticed: result.lastPracticed,
      }));
    } catch (err) {
      console.error("Failed to record practice:", err);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/70">
        Loading problem...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-ember/40 bg-ember/10 p-8 text-ember">
        {error}
      </div>
    );
  }

  return (
    <div className="lc-page grid gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-800/90 px-3 py-3 sm:px-5 sm:py-4 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30"
          >
            Back
          </Link>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Problem
            </p>
            <h2 className="mt-1 truncate font-display text-xl text-ivory sm:text-2xl">
              {detail.problem.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/60">
              <span>#{detail.problem.number}</span>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/70">
                {detail.problem.difficulty || "Unspecified"}
              </span>
              <span className="rounded-full border border-jade/40 bg-jade/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-jade">
                Practiced: {notes.practiceCount}x
              </span>
              {notes.lastPracticed && (
                <span className="text-[10px] text-white/50">
                  Last: {new Date(notes.lastPracticed).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={recordPractice}
          className="w-full rounded-xl border border-sky/40 bg-sky/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sky transition hover:bg-sky/20 sm:w-auto"
        >
          Record Session
        </button>
      </div>

      {/* Main Split View */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
        {/* Left: Description */}
        <section className="lc-surface rounded-2xl">
          <div className="border-b border-white/10 px-4 py-3 sm:px-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              Description
            </p>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-4 sm:max-h-[600px] sm:p-6">
            <div className="prose prose-invert lc-prose max-w-none text-sm leading-relaxed text-white/85">
              {detail.description ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  components={markdownComponents}
                >
                  {detail.description}
                </ReactMarkdown>
              ) : (
                "No README.md found for this problem."
              )}
            </div>
          </div>
        </section>

        {/* Right: Code */}
        <section className="lc-surface rounded-2xl">
          <div className="border-b border-white/10 px-4 py-3 sm:px-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              Code (C++17)
            </p>
          </div>
          <div className="p-3 sm:p-4">
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] overflow-hidden">
              <MonacoEditor
                height={isDesktopLayout ? "500px" : "300px"}
                language="cpp"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 px-4 py-3" style={{ WebkitOverflowScrolling: "touch" }}>
        {[
          { id: "overview", label: "Key Points" },
          { id: "hints", label: "Hints" },
          { id: "complexity", label: "Complexity" },
          { id: "cases", label: "Edge Cases" },
          { id: "snippets", label: "Snippets" },
          { id: "notes", label: "Solution" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
              activeTab === tab.id
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="lc-surface rounded-2xl p-4 sm:p-6">
        {/* KEY POINTS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
                Key Points
              </h3>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="Add a key point or insight..."
                  value={newPoint}
                  onChange={(e) => setNewPoint(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") addKeyPoint();
                  }}
                  className="flex-1 rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-jade/60"
                />
                <button
                  onClick={addKeyPoint}
                  disabled={!newPoint.trim() || savingPoints}
                  className="rounded-xl border border-jade/40 bg-jade/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-jade transition hover:bg-jade/20 disabled:opacity-50"
                >
                  {savingPoints ? "Saving..." : "Add"}
                </button>
              </div>

              {keyPoints.length === 0 ? (
                <p className="text-sm text-white/50">No key points yet.</p>
              ) : (
                <div className="space-y-2">
                  {keyPoints.map((point, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-zinc-900/40 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-jade/20 text-xs font-semibold text-jade">
                          {index + 1}
                        </span>
                        <p className="py-0.5 text-sm text-white/80">{point}</p>
                      </div>
                      <button
                        onClick={() => removeKeyPoint(index)}
                        className="shrink-0 text-white/50 transition hover:text-ember"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HINTS */}
        {activeTab === "hints" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
              Hints & Strategies
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="Add a hint or strategy..."
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") addHint();
                }}
                className="flex-1 rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-sky/60"
              />
              <button
                onClick={addHint}
                disabled={!newHint.trim()}
                className="rounded-xl border border-sky/40 bg-sky/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sky transition hover:bg-sky/20 disabled:opacity-50"
              >
                Add Hint
              </button>
            </div>

            {notes.hints.length === 0 ? (
              <p className="text-sm text-white/50">No hints saved yet.</p>
            ) : (
              <div className="space-y-2">
                {notes.hints.map((hint, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-3 rounded-xl border border-sky/20 bg-sky/5 p-3"
                  >
                    <p className="text-sm text-white/80">{hint}</p>
                    <button
                      onClick={() => removeHint(index)}
                      className="shrink-0 text-white/50 transition hover:text-ember"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMPLEXITY */}
        {activeTab === "complexity" && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-white/60">
                Algorithm / Approach
              </label>
              <input
                type="text"
                placeholder="e.g. BFS, DFS, Binary Search, Dynamic Programming..."
                value={notes.algorithm}
                onChange={(e) => setNotes({ ...notes, algorithm: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/30"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-white/60">
                  Time Complexity
                </label>
                <input
                  type="text"
                  placeholder="e.g. O(n log n)"
                  value={notes.timeComplexity}
                  onChange={(e) => setNotes({ ...notes, timeComplexity: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.2em] text-white/60">
                  Space Complexity
                </label>
                <input
                  type="text"
                  placeholder="e.g. O(n)"
                  value={notes.spaceComplexity}
                  onChange={(e) => setNotes({ ...notes, spaceComplexity: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-white/60">
                Your Difficulty Assessment
              </label>
              <select
                value={notes.difficulty}
                onChange={(e) => setNotes({ ...notes, difficulty: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-white/90 outline-none focus:border-white/30"
              >
                <option value="">Not rated</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="very-hard">Very Hard</option>
              </select>
            </div>
          </div>
        )}

        {/* EDGE CASES */}
        {activeTab === "cases" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
              Important Test Cases & Edge Cases
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="Add edge case description..."
                value={newEdgeCase}
                onChange={(e) => setNewEdgeCase(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") addEdgeCase();
                }}
                className="flex-1 rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-gold/60"
              />
              <button
                onClick={addEdgeCase}
                disabled={!newEdgeCase.trim()}
                className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-gold transition hover:bg-gold/20 disabled:opacity-50"
              >
                Add Case
              </button>
            </div>

            {notes.edgeCases.length === 0 ? (
              <p className="text-sm text-white/50">No edge cases documented yet.</p>
            ) : (
              <div className="space-y-2">
                {notes.edgeCases.map((testCase, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-3 rounded-xl border border-gold/20 bg-gold/5 p-3"
                  >
                    <p className="text-sm text-white/80">{testCase}</p>
                    <button
                      onClick={() => removeEdgeCase(index)}
                      className="shrink-0 text-white/50 transition hover:text-ember"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CODE SNIPPETS */}
        {activeTab === "snippets" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
                Useful Code Patterns & Snippets
              </h3>

              <div className="mb-6 space-y-3 rounded-xl border border-white/10 bg-zinc-900/40 p-4">
                <input
                  type="text"
                  placeholder="Snippet title (e.g. 'Two Pointer Technique')"
                  value={snippetTitle}
                  onChange={(e) => setSnippetTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/30"
                />

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Language (cpp, java, python...)"
                    value={snippetLang}
                    onChange={(e) => setSnippetLang(e.target.value)}
                    className="flex-1 rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/30"
                  />
                  <button
                    onClick={addSnippet}
                    disabled={!snippetTitle.trim() || !snippetCode.trim()}
                    className="rounded-lg border border-ember/40 bg-ember/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-ember transition hover:bg-ember/20 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>

                <textarea
                  placeholder="Paste code snippet..."
                  value={snippetCode}
                  onChange={(e) => setSnippetCode(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-900/70 px-3 py-2 font-mono text-xs text-white/90 outline-none placeholder:text-white/40 focus:border-white/30"
                  rows="4"
                />
              </div>

              {notes.codeSnippets.length === 0 ? (
                <p className="text-sm text-white/50">No snippets saved yet.</p>
              ) : (
                <div className="space-y-4">
                  {notes.codeSnippets.map((snippet, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-white/10 bg-zinc-900/40 p-4"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-white/90">{snippet.title}</h4>
                          <p className="text-xs text-white/50">{snippet.language}</p>
                        </div>
                        <button
                          onClick={() => removeSnippet(index)}
                          className="text-white/50 transition hover:text-ember"
                        >
                          ✕
                        </button>
                      </div>
                      <pre className="overflow-x-auto rounded-lg bg-black/50 p-3 font-mono text-xs text-white/80">
                        {snippet.code}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SOLUTION NOTES */}
        {activeTab === "notes" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
                Solution Explanation & Notes
              </h3>
              <textarea
                placeholder="Write detailed solution explanation, step-by-step approach, important observations..."
                value={notes.solutionNotes}
                onChange={(e) => setNotes({ ...notes, solutionNotes: e.target.value })}
                className="w-full min-h-[300px] rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-white/60">
                Related Problem IDs (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. 0001-two-sum, 0015-3sum"
                value={notes.relatedProblems}
                onChange={(e) => setNotes({ ...notes, relatedProblems: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/30"
              />
              <p className="mt-2 text-xs text-white/50">
                Links to similar problems you have solved
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveNotes}
          disabled={saving}
          className="rounded-xl border border-jade/40 bg-jade/10 px-6 py-3 text-xs uppercase tracking-[0.2em] text-jade transition hover:bg-jade/20 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {/* Topic Details */}
      <section className="lc-surface rounded-2xl">
        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            Problem Details
          </p>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Topics
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(detail.problem.topics || []).length === 0 && (
                <span className="text-xs text-white/40">No topics tagged</span>
              )}
              {(detail.problem.topics || []).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Path
            </p>
            <p className="mt-3 text-sm text-white/70">{detail.problem.path}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Last Updated
            </p>
            <p className="mt-3 text-sm text-white/70">
              {detail.problem.lastUpdated || "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">
              Practice Sessions
            </p>
            <p className="mt-3 text-2xl font-bold text-jade">{notes.practiceCount}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
