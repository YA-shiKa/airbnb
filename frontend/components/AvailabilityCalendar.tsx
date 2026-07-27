"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

/** Next occurrence of the given day-of-week (0=Sun..6=Sat), today counts if it matches. */
function nextWeekday(from: Date, targetDow: number): Date {
  const diff = (targetDow - from.getDay() + 7) % 7;
  return addDays(from, diff);
}

function shortcutLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function AvailabilityCalendar({
  blockedRanges = [],
  checkIn,
  checkOut,
  onChange,
  showShortcuts = false,
}: {
  blockedRanges?: BlockedRange[];
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  /** Show "Today / Tomorrow / This weekend" quick-pick shortcuts (used by the global nav search, not the per-listing booking widget). */
  showShortcuts?: boolean;
}) {
  const today = new Date();
  const todayISO = toISODate(today);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(520);

  useLayoutEffect(() => {
    // Measure the real remaining space below this popup's actual position (it may
    // sit inside a stuck `position: sticky` ancestor, so a flat vh-based guess
    // isn't reliable — has to be computed from where it actually rendered).
    const measure = () => {
      const top = containerRef.current?.getBoundingClientRect().top ?? 0;
      const margin = 16;
      const available = Math.max(200, window.innerHeight - top - margin);
      setMaxHeight(Math.min(520, available));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const handlePick = (iso: string) => {
    if (!checkIn || (checkIn && checkOut)) {
      onChange(iso, "");
      return;
    }
    if (iso <= checkIn) {
      onChange(iso, "");
      return;
    }
    if (rangeHasBlockedNight(checkIn, iso, blockedRanges)) {
      onChange(iso, "");
      return;
    }
    onChange(checkIn, iso);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const prevMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayShortcut = todayISO;
  const tomorrowShortcut = toISODate(addDays(today, 1));
  const weekendStart = toISODate(nextWeekday(today, 5)); // upcoming Friday
  const weekendEnd = toISODate(addDays(new Date(weekendStart + "T00:00:00"), 2)); // that Sunday

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl shadow-card border border-hairline p-5 flex gap-6 overflow-y-auto"
      style={{ width: showShortcuts ? 620 : 340, maxHeight }}
    >
      {showShortcuts && (
        <div className="flex flex-col gap-3 w-[180px] shrink-0">
          <button
            type="button"
            onClick={() => onChange(todayShortcut, "")}
            className="text-left border border-hairline rounded-xl px-4 py-3 hover:border-ink transition-colors"
          >
            <span className="block font-semibold text-sm">Today</span>
            <span className="block text-sm text-subtle">{shortcutLabel(todayShortcut)}</span>
          </button>
          <button
            type="button"
            onClick={() => onChange(tomorrowShortcut, "")}
            className="text-left border border-hairline rounded-xl px-4 py-3 hover:border-ink transition-colors"
          >
            <span className="block font-semibold text-sm">Tomorrow</span>
            <span className="block text-sm text-subtle">{shortcutLabel(tomorrowShortcut)}</span>
          </button>
          <button
            type="button"
            onClick={() => onChange(weekendStart, weekendEnd)}
            className="text-left border border-hairline rounded-xl px-4 py-3 hover:border-ink transition-colors"
          >
            <span className="block font-semibold text-sm">This weekend</span>
            <span className="block text-sm text-subtle">{shortcutLabel(weekendStart)} – {shortcutLabel(weekendEnd)}</span>
          </button>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={prevMonth}
            disabled={isCurrentMonth}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-semibold text-base">
            {new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button type="button" onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100" aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-medium text-subtle mb-1">
          {WEEKDAY_LABELS.map((w, i) => (
            <div key={i} className="w-10 h-8 flex items-center justify-center">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="w-10 h-10" />;
            const iso = toISO(viewYear, viewMonth, day);
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
                className={`w-10 h-10 rounded-full text-sm flex items-center justify-center transition-colors
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

        {(checkIn || checkOut) && (
          <button type="button" onClick={() => onChange("", "")} className="text-xs font-semibold underline mt-3">
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}
