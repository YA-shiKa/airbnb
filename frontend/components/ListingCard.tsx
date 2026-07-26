"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import type { ListingCard as ListingCardType } from "@/types";
import StarRating from "./StarRating";
import { formatMoney } from "@/lib/dates";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { api } from "@/lib/api";

export default function ListingCard({ listing }: { listing: ListingCardType }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [wishlisted, setWishlisted] = useState(listing.is_wishlisted);
  const [busy, setBusy] = useState(false);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast("Log in to save listings to your wishlist", "info");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !wishlisted;
    setWishlisted(next); // optimistic
    try {
      await api.toggleWishlist(user.id, listing.id);
      showToast(next ? "Added to wishlist" : "Removed from wishlist");
    } catch {
      setWishlisted(!next); // revert on failure
      showToast("Couldn't update wishlist", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="relative aspect-square rounded-xl2 overflow-hidden bg-gray-100">
        {listing.cover_photo && (
          <Image
            src={listing.cover_photo}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <button
          onClick={toggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 transition-transform active:scale-90"
        >
          <Heart
            size={24}
            fill={wishlisted ? "#FF385C" : "rgba(0,0,0,0.5)"}
            stroke="white"
            strokeWidth={1.5}
          />
        </button>
      </div>
      <div className="mt-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm truncate">{listing.city}, {listing.country}</p>
          <StarRating rating={listing.rating} reviewCount={listing.review_count} />
        </div>
        <p className="text-subtle text-sm truncate">{listing.title}</p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">{formatMoney(listing.price_per_night)}</span> night
        </p>
      </div>
    </Link>
  );
}
