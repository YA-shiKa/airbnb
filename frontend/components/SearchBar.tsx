"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { todayISODate } from "@/lib/dates";

export interface SearchValues {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export default function SearchBar({
  initial,
  onSearch,
}: {
  initial: SearchValues;
  onSearch: (values: SearchValues) => void;
}) {
  const [values, setValues] = useState<SearchValues>(initial);

  const submit = () => onSearch(values);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 border border-hairline rounded-2xl sm:rounded-full shadow-sm hover:shadow-pop transition-shadow bg-white p-2 sm:p-1 max-w-4xl mx-auto">
      <label className="flex-1 px-4 py-2 sm:border-r border-hairline">
        <span className="block text-xs font-semibold">Where</span>
        <input
          type="text"
          placeholder="Search destinations"
          value={values.location}
          onChange={(e) => setValues((v) => ({ ...v, location: e.target.value }))}
          className="w-full text-sm outline-none placeholder:text-subtle bg-transparent"
        />
      </label>

      <label className="flex-1 px-4 py-2 sm:border-r border-hairline">
        <span className="block text-xs font-semibold">Check in</span>
        <input
          type="date"
          min={todayISODate()}
          value={values.checkIn}
          onChange={(e) => setValues((v) => ({ ...v, checkIn: e.target.value, checkOut: v.checkOut && v.checkOut <= e.target.value ? "" : v.checkOut }))}
          className="w-full text-sm outline-none bg-transparent text-subtle"
        />
      </label>

      <label className="flex-1 px-4 py-2 sm:border-r border-hairline">
        <span className="block text-xs font-semibold">Check out</span>
        <input
          type="date"
          min={values.checkIn || todayISODate()}
          value={values.checkOut}
          onChange={(e) => setValues((v) => ({ ...v, checkOut: e.target.value }))}
          className="w-full text-sm outline-none bg-transparent text-subtle"
        />
      </label>

      <label className="flex-1 px-4 py-2 flex items-center justify-between gap-2">
        <span>
          <span className="block text-xs font-semibold">Who</span>
          <input
            type="number"
            min={1}
            max={16}
            value={values.guests}
            onChange={(e) => setValues((v) => ({ ...v, guests: Math.max(1, Number(e.target.value) || 1) }))}
            className="w-16 text-sm outline-none bg-transparent text-subtle"
          />
        </span>
        <button
          onClick={submit}
          className="bg-rausch hover:bg-rausch_dark text-white rounded-full p-3 flex items-center gap-2 shrink-0 transition-colors"
          aria-label="Search"
        >
          <Search size={16} />
          <span className="hidden sm:inline text-sm font-semibold pr-1">Search</span>
        </button>
      </label>
    </div>
  );
}
