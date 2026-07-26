"use client";

import { useEffect, useState, useCallback } from "react";
import SearchBar, { SearchValues } from "@/components/SearchBar";
import CategoryRow from "@/components/CategoryRow";
import FilterModal, { FilterValues } from "@/components/FilterModal";
import ListingCard from "@/components/ListingCard";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ListingCard as ListingCardType, Amenity } from "@/types";

const PAGE_SIZE = 12;

export default function ExplorePage() {
  const { user } = useAuth();

  const [search, setSearch] = useState<SearchValues>({ location: "", checkIn: "", checkOut: "", guests: 1 });
  const [category, setCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValues>({ propertyType: "", minPrice: "", maxPrice: "", amenities: [] });
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);

  const [listings, setListings] = useState<ListingCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getPropertyTypes().then(setPropertyTypes).catch(() => {});
    api.getAmenities().then(setAllAmenities).catch(() => {});
  }, []);

  const loadListings = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .searchListings({
        location: search.location || undefined,
        check_in: search.checkIn || undefined,
        check_out: search.checkOut || undefined,
        guests: search.guests > 1 ? search.guests : undefined,
        category: category || undefined,
        property_type: filters.propertyType || undefined,
        min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
        max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        amenities: filters.amenities.length ? filters.amenities.join(",") : undefined,
        user_id: user?.id,
        page,
        page_size: PAGE_SIZE,
      })
      .then(setListings)
      .catch(() => setError("Couldn't load listings. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [search, category, filters, page, user?.id]);

  useEffect(() => {
    loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, filters, page, user?.id]);

  const runSearch = (values: SearchValues) => {
    setSearch(values);
    setPage(1);
    setTimeout(loadListings, 0);
  };

  return (
    <div className="max-w-[1760px] mx-auto px-4 md:px-10">
      <div className="py-6 sticky top-20 z-40 bg-white">
        <SearchBar initial={search} onSearch={runSearch} />
      </div>

      <div className="flex items-center justify-between gap-4 py-2">
        <CategoryRow categories={categories} active={category} onSelect={(c) => { setCategory(c); setPage(1); }} />
        <FilterModal
          propertyTypes={propertyTypes}
          allAmenities={allAmenities}
          initial={filters}
          onApply={(f) => { setFilters(f); setPage(1); }}
        />
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 py-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-xl2 bg-gray-200" />
              <div className="h-3 bg-gray-200 rounded mt-3 w-3/4" />
              <div className="h-3 bg-gray-200 rounded mt-2 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <EmptyState title="Something went wrong" description={error} />
      )}

      {!loading && !error && listings.length === 0 && (
        <EmptyState
          title="No stays match your search"
          description="Try a different location, dates, or clearing some filters."
        />
      )}

      {!loading && !error && listings.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 py-8">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
          <Pagination page={page} hasMore={listings.length === PAGE_SIZE} onChange={setPage} />
        </>
      )}
    </div>
  );
}
