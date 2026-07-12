export default function Header() {
  return (
    <header className="lc-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl px-4 py-4 sm:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Problemset
        </p>
        <h1 className="mt-1 font-display text-xl text-slate-900 sm:text-2xl md:text-3xl">
          LeetCode Vault
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Curate your solved problems and keep your list sharp.
        </p>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 text-xs text-slate-600 sm:w-auto sm:text-sm">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
          Updated today
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
          Synced from repo
        </span>
      </div>
    </header>
  );
}
