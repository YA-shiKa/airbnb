"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Star, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { api } from "@/lib/api";
import type { HostListingRow } from "@/types";
import { formatDateRange, formatMoney } from "@/lib/dates";
import EmptyState from "@/components/EmptyState";

export default function HostDashboardPage() {
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [rows, setRows] = useState<HostListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = () => {
    if (!user) return;
    setLoading(true);
    api.hostDashboard(user.id).then(setRows).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (ready && !user) router.push("/login");
    else if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  const remove = async (id: number) => {
    if (!confirm("Delete this listing? This can't be undone.")) return;
    try {
      await api.deleteListing(id);
      showToast("Listing deleted");
      load();
    } catch {
      showToast("Couldn't delete listing", "error");
    }
  };

  if (!ready || (user && loading)) {
    return <div className="max-w-4xl mx-auto px-4 py-10 text-subtle text-sm">Loading your dashboard…</div>;
  }
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your listings</h1>
        <Link href="/host/listings/new" className="flex items-center gap-2 bg-ink text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-black transition-colors">
          <Plus size={16} /> Create a listing
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No listings yet" description="Create your first listing to start hosting guests." actionLabel="Create a listing" actionHref="/host/listings/new" />
      ) : (
        <div className="flex flex-col gap-6">
          {rows.map((r) => (
            <div key={r.id} className="border border-hairline rounded-2xl p-4">
              <div className="flex gap-4">
                <div className="relative w-32 h-28 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  {r.cover_photo && <Image src={r.cover_photo} alt={r.title} fill sizes="128px" className="object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{r.title}</p>
                      <p className="text-sm text-subtle">{r.city}, {r.country}</p>
                    </div>
                    {!r.is_active && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-subtle">Unpublished</span>}
                  </div>
                  <p className="text-sm mt-2">{formatMoney(r.price_per_night)} / night</p>
                  {r.review_count > 0 && (
                    <p className="text-sm flex items-center gap-1 mt-1">
                      <Star size={14} fill="#222222" strokeWidth={0} /> {r.rating.toFixed(1)} ({r.review_count})
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <Link href={`/host/listings/${r.id}/edit`} className="flex items-center gap-1 text-sm font-semibold underline">
                      <Pencil size={14} /> Edit
                    </Link>
                    <button onClick={() => remove(r.id)} className="flex items-center gap-1 text-sm font-semibold underline text-rausch">
                      <Trash2 size={14} /> Delete
                    </button>
                    <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="text-sm font-semibold underline">
                      {expanded === r.id ? "Hide bookings" : `Bookings (${r.bookings.length})`}
                    </button>
                  </div>
                </div>
              </div>

              {expanded === r.id && (
                <div className="mt-4 border-t border-hairline pt-4">
                  {r.bookings.length === 0 ? (
                    <p className="text-sm text-subtle">No bookings yet.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-subtle">
                          <th className="font-medium pb-2">Guest</th>
                          <th className="font-medium pb-2">Dates</th>
                          <th className="font-medium pb-2">Guests</th>
                          <th className="font-medium pb-2">Total</th>
                          <th className="font-medium pb-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.bookings.map((b) => (
                          <tr key={b.id} className="border-t border-hairline">
                            <td className="py-2">{b.guest_name}</td>
                            <td className="py-2">{formatDateRange(b.check_in.slice(0, 10), b.check_out.slice(0, 10))}</td>
                            <td className="py-2">{b.guests}</td>
                            <td className="py-2">{formatMoney(b.total_price)}</td>
                            <td className="py-2 capitalize">{b.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
