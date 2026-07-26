"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BlockedRange {
  checkIn: string; // ISO yyyy-mm-dd
  checkOut: string;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function isBlocked(dateISO: string, ranges: BlockedRange[]): boolean {
  return ranges.some((r) => dateISO >= r.checkIn && dateISO < r.checkOut);
}

/** True if any night between start(inclusive) and end(exclusive) is blocked. */
function rangeHasBlockedNight(startISO: string, endISO: string, ranges: BlockedRange[]): boolean {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (isBlocked(iso, ranges)) return true;
  }
  return false;
}

export default function AvailabilityCalendar({
  blockedRanges,
  checkIn,
  checkOut,
  onChange,
}: {
  blockedRanges: BlockedRange[];
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const todayISO = today.toISOString().slice(0, 10);

  const renderMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div className="flex-1">
        <p className="text-center font-semibold text-sm mb-3">
          {new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-subtle mb-1">
          {WEEKDAY_LABELS.map((w, i) => <div key={i}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const iso = toISO(year, month, day);
            const isPast = iso < todayISO;
            const blocked = isBlocked(iso, blockedRanges);
            const disabled = isPast || blocked;
            const isCheckIn = iso === checkIn;
            const isCheckOut = iso === checkOut;
            const inRange = checkIn && checkOut && iso > checkIn && iso < checkOut;

            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => handlePick(iso)}
                title={blocked ? "Not available" : undefined}
                className={`aspect-square rounded-full text-sm flex items-center justify-center transition-colors
                  ${disabled ? "text-gray-300 line-through cursor-not-allowed" : "hover:bg-gray-100 cursor-pointer"}
                  ${isCheckIn || isCheckOut ? "bg-ink text-white hover:bg-ink" : ""}
                  ${inRange ? "bg-gray-100" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handlePick = (iso: string) => {
    if (!checkIn || (checkIn && checkOut)) {
      // Start a fresh selection
      onChange(iso, "");
      return;
    }
    // We have a check-in but no check-out yet
    if (iso <= checkIn) {
      onChange(iso, "");
      return;
    }
    if (rangeHasBlockedNight(checkIn, iso, blockedRanges)) {
      // Can't span over an unavailable night — restart selection at this date
      onChange(iso, "");
      return;
    }
    onChange(checkIn, iso);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const prevMonth = () => {
    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    if (isCurrentMonth) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const secondMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const secondYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  return (
    <div className="border border-hairline rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100" aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs text-subtle">
          {checkIn && !checkOut ? "Select checkout date" : "Select check-in date"}
        </span>
        <button type="button" onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100" aria-label="Next month">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="hidden sm:flex gap-6">
        {renderMonth(viewYear, viewMonth)}
        {renderMonth(secondYear, secondMonth)}
      </div>
      <div className="sm:hidden">
        {renderMonth(viewYear, viewMonth)}
      </div>
      {(checkIn || checkOut) && (
        <button type="button" onClick={() => onChange("", "")} className="text-xs font-semibold underline mt-3">
          Clear dates
        </button>
      )}
    </div>
  );
}
