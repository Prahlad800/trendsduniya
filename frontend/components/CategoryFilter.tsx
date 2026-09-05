import Link from "next/link";
import { categories } from "@/data/trends";
import { getTrends } from "@/lib/trends";
export default function CategoryFilter() {
  return (
    <div className="category-grid">
      {categories.map((category, i) => (
        <Link
          className="category-card"
          key={category}
          href={`/category/${category.toLowerCase()}`}
        >
          <span className="category-icon" aria-hidden="true">
            {["◉", "⌘", "✧", "◎", "◌", "↗", "❝", "＋"][i]}
          </span>
          <strong>{category}</strong>
          <span>
            {getTrends({ category }).length} topics{" "}
            <span aria-hidden="true">→</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
