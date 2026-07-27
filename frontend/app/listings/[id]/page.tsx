"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, Star, MapPin, Award, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { ListingDetail } from "@/types";
import Gallery from "@/components/Gallery";
import BookingWidget from "@/components/BookingWidget";
import ReviewsSection from "@/components/ReviewsSection";
import EmptyState from "@/components/EmptyState";

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getListing(id)
      .then(setListing)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[1120px] mx-auto px-4 md:px-10 py-8 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-[420px] bg-gray-200 rounded-xl2" />
      </div>
    );
  }

  if (notFound || !listing) {
    return <EmptyState title="Listing not found" description="This stay may have been removed by its host." actionLabel="Back to search" actionHref="/" />;
  }

  return (
    <div className="max-w-[1120px] mx-auto px-4 md:px-10 py-6">
      <h1 className="text-2xl font-semibold mb-1">{listing.title}</h1>
      <div className="flex items-center gap-3 text-sm mb-4">
        {listing.review_count > 0 && (
          <span className="flex items-center gap-1 font-medium">
            <Star size={14} fill="#222222" strokeWidth={0} /> {listing.rating.toFixed(1)} · {listing.review_count} reviews
          </span>
        )}
        <span className="flex items-center gap-1 underline text-subtle">
          <MapPin size={14} /> {listing.city}, {listing.country}
        </span>
      </div>

      <Gallery photos={listing.photos} title={listing.title} />

      <div className="grid lg:grid-cols-3 gap-10 mt-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-hairline pb-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {listing.property_type} hosted by {listing.host.name}
                {listing.host.is_superhost && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-rausch/10 text-rausch px-2 py-1 rounded-full">
                    <Award size={12} /> Superhost
                  </span>
                )}
              </h2>
              <p className="text-subtle text-sm">
                {listing.max_guests} guests · {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? "s" : ""} · {listing.beds} bed{listing.beds !== 1 ? "s" : ""} · {listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}
              </p>
            </div>
            {listing.host.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.host.avatar_url} alt={listing.host.name} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gray-200" />
            )}
          </div>

          <p className="py-6 border-b border-hairline text-ink leading-relaxed whitespace-pre-line">{listing.description}</p>

          <div className="py-6 border-b border-hairline">
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 border border-ink rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <MessageCircle size={16} /> Contact {listing.host.name.split(" ")[0]}
            </Link>
          </div>

          <div className="py-6 border-b border-hairline">
            <h2 className="text-lg font-semibold mb-4">What this place offers</h2>
            <div className="grid grid-cols-2 gap-y-3">
              {listing.amenities.map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <Check size={18} /> {a.name}
                </div>
              ))}
            </div>
          </div>

          {listing.latitude != null && listing.longitude != null && (
            <div className="py-6 border-b border-hairline">
              <h2 className="text-lg font-semibold mb-4">Where you'll be</h2>
              <div className="rounded-xl2 overflow-hidden border border-hairline">
                <iframe
                  title={`Map showing the location of ${listing.title}`}
                  className="w-full h-[300px]"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude - 0.02}%2C${listing.latitude - 0.02}%2C${listing.longitude + 0.02}%2C${listing.latitude + 0.02}&layer=mapnik&marker=${listing.latitude}%2C${listing.longitude}`}
                />
              </div>
              <p className="text-sm text-subtle mt-2">{listing.city}, {listing.country}</p>
            </div>
          )}

          <ReviewsSection reviews={listing.reviews} rating={listing.rating} reviewCount={listing.review_count} />
        </div>

        <div>
          <BookingWidget listing={listing} />
        </div>
      </div>
    </div>
  );
}
