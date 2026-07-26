import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page,
  hasMore,
  onChange,
}: {
  page: number;
  hasMore: boolean;
  onChange: (page: number) => void;
}) {
  if (page === 1 && !hasMore) return null;
  return (
    <div className="flex items-center justify-center gap-4 py-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 px-4 py-2 rounded-full border border-hairline text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        <ChevronLeft size={16} /> Previous
      </button>
      <span className="text-sm text-subtle">Page {page}</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={!hasMore}
        className="flex items-center gap-1 px-4 py-2 rounded-full border border-hairline text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}
