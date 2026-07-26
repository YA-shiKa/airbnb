"use client";

import ListingForm, { emptyListingForm } from "@/components/ListingForm";

export default function NewListingPage() {
  return <ListingForm mode="create" initial={emptyListingForm()} />;
}
