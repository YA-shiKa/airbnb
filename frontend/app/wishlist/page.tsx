"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { ListingCard as ListingCardType } from "@/types";
import ListingCard from "@/components/ListingCard";
import EmptyState from "@/components/EmptyState";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ListingCardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.push("/login");
    else if (user) api.getWishlist(user.id).then(setItems).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  if (!ready || (user && loading)) {
    return <div className="max-w-[1760px] mx-auto px-4 py-10 text-subtle text-sm">Loading your wishlist…</div>;
  }
  if (!user) return null;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No wishlists yet"
        description="Tap the heart icon on any stay to start saving your favorites here."
        actionLabel="Explore stays"
        actionHref="/"
      />
    );
  }

  return (
    <div className="max-w-[1760px] mx-auto px-4 md:px-10 py-8">
      <h1 className="text-2xl font-semibold mb-6">Wishlists</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
        {items.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </div>
  );
}
