"""Pydantic schemas: request/response shapes for the API layer.

Kept separate from the ORM models (models.py) so the API contract can
evolve independently of the storage schema.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Users ----------
class UserBase(BaseModel):
    name: str
    email: EmailStr
    is_host: bool = False
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_superhost: bool


# ---------- Amenities ----------
class AmenityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    icon: Optional[str] = None


# ---------- Photos ----------
class PhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    url: str
    position: int


# ---------- Reviews ----------
class ReviewCreate(BaseModel):
    guest_id: int
    booking_id: Optional[int] = None
    rating: int = Field(ge=1, le=5)
    comment: str


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    rating: int
    comment: str
    created_at: datetime
    guest: UserOut


# ---------- Listings ----------
class ListingCreate(BaseModel):
    host_id: int
    title: str
    description: str
    property_type: str
    category: str = "Trending"
    city: str
    country: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: float = Field(gt=0)
    cleaning_fee: float = 0
    max_guests: int = Field(gt=0, default=2)
    bedrooms: int = 1
    beds: int = 1
    bathrooms: float = 1
    photo_urls: list[str] = []
    amenity_names: list[str] = []


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_night: Optional[float] = None
    cleaning_fee: Optional[float] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[float] = None
    photo_urls: Optional[list[str]] = None
    amenity_names: Optional[list[str]] = None
    is_active: Optional[bool] = None


class ListingCardOut(BaseModel):
    """Lightweight shape used for grid/search results."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    city: str
    country: str
    category: str
    property_type: str
    price_per_night: float
    max_guests: int
    cover_photo: Optional[str] = None
    rating: float
    review_count: int
    is_wishlisted: bool = False


class ListingDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    host_id: int
    title: str
    description: str
    property_type: str
    category: str
    city: str
    country: str
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    price_per_night: float
    cleaning_fee: float
    service_fee_rate: float
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: float
    is_active: bool
    photos: list[PhotoOut]
    amenities: list[AmenityOut]
    reviews: list[ReviewOut]
    host: UserOut
    rating: float
    review_count: int
    booked_ranges: list[dict]  # [{"check_in": iso, "check_out": iso}]


# ---------- Bookings ----------
class BookingCreate(BaseModel):
    listing_id: int
    guest_id: int
    check_in: datetime
    check_out: datetime
    guests: int = Field(gt=0)


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    listing_id: int
    guest_id: int
    check_in: datetime
    check_out: datetime
    guests: int
    nightly_rate: float
    nights: int
    subtotal: float
    cleaning_fee: float
    service_fee: float
    total_price: float
    status: str
    created_at: datetime


class BookingWithListingOut(BookingOut):
    listing_title: str
    listing_city: str
    listing_country: str
    cover_photo: Optional[str] = None
    can_review: bool = False
    has_review: bool = False


# ---------- Wishlist ----------
class WishlistToggle(BaseModel):
    user_id: int
    listing_id: int
