import { Star } from "lucide-react";
import type { Review } from "@/types";

export default function ReviewsSection({ reviews, rating, reviewCount }: { reviews: Review[]; rating: number; reviewCount: number }) {
  return (
    <section className="border-t border-hairline py-8">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
        <Star size={18} fill="#222222" strokeWidth={0} />
        {reviewCount > 0 ? `${rating.toFixed(1)} · ${reviewCount} review${reviewCount > 1 ? "s" : ""}` : "No reviews yet"}
      </h2>
      {reviews.length === 0 ? (
        <p className="text-subtle text-sm">Be the first to stay here and leave a review.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
          {reviews.map((r) => (
            <div key={r.id}>
              <div className="flex items-center gap-3 mb-2">
                {r.guest.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.guest.avatar_url} alt={r.guest.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                )}
                <div>
                  <p className="font-medium text-sm">{r.guest.name}</p>
                  <p className="text-xs text-subtle">{new Date(r.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                </div>
              </div>
              <p className="text-sm text-ink leading-relaxed line-clamp-2">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
