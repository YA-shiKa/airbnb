"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import ListingForm, { listingToForm, ListingFormValues } from "@/components/ListingForm";
import EmptyState from "@/components/EmptyState";

export default function EditListingPage() {
  const params = useParams();
  const id = params?.id as string;

  const [initial, setInitial] = useState<ListingFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.getListing(id).then((l) => setInitial(listingToForm(l))).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-10 text-subtle text-sm">Loading listing…</div>;
  if (notFound || !initial) return <EmptyState title="Listing not found" actionLabel="Back to dashboard" actionHref="/host" />;

  return <ListingForm mode="edit" listingId={Number(id)} initial={initial} />;
}
