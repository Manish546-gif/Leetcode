import { Link } from "react-router-dom";

const difficultyStyles = {
  easy: "lc-difficulty is-easy",
  medium: "lc-difficulty is-medium",
  hard: "lc-difficulty is-hard",
  unspecified: "lc-difficulty is-unspecified",
};

export default function ProblemCard({ problem }) {
  const difficultyKey = (problem.difficulty || "unspecified").toLowerCase();
  const badgeStyle = difficultyStyles[difficultyKey] || difficultyStyles.unspecified;
  const isSolved = Boolean(problem.status);
  const attemptedLabel = isSolved ? "Solved" : "Not started";

  return (
    <Link
      to={`/problem/${problem.id}`}
      className="lc-row transition hover:bg-slate-50"
    >
      <div className={`lc-status ${isSolved ? "is-solved" : ""}`}>
        {isSolved ? "OK" : ""}
      </div>
      <div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            #{problem.number}
          </span>
          <h3 className="text-base font-semibold text-slate-900">{problem.title}</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">{problem.path}</p>
        <div className="mt-3 grid gap-2 text-xs text-slate-500 md:hidden">
          <div>
            <span className="font-semibold uppercase tracking-[0.15em] text-slate-400">
              Topics:
            </span>{" "}
            {(problem.topics || []).length ? (problem.topics || []).join(", ") : "No topics tagged"}
          </div>
          <div>
            <span className="font-semibold uppercase tracking-[0.15em] text-slate-400">
              Difficulty:
            </span>{" "}
            {problem.difficulty || "Unspecified"}
          </div>
          <div>
            <span className="font-semibold uppercase tracking-[0.15em] text-slate-400">
              Attempted:
            </span>{" "}
            {attemptedLabel}
          </div>
        </div>
      </div>
      <div className="lc-tags hidden md:flex">
        {(problem.topics || []).length === 0 && (
          <span className="text-xs text-slate-400">No topics tagged</span>
        )}
        {(problem.topics || []).map((topic) => (
          <span key={topic} className="lc-tag">
            {topic}
          </span>
        ))}
      </div>
      <div className={`hidden md:inline-flex ${badgeStyle}`}>
        {problem.difficulty || "Unspecified"}
      </div>
      <div className="hidden text-xs font-semibold text-slate-600 md:block">
        {attemptedLabel}
      </div>
      <div className="hidden text-xs text-slate-400 md:block">--</div>
    </Link>
  );
}
