const difficultyOptions = [
  { value: "all", label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "unspecified", label: "Unspecified" },
];

const sortOptions = [
  { value: "number-asc", label: "Number (asc)" },
  { value: "number-desc", label: "Number (desc)" },
  { value: "title-asc", label: "Title (A-Z)" },
  { value: "title-desc", label: "Title (Z-A)" },
  { value: "updated-desc", label: "Updated (newest)" },
];

export default function FilterBar({
  search,
  onSearch,
  topics,
  selectedTopics,
  onToggleTopic,
  difficulty,
  onDifficulty,
  sort,
  onSort,
}) {
  return (
    <section className="lc-toolbar grid gap-5 rounded-2xl px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-3">
        <div className="flex w-full flex-col gap-2 lg:min-w-[220px] lg:flex-1 lg:flex-row lg:items-center lg:gap-3">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Search
          </label>
          <input
            className="lc-input flex-1 rounded-full px-4 py-2 text-sm outline-none transition focus:border-slate-400"
            placeholder="Search by number or title"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {difficultyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onDifficulty(option.value)}
              className={`lc-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                difficulty === option.value ? "is-active" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Sort
          </label>
          <select
            className="lc-select w-full rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] sm:w-auto"
            value={sort}
            onChange={(event) => onSort(event.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Topics
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {topics.length === 0 && (
            <span className="text-sm text-slate-400">
              Add topics to your JSON.
            </span>
          )}
          {topics.map((topic) => {
            const active = selectedTopics.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => onToggleTopic(topic)}
                className={`lc-chip rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  active ? "is-active" : ""
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
