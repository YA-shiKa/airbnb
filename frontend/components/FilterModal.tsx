"use client";

import { useState, useEffect } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import type { Amenity } from "@/types";

export interface FilterValues {
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  amenities: string[];
}

export default function FilterModal({
  propertyTypes,
  allAmenities,
  initial,
  onApply,
}: {
  propertyTypes: string[];
  allAmenities: Amenity[];
  initial: FilterValues;
  onApply: (values: FilterValues) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValues>(initial);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  const activeCount =
    (initial.propertyType ? 1 : 0) + (initial.minPrice ? 1 : 0) + (initial.maxPrice ? 1 : 0) + initial.amenities.length;

  const toggleAmenity = (name: string) => {
    setDraft((d) => ({
      ...d,
      amenities: d.amenities.includes(name) ? d.amenities.filter((a) => a !== name) : [...d.amenities, name],
    }));
  };

  const clearAll = () => setDraft({ propertyType: "", minPrice: "", maxPrice: "", amenities: [] });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-hairline rounded-full px-4 py-2.5 text-sm font-medium hover:shadow-pop transition-shadow shrink-0"
      >
        <SlidersHorizontal size={16} />
        Filters
        {activeCount > 0 && (
          <span className="bg-ink text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{activeCount}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center animate-fadeIn" onClick={() => setOpen(false)}>
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-hairline">
              <button onClick={() => setOpen(false)} aria-label="Close filters" className="p-2 rounded-full hover:bg-gray-100">
                <X size={18} />
              </button>
              <span className="font-semibold">Filters</span>
              <span className="w-9" />
            </div>

            <div className="overflow-y-auto p-6 flex flex-col gap-8">
              <section>
                <h3 className="font-semibold mb-3">Price range per night</h3>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={draft.minPrice}
                    onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value }))}
                    className="w-full border border-hairline rounded-lg px-3 py-2 text-sm"
                  />
                  <span className="text-subtle">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={draft.maxPrice}
                    onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value }))}
                    className="w-full border border-hairline rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </section>

              <section>
                <h3 className="font-semibold mb-3">Type of place</h3>
                <div className="flex flex-wrap gap-2">
                  {propertyTypes.map((pt) => (
                    <button
                      key={pt}
                      onClick={() => setDraft((d) => ({ ...d, propertyType: d.propertyType === pt ? "" : pt }))}
                      className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                        draft.propertyType === pt ? "border-ink bg-ink text-white" : "border-hairline hover:border-ink"
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-semibold mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {allAmenities.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => toggleAmenity(a.name)}
                      className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                        draft.amenities.includes(a.name) ? "border-ink bg-ink text-white" : "border-hairline hover:border-ink"
                      }`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-hairline">
              <button onClick={clearAll} className="text-sm font-semibold underline">
                Clear all
              </button>
              <button
                onClick={() => {
                  onApply(draft);
                  setOpen(false);
                }}
                className="bg-ink text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-black transition-colors"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
