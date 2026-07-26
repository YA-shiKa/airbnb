"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { ListingDetail } from "@/types";
import { formatDateRange, formatDateShort, formatMoney, nightsBetween } from "@/lib/dates";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { api, ApiError } from "@/lib/api";
import StarRating from "./StarRating";
import AvailabilityCalendar from "./AvailabilityCalendar";

export default function BookingWidget({ listing }: { listing: ListingDetail }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  const blockedRanges = useMemo(
    () => listing.booked_ranges.map((r) => ({ checkIn: r.check_in.slice(0, 10), checkOut: r.check_out.slice(0, 10) })),
    [listing.booked_ranges]
  );

  const subtotal = nights > 0 ? listing.price_per_night * nights : 0;
  const serviceFee = nights > 0 ? Math.round(subtotal * listing.service_fee_rate * 100) / 100 : 0;
  const total = nights > 0 ? Math.round((subtotal + listing.cleaning_fee + serviceFee) * 100) / 100 : 0;

  const openConfirm = () => {
    setFormError(null);
    if (!user) {
      showToast("Log in to book this stay", "info");
      router.push("/login");
      return;
    }
    if (!checkIn || !checkOut || nights <= 0) {
      setFormError("Select check-in and check-out dates.");
      return;
    }
    if (guests > listing.max_guests) {
      setFormError(`This place sleeps a maximum of ${listing.max_guests} guests.`);
      return;
    }
    setConfirmOpen(true);
  };

  const confirmAndPay = async () => {
    if (!user) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await api.createBooking({
        listing_id: listing.id,
        guest_id: user.id,
        check_in: `${checkIn}T00:00:00`,
        check_out: `${checkOut}T00:00:00`,
        guests,
      });
      showToast("Booking confirmed! Check My Trips for details.");
      setConfirmOpen(false);
      router.push("/trips");
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Couldn't complete the booking.";
      setFormError(message);
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-hairline rounded-2xl shadow-card p-6 sticky top-28">
      <div className="flex items-baseline justify-between mb-4">
        <span>
          <span className="text-lg font-semibold">{formatMoney(listing.price_per_night)}</span>
          <span className="text-subtle"> night</span>
        </span>
        <StarRating rating={listing.rating} reviewCount={listing.review_count} />
      </div>

      <div className="border border-hairline rounded-xl overflow-hidden mb-3 relative">
        <button
          type="button"
          onClick={() => setCalendarOpen((o) => !o)}
          className="w-full grid grid-cols-2 divide-x divide-hairline text-left"
        >
          <span className="p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wide">Check-in</span>
            <span className="block text-sm">{checkIn ? formatDateShort(checkIn) : "Add date"}</span>
          </span>
          <span className="p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wide">Checkout</span>
            <span className="block text-sm">{checkOut ? formatDateShort(checkOut) : "Add date"}</span>
          </span>
        </button>
        <label className="block p-3 border-t border-hairline">
          <span className="block text-[10px] font-bold uppercase tracking-wide">Guests</span>
          <input
            type="number"
            min={1}
            max={listing.max_guests}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
            className="w-full text-sm outline-none bg-transparent"
          />
        </label>

        {calendarOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white shadow-card rounded-2xl">
            <AvailabilityCalendar
              blockedRanges={blockedRanges}
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={(ci, co) => {
                setCheckIn(ci);
                setCheckOut(co);
                if (ci && co) setCalendarOpen(false);
              }}
            />
          </div>
        )}
      </div>

      {formError && <p className="text-sm text-rausch mb-3">{formError}</p>}

      <button
        onClick={openConfirm}
        className="w-full bg-rausch hover:bg-rausch_dark text-white rounded-xl py-3.5 font-semibold transition-colors"
      >
        Reserve
      </button>

      <p className="text-center text-xs text-subtle mt-3">You won't be charged yet</p>

      {nights > 0 && (
        <div className="mt-5 flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="underline">{formatMoney(listing.price_per_night)} x {nights} night{nights > 1 ? "s" : ""}</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          {listing.cleaning_fee > 0 && (
            <div className="flex justify-between">
              <span className="underline">Cleaning fee</span>
              <span>{formatMoney(listing.cleaning_fee)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="underline">Service fee</span>
            <span>{formatMoney(serviceFee)}</span>
          </div>
          <div className="flex justify-between font-semibold pt-3 border-t border-hairline">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center animate-fadeIn" onClick={() => !submitting && setConfirmOpen(false)}>
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Confirm and pay</h2>
              <button onClick={() => !submitting && setConfirmOpen(false)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-3 border-b border-hairline pb-4 mb-4">
              {listing.photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.photos[0].url} alt={listing.title} className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div>
                <p className="font-medium text-sm">{listing.title}</p>
                <p className="text-xs text-subtle">{listing.city}, {listing.country}</p>
              </div>
            </div>

            <div className="text-sm flex flex-col gap-2 mb-4">
              <div className="flex justify-between"><span className="text-subtle">Dates</span><span>{formatDateRange(checkIn, checkOut)}</span></div>
              <div className="flex justify-between"><span className="text-subtle">Guests</span><span>{guests}</span></div>
            </div>

            <div className="flex flex-col gap-2 text-sm border-t border-hairline pt-4 mb-4">
              <div className="flex justify-between"><span className="underline">{formatMoney(listing.price_per_night)} x {nights} nights</span><span>{formatMoney(subtotal)}</span></div>
              {listing.cleaning_fee > 0 && <div className="flex justify-between"><span className="underline">Cleaning fee</span><span>{formatMoney(listing.cleaning_fee)}</span></div>}
              <div className="flex justify-between"><span className="underline">Service fee</span><span>{formatMoney(serviceFee)}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t border-hairline"><span>Total (USD)</span><span>{formatMoney(total)}</span></div>
            </div>

            <div className="border border-hairline rounded-xl p-3 mb-4 bg-gray-50">
              <p className="text-xs text-subtle">
                Payment card: •••• •••• •••• 4242 (mocked — this is a demo checkout, no real charge is made)
              </p>
            </div>

            {formError && <p className="text-sm text-rausch mb-3">{formError}</p>}

            <button
              onClick={confirmAndPay}
              disabled={submitting}
              className="w-full bg-rausch hover:bg-rausch_dark text-white rounded-xl py-3.5 font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? "Confirming…" : `Confirm and pay ${formatMoney(total)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
