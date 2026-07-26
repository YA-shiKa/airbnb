"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { Amenity, ListingDetail } from "@/types";

export interface ListingFormValues {
  title: string;
  description: string;
  property_type: string;
  category: string;
  city: string;
  country: string;
  address: string;
  price_per_night: string;
  cleaning_fee: string;
  max_guests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  photo_urls: string[];
  amenity_names: string[];
  is_active: boolean;
}

const CATEGORY_OPTIONS = ["Trending", "Beachfront", "Cabins", "Amazing views", "Countryside"];
const PROPERTY_TYPE_OPTIONS = ["Entire home", "Entire apartment", "Entire villa", "Entire cabin", "Private room", "Guesthouse", "Houseboat", "Treehouse", "Unique stay"];

export function emptyListingForm(): ListingFormValues {
  return {
    title: "", description: "", property_type: PROPERTY_TYPE_OPTIONS[0], category: CATEGORY_OPTIONS[0],
    city: "", country: "", address: "", price_per_night: "", cleaning_fee: "0",
    max_guests: "2", bedrooms: "1", beds: "1", bathrooms: "1",
    photo_urls: [""], amenity_names: [], is_active: true,
  };
}

export function listingToForm(l: ListingDetail): ListingFormValues {
  return {
    title: l.title, description: l.description, property_type: l.property_type, category: l.category,
    city: l.city, country: l.country, address: l.address || "",
    price_per_night: String(l.price_per_night), cleaning_fee: String(l.cleaning_fee),
    max_guests: String(l.max_guests), bedrooms: String(l.bedrooms), beds: String(l.beds), bathrooms: String(l.bathrooms),
    photo_urls: l.photos.length ? l.photos.map((p) => p.url) : [""],
    amenity_names: l.amenities.map((a) => a.name),
    is_active: l.is_active,
  };
}

export default function ListingForm({
  mode,
  listingId,
  initial,
}: {
  mode: "create" | "edit";
  listingId?: number;
  initial: ListingFormValues;
}) {
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [values, setValues] = useState<ListingFormValues>(initial);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getAmenities().then(setAllAmenities).catch(() => {});
  }, []);

  useEffect(() => {
    if (ready && !user) router.push("/login");
  }, [ready, user, router]);

  const set = <K extends keyof ListingFormValues>(key: K, val: ListingFormValues[K]) => setValues((v) => ({ ...v, [key]: val }));

  const toggleAmenity = (name: string) => {
    set("amenity_names", values.amenity_names.includes(name) ? values.amenity_names.filter((a) => a !== name) : [...values.amenity_names, name]);
  };

  const updatePhoto = (i: number, url: string) => {
    const next = [...values.photo_urls];
    next[i] = url;
    set("photo_urls", next);
  };
  const addPhotoField = () => set("photo_urls", [...values.photo_urls, ""]);
  const removePhotoField = (i: number) => set("photo_urls", values.photo_urls.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    const photoUrls = values.photo_urls.map((u) => u.trim()).filter(Boolean);
    if (!values.title.trim() || !values.description.trim() || !values.city.trim() || !values.country.trim() || !values.price_per_night) {
      setError("Fill in title, description, city, country, and price.");
      return;
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      property_type: values.property_type,
      category: values.category,
      city: values.city.trim(),
      country: values.country.trim(),
      address: values.address.trim() || undefined,
      price_per_night: Number(values.price_per_night),
      cleaning_fee: Number(values.cleaning_fee || 0),
      max_guests: Number(values.max_guests || 1),
      bedrooms: Number(values.bedrooms || 1),
      beds: Number(values.beds || 1),
      bathrooms: Number(values.bathrooms || 1),
      photo_urls: photoUrls.length ? photoUrls : ["https://picsum.photos/seed/new-listing/1200/800"],
      amenity_names: values.amenity_names,
    };

    setSubmitting(true);
    try {
      if (mode === "create") {
        const created = await api.createListing({ ...payload, host_id: user.id });
        showToast("Listing published");
        router.push(`/listings/${created.id}`);
      } else if (listingId) {
        await api.updateListing(listingId, { ...payload, is_active: values.is_active });
        showToast("Listing updated");
        router.push("/host");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{mode === "create" ? "Create a listing" : "Edit listing"}</h1>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input value={values.title} onChange={(e) => set("title", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" placeholder="Sunlit Beachfront Villa" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Description</span>
        <textarea value={values.description} onChange={(e) => set("description", e.target.value)} rows={4} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Property type</span>
          <select value={values.property_type} onChange={(e) => set("property_type", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm">
            {PROPERTY_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Category</span>
          <select value={values.category} onChange={(e) => set("category", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm">
            {CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">City</span>
          <input value={values.city} onChange={(e) => set("city", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Country</span>
          <input value={values.country} onChange={(e) => set("country", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Address (optional)</span>
        <input value={values.address} onChange={(e) => set("address", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Price per night ($)</span>
          <input type="number" min={1} value={values.price_per_night} onChange={(e) => set("price_per_night", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Cleaning fee ($)</span>
          <input type="number" min={0} value={values.cleaning_fee} onChange={(e) => set("cleaning_fee", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
        </label>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Guests</span>
          <input type="number" min={1} value={values.max_guests} onChange={(e) => set("max_guests", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Bedrooms</span>
          <input type="number" min={0} value={values.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Beds</span>
          <input type="number" min={1} value={values.beds} onChange={(e) => set("beds", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Baths</span>
          <input type="number" min={0.5} step={0.5} value={values.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className="border border-hairline rounded-lg px-3 py-2 text-sm" />
        </label>
      </div>

      <div>
        <span className="text-sm font-medium block mb-2">Photos (URLs)</span>
        <div className="flex flex-col gap-2">
          {values.photo_urls.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={url}
                onChange={(e) => updatePhoto(i, e.target.value)}
                placeholder="https://…"
                className="flex-1 border border-hairline rounded-lg px-3 py-2 text-sm"
              />
              {values.photo_urls.length > 1 && (
                <button type="button" onClick={() => removePhotoField(i)} className="p-2 text-subtle hover:text-ink">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addPhotoField} className="text-sm font-semibold underline mt-2">
          + Add another photo URL
        </button>
      </div>

      <div>
        <span className="text-sm font-medium block mb-2">Amenities</span>
        <div className="flex flex-wrap gap-2">
          {allAmenities.map((a) => (
            <button
              type="button"
              key={a.id}
              onClick={() => toggleAmenity(a.name)}
              className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                values.amenity_names.includes(a.name) ? "border-ink bg-ink text-white" : "border-hairline hover:border-ink"
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      {mode === "edit" && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={values.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          <span className="text-sm">Published (visible in search)</span>
        </label>
      )}

      {error && <p className="text-sm text-rausch">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-rausch hover:bg-rausch_dark text-white rounded-xl py-3.5 font-semibold transition-colors disabled:opacity-60"
      >
        {submitting ? "Saving…" : mode === "create" ? "Publish listing" : "Save changes"}
      </button>
    </form>
  );
}
