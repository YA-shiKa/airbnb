"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { api, ApiError } from "@/lib/api";
import type { TripBooking } from "@/types";
import { formatDateRange, formatMoney } from "@/lib/dates";
import EmptyState from "@/components/EmptyState";

function ReviewForm({ booking, onDone }: { booking: TripBooking; onDone: () => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!user || !comment.trim()) {
      setError("Add a few words about your stay.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createReview(booking.listing_id, { guest_id: user.id, booking_id: booking.id, rating, comment });
      showToast("Review posted — thanks for sharing!");
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't post review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 border-t border-hairline pt-3">
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star size={20} fill={n <= rating ? "#222222" : "none"} stroke="#222222" />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was your stay?"
        rows={2}
        className="w-full border border-hairline rounded-lg px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-rausch mt-1">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="mt-2 bg-ink text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {submitting ? "Posting…" : "Post review"}
      </button>
    </div>
  );
}

export default function TripsPage() {
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [trips, setTrips] = useState<TripBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    api.myTrips(user.id).then(setTrips).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (ready && !user) router.push("/login");
    else if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  const cancel = async (bookingId: number) => {
    try {
      await api.cancelBooking(bookingId);
      showToast("Booking cancelled");
      load();
    } catch {
      showToast("Couldn't cancel booking", "error");
    }
  };

  if (!ready || (user && loading)) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-subtle text-sm">Loading your trips…</div>;
  }

  if (!user) return null;

  if (trips.length === 0) {
    return <EmptyState title="No trips booked...yet!" description="Time to dust off your bags and start planning your next adventure." actionLabel="Start searching" actionHref="/" />;
  }

  const now = new Date();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">My trips</h1>
      <div className="flex flex-col gap-6">
        {trips.map((t) => {
          const isPast = new Date(t.check_out) < now;
          return (
            <div key={t.id} className="flex gap-4 border border-hairline rounded-2xl p-4">
              <Link href={`/listings/${t.listing_id}`} className="relative w-32 h-28 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                {t.cover_photo && <Image src={t.cover_photo} alt={t.listing_title} fill sizes="128px" className="object-cover" />}
              </Link>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/listings/${t.listing_id}`} className="font-semibold hover:underline">{t.listing_title}</Link>
                    <p className="text-sm text-subtle">{t.listing_city}, {t.listing_country}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      t.status === "cancelled" ? "bg-gray-100 text-subtle" : isPast ? "bg-gray-100 text-subtle" : "bg-green-50 text-green-700"
                    }`}
                  >
                    {t.status === "cancelled" ? "Cancelled" : isPast ? "Completed" : "Upcoming"}
                  </span>
                </div>
                <p className="text-sm mt-2">{formatDateRange(t.check_in.slice(0, 10), t.check_out.slice(0, 10))} · {t.guests} guest{t.guests > 1 ? "s" : ""}</p>
                <p className="text-sm font-medium mt-1">{formatMoney(t.total_price)} total</p>

                <div className="flex items-center gap-3 mt-3">
                  {t.status === "confirmed" && !isPast && (
                    <button onClick={() => cancel(t.id)} className="text-sm font-semibold underline">Cancel booking</button>
                  )}
                  {t.can_review && reviewingId !== t.id && (
                    <button onClick={() => setReviewingId(t.id)} className="text-sm font-semibold underline">Leave a review</button>
                  )}
                  {t.has_review && <span className="text-sm text-subtle">Reviewed</span>}
                </div>

                {reviewingId === t.id && (
                  <ReviewForm booking={t} onDone={() => { setReviewingId(null); load(); }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
