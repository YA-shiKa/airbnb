"use client";

import { Waves, Mountain, TreePine, Sparkles, Wheat, LayoutGrid } from "lucide-react";

const ICONS: Record<string, any> = {
  Beachfront: Waves,
  Cabins: TreePine,
  "Amazing views": Mountain,
  Trending: Sparkles,
  Countryside: Wheat,
};

export default function CategoryRow({
  categories,
  active,
  onSelect,
}: {
  categories: string[];
  active: string | null;
  onSelect: (category: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar border-b border-hairline pb-2">
      <button
        onClick={() => onSelect(null)}
        className={`flex flex-col items-center gap-2 pb-2 shrink-0 border-b-2 transition-colors ${
          active === null ? "border-ink text-ink" : "border-transparent text-subtle hover:text-ink"
        }`}
      >
        <LayoutGrid size={22} strokeWidth={active === null ? 2.5 : 2} />
        <span className="text-xs font-medium whitespace-nowrap">All</span>
      </button>
      {categories.map((c) => {
        const Icon = ICONS[c] || Sparkles;
        const isActive = active === c;
        return (
          <button
            key={c}
            onClick={() => onSelect(isActive ? null : c)}
            className={`flex flex-col items-center gap-2 pb-2 shrink-0 border-b-2 transition-colors ${
              isActive ? "border-ink text-ink" : "border-transparent text-subtle hover:text-ink"
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-xs font-medium whitespace-nowrap">{c}</span>
          </button>
        );
      })}
    </div>
  );
}
