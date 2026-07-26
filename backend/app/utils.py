"""Small shared helpers used across routers."""
from statistics import mean
from . import models


def listing_rating(listing: models.Listing) -> tuple[float, int]:
    """Return (average_rating, review_count) for a listing, rounded to 2dp."""
    if not listing.reviews:
        return (0.0, 0)
    avg = mean(r.rating for r in listing.reviews)
    return (round(avg, 2), len(listing.reviews))


def cover_photo(listing: models.Listing) -> str | None:
    return listing.photos[0].url if listing.photos else None


def to_card(listing: models.Listing, wishlisted_ids: set[int] | None = None) -> dict:
    rating, count = listing_rating(listing)
    return {
        "id": listing.id,
        "title": listing.title,
        "city": listing.city,
        "country": listing.country,
        "category": listing.category,
        "property_type": listing.property_type,
        "price_per_night": listing.price_per_night,
        "max_guests": listing.max_guests,
        "cover_photo": cover_photo(listing),
        "rating": rating,
        "review_count": count,
        "is_wishlisted": listing.id in wishlisted_ids if wishlisted_ids else False,
    }


def to_detail(listing: models.Listing) -> dict:
    rating, count = listing_rating(listing)
    booked_ranges = [
        {"check_in": b.check_in.isoformat(), "check_out": b.check_out.isoformat()}
        for b in listing.bookings
        if b.status == "confirmed"
    ]
    return {
        "id": listing.id,
        "host_id": listing.host_id,
        "title": listing.title,
        "description": listing.description,
        "property_type": listing.property_type,
        "category": listing.category,
        "city": listing.city,
        "country": listing.country,
        "address": listing.address,
        "latitude": listing.latitude,
        "longitude": listing.longitude,
        "price_per_night": listing.price_per_night,
        "cleaning_fee": listing.cleaning_fee,
        "service_fee_rate": listing.service_fee_rate,
        "max_guests": listing.max_guests,
        "bedrooms": listing.bedrooms,
        "beds": listing.beds,
        "bathrooms": listing.bathrooms,
        "is_active": listing.is_active,
        "photos": listing.photos,
        "amenities": listing.amenities,
        "reviews": listing.reviews,
        "host": listing.host,
        "rating": rating,
        "review_count": count,
        "booked_ranges": booked_ranges,
    }
