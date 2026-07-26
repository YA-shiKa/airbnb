import type {
  ListingCard, ListingDetail, Booking, TripBooking, HostListingRow,
  User, Amenity,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore parse errors on error responses */
    }
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

export { ApiError };

export interface SearchParams {
  location?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  category?: string;
  property_type?: string;
  min_price?: number;
  max_price?: number;
  amenities?: string;
  user_id?: number;
  page?: number;
  page_size?: number;
}

function toQuery(params: Record<string, any>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const api = {
  // ---- Listings ----
  searchListings: (params: SearchParams) =>
    request<ListingCard[]>(`/api/listings${toQuery(params)}`),

  getListing: (id: number | string) => request<ListingDetail>(`/api/listings/${id}`),

  createListing: (payload: any) =>
    request<ListingDetail>(`/api/listings`, { method: "POST", body: JSON.stringify(payload) }),

  updateListing: (id: number | string, payload: any) =>
    request<ListingDetail>(`/api/listings/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  deleteListing: (id: number | string) =>
    request<{ deleted: boolean }>(`/api/listings/${id}`, { method: "DELETE" }),

  hostDashboard: (hostId: number) => request<HostListingRow[]>(`/api/listings/host/${hostId}`),

  getCategories: () => request<string[]>(`/api/listings/meta/categories`),
  getPropertyTypes: () => request<string[]>(`/api/listings/meta/property-types`),
  getAmenities: () => request<Amenity[]>(`/api/listings/meta/amenities`),

  // ---- Bookings ----
  createBooking: (payload: { listing_id: number; guest_id: number; check_in: string; check_out: string; guests: number }) =>
    request<Booking>(`/api/bookings`, { method: "POST", body: JSON.stringify(payload) }),

  myTrips: (guestId: number) => request<TripBooking[]>(`/api/bookings/guest/${guestId}`),

  cancelBooking: (bookingId: number) =>
    request<Booking>(`/api/bookings/${bookingId}/cancel`, { method: "POST" }),

  // ---- Reviews ----
  createReview: (listingId: number, payload: { guest_id: number; booking_id?: number; rating: number; comment: string }) =>
    request(`/api/listings/${listingId}/reviews`, { method: "POST", body: JSON.stringify(payload) }),

  // ---- Wishlist ----
  toggleWishlist: (userId: number, listingId: number) =>
    request<{ wishlisted: boolean }>(`/api/wishlist/toggle`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, listing_id: listingId }),
    }),

  getWishlist: (userId: number) => request<ListingCard[]>(`/api/wishlist/${userId}`),

  // ---- Users / mocked auth ----
  register: (payload: { name: string; email: string; password: string; is_host: boolean }) =>
    request<User>(`/api/users/register`, { method: "POST", body: JSON.stringify(payload) }),

  login: (payload: { email: string; password: string }) =>
    request<User>(`/api/users/login`, { method: "POST", body: JSON.stringify(payload) }),

  listUsers: () => request<User[]>(`/api/users`),
};
