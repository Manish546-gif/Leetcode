const difficultyLabel = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  unspecified: "Unspecified",
};

export default function StatsPanel({ stats }) {
  if (!stats) {
    return null;
  }

  const entries = Object.entries(stats.byDifficulty || {}).sort();

  return (
    <section className="lc-panel grid gap-4 rounded-2xl px-4 py-4 sm:px-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total</p>
        <p className="mt-2 font-display text-2xl text-slate-900 sm:text-3xl">
          {stats.total}
        </p>
      </div>
      <div className="grid gap-3">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              {difficultyLabel[key] || key}
            </span>
            <span className="font-semibold text-slate-900">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
