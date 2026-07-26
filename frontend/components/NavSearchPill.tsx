"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useSearch } from "@/lib/search-context";
import { formatDateShort } from "@/lib/dates";
import AvailabilityCalendar from "./AvailabilityCalendar";

type OpenField = null | "location" | "dates" | "guests";

const POPULAR_DESTINATIONS = ["Goa, India", "Lisbon, Portugal", "Bariloche, Argentina", "Jaipur, India", "Stockholm, Sweden", "Bergen, Norway"];

export default function NavSearchPill() {
  const { searchValues, setSearchValues } = useSearch();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState<OpenField>(null);
  const [draft, setDraft] = useState(searchValues);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the draft in sync with the last applied search whenever nothing is open
  // (e.g. after a search elsewhere on the page updates the shared context).
  useEffect(() => {
    if (open === null) setDraft(searchValues);
  }, [searchValues, open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggle = (field: OpenField) => setOpen((o) => (o === field ? null : field));

  const runSearch = () => {
    setSearchValues(draft);
    setOpen(null);
    if (pathname !== "/") router.push("/");
  };

  const dateLabel =
    draft.checkIn && draft.checkOut
      ? `${formatDateShort(draft.checkIn)} – ${formatDateShort(draft.checkOut)}`
      : "Any week";

  return (
    <div ref={containerRef} className="hidden md:flex relative items-stretch border border-hairline rounded-full shadow-sm hover:shadow-pop transition-shadow divide-x divide-hairline">
      {/* Where */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("location")}
          className={`px-4 py-2 text-sm font-medium text-left rounded-full transition-colors ${open === "location" ? "bg-white shadow-pop" : "hover:bg-gray-50"}`}
        >
          <span className="block text-[10px] font-bold uppercase tracking-wide text-subtle">Where</span>
          <span>{draft.location || "Anywhere"}</span>
        </button>
        {open === "location" && (
          <div className="absolute left-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-card border border-hairline p-4 z-[60] animate-fadeIn">
            <input
              autoFocus
              type="text"
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search destinations"
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm mb-3 outline-none"
            />
            <p className="text-xs font-semibold text-subtle mb-2">Popular destinations</p>
            <div className="flex flex-col">
              {POPULAR_DESTINATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDraft((v) => ({ ...v, location: d }))}
                  className="text-left text-sm px-2 py-2 rounded-lg hover:bg-gray-50"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Any week / dates */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("dates")}
          className={`px-4 py-2 text-sm font-medium text-left rounded-full transition-colors ${open === "dates" ? "bg-white shadow-pop" : "hover:bg-gray-50"} ${!draft.checkIn ? "text-subtle" : ""}`}
        >
          <span className="block text-[10px] font-bold uppercase tracking-wide text-subtle">When</span>
          <span>{dateLabel}</span>
        </button>
        {open === "dates" && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-[60] animate-fadeIn">
            <AvailabilityCalendar
              checkIn={draft.checkIn}
              checkOut={draft.checkOut}
              onChange={(ci, co) => {
                setDraft((d) => ({ ...d, checkIn: ci, checkOut: co }));
                if (ci && co) setOpen(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Add guests */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("guests")}
          className={`pl-4 pr-2 py-2 text-sm font-medium text-left rounded-full flex items-center gap-2 transition-colors ${open === "guests" ? "bg-white shadow-pop" : "hover:bg-gray-50"} ${draft.guests <= 1 ? "text-subtle" : ""}`}
        >
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-wide text-subtle">Who</span>
            <span>{draft.guests > 1 ? `${draft.guests} guests` : "Add guests"}</span>
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              runSearch();
            }}
            className="bg-rausch hover:bg-rausch_dark text-white rounded-full p-2 transition-colors"
            aria-label="Search"
          >
            <Search size={14} />
          </span>
        </button>
        {open === "guests" && (
          <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-card border border-hairline p-4 z-[60] animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Guests</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, guests: Math.max(1, d.guests - 1) }))}
                  disabled={draft.guests <= 1}
                  className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center disabled:opacity-30 hover:border-ink"
                  aria-label="Decrease guests"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm">{draft.guests}</span>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, guests: Math.min(16, d.guests + 1) }))}
                  disabled={draft.guests >= 16}
                  className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center disabled:opacity-30 hover:border-ink"
                  aria-label="Increase guests"
                >
                  +
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={runSearch}
              className="w-full mt-4 bg-ink text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-black transition-colors"
            >
              Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
