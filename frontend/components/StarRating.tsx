import { Star } from "lucide-react";

export default function StarRating({ rating, reviewCount, size = 14 }: { rating: number; reviewCount: number; size?: number }) {
  if (reviewCount === 0) {
    return <span className="text-sm font-medium text-subtle">New</span>;
  }
  return (
    <span className="flex items-center gap-1 text-sm">
      <Star size={size} fill="#222222" strokeWidth={0} />
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-subtle">({reviewCount})</span>
    </span>
  );
}
