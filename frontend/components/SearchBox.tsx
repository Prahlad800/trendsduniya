export default function SearchBox({
  defaultValue = "",
  compact = false,
}: {
  defaultValue?: string;
  compact?: boolean;
}) {
  return (
    <form
      action="/trends"
      role="search"
      className={`search-box ${compact ? "compact" : ""}`}
    >
      <label
        className="sr-only"
        htmlFor={compact ? "header-search" : "trend-search"}
      >
        Search topics, categories and related keywords
      </label>
      <span aria-hidden="true">⌕</span>
      <input
        id={compact ? "header-search" : "trend-search"}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search trends…"
        maxLength={150}
      />
      <button type="submit" aria-label="Search trends">
        →
      </button>
    </form>
  );
}
