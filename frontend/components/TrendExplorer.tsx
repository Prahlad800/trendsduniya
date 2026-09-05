"use client";
import { useState } from "react";
import { categories, type Trend, type TrendSource } from "@/data/trends";
import TrendList from "./TrendList";
export default function TrendExplorer({
  trends,
  initialQuery = "",
  fixedSource,
  fixedCategory,
}: {
  trends: Trend[];
  initialQuery?: string;
  fixedSource?: TrendSource;
  fixedCategory?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [source, setSource] = useState<string>(fixedSource ?? "all");
  const [category, setCategory] = useState(fixedCategory ?? "all");
  const filtered = trends.filter(
    (t) =>
      (source === "all" || t.source === source) &&
      (category === "all" || t.category === category) &&
      [t.title, t.category, ...t.relatedKeywords]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <div className="explorer-controls">
        <label className="filter-search">
          Search topics
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try real madrid or systemdesign…"
            maxLength={150}
          />
        </label>
        {!fixedCategory && (
          <label htmlFor="category-filter">
            Category
            <select
              id="category-filter"
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        {!fixedSource && (
          <fieldset>
            <legend>Source</legend>
            <div className="source-tabs">
              {[
                ["all", "All"],
                ["google", "Google"],
                ["x", "X"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={source === value}
                  onClick={() => setSource(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>
      <div className="results-line">
        <p role="status" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "topic" : "topics"} found
        </p>
        <button
          className="text-button"
          onClick={() => {
            setQuery("");
            setSource(fixedSource ?? "all");
            setCategory(fixedCategory ?? "all");
          }}
        >
          Clear filters
        </button>
      </div>
      <h2 className="sr-only">Matching trending topics</h2>
      <TrendList trends={filtered} />
    </>
  );
}
