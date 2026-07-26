export interface User {
  id: number;
  name: string;
  email: string;
  is_host: boolean;
  is_superhost: boolean;
  avatar_url?: string | null;
}

export interface Amenity {
  id: number;
  name: string;
  icon?: string | null;
}

export interface Photo {
  id: number;
  url: string;
  position: number;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  guest: User;
}

export interface ListingCard {
  id: number;
  title: string;
  city: string;
  country: string;
  category: string;
  property_type: string;
  price_per_night: number;
  max_guests: number;
  cover_photo?: string | null;
  rating: number;
  review_count: number;
  is_wishlisted: boolean;
}

export interface BookedRange {
  check_in: string;
  check_out: string;
}

export interface ListingDetail {
  id: number;
  host_id: number;
  title: string;
  description: string;
  property_type: string;
  category: string;
  city: string;
  country: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  price_per_night: number;
  cleaning_fee: number;
  service_fee_rate: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  is_active: boolean;
  photos: Photo[];
  amenities: Amenity[];
  reviews: Review[];
  host: User;
  rating: number;
  review_count: number;
  booked_ranges: BookedRange[];
}

export interface Booking {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nightly_rate: number;
  nights: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  status: string;
  created_at: string;
}

export interface TripBooking extends Booking {
  listing_title: string;
  listing_city: string;
  listing_country: string;
  cover_photo?: string | null;
  can_review: boolean;
  has_review: boolean;
}

export interface HostBookingRow {
  id: number;
  guest_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
}

export interface HostListingRow {
  id: number;
  title: string;
  city: string;
  country: string;
  price_per_night: number;
  is_active: boolean;
  cover_photo?: string | null;
  rating: number;
  review_count: number;
  bookings: HostBookingRow[];
}
