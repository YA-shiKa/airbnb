"""
Listings: home/explore search+filter+pagination, detail page, and the
full host CRUD (create/edit/delete + host dashboard).
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from .. import models, schemas
from ..database import get_db
from ..utils import to_card, to_detail, listing_rating

router = APIRouter(prefix="/api/listings", tags=["listings"])


def _base_query(db: Session):
    return db.query(models.Listing).options(
        joinedload(models.Listing.photos),
        joinedload(models.Listing.reviews),
        joinedload(models.Listing.amenities),
        joinedload(models.Listing.bookings),
    ).filter(models.Listing.is_active == True)  # noqa: E712


def _dates_overlap(listing: models.Listing, check_in: datetime, check_out: datetime) -> bool:
    for b in listing.bookings:
        if b.status != "confirmed":
            continue
        if check_in < b.check_out and check_out > b.check_in:
            return True
    return False


@router.get("", response_model=list[schemas.ListingCardOut])
def search_listings(
    db: Session = Depends(get_db),
    location: Optional[str] = Query(None, description="Matches city or country"),
    check_in: Optional[datetime] = None,
    check_out: Optional[datetime] = None,
    guests: Optional[int] = None,
    category: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    amenities: Optional[str] = Query(None, description="Comma-separated amenity names"),
    user_id: Optional[int] = Query(None, description="If set, marks is_wishlisted for this user"),
    page: int = 1,
    page_size: int = 12,
):
    q = _base_query(db)

    if location:
        like = f"%{location}%"
        q = q.filter(or_(models.Listing.city.ilike(like), models.Listing.country.ilike(like)))
    if guests:
        q = q.filter(models.Listing.max_guests >= guests)
    if category:
        q = q.filter(models.Listing.category == category)
    if property_type:
        q = q.filter(models.Listing.property_type == property_type)
    if min_price is not None:
        q = q.filter(models.Listing.price_per_night >= min_price)
    if max_price is not None:
        q = q.filter(models.Listing.price_per_night <= max_price)

    listings = q.all()

    if amenities:
        wanted = {a.strip().lower() for a in amenities.split(",") if a.strip()}
        listings = [
            l for l in listings
            if wanted.issubset({a.name.lower() for a in l.amenities})
        ]

    if check_in and check_out:
        if check_out <= check_in:
            raise HTTPException(status_code=400, detail="check_out must be after check_in")
        listings = [l for l in listings if not _dates_overlap(l, check_in, check_out)]

    # Sort newest first so pagination is stable across requests.
    listings.sort(key=lambda l: l.id)

    total = len(listings)
    start = (page - 1) * page_size
    page_items = listings[start:start + page_size]

    wishlisted_ids = set()
    if user_id:
        wishlisted_ids = {
            w.listing_id for w in db.query(models.Wishlist).filter(models.Wishlist.user_id == user_id).all()
        }

    results = [to_card(l, wishlisted_ids) for l in page_items]
    return results


@router.get("/meta/categories")
def get_categories(db: Session = Depends(get_db)):
    rows = db.query(models.Listing.category).distinct().all()
    return sorted({r[0] for r in rows})


@router.get("/meta/property-types")
def get_property_types(db: Session = Depends(get_db)):
    rows = db.query(models.Listing.property_type).distinct().all()
    return sorted({r[0] for r in rows})


@router.get("/meta/amenities", response_model=list[schemas.AmenityOut])
def get_all_amenities(db: Session = Depends(get_db)):
    return db.query(models.Amenity).order_by(models.Amenity.name).all()


@router.get("/{listing_id}", response_model=schemas.ListingDetailOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = _base_query(db).filter(models.Listing.id == listing_id).first()
    # Detail page should work even for inactive/host-owned listings (e.g. preview),
    # so fall back to an unfiltered lookup if not found among active ones.
    if not listing:
        listing = db.query(models.Listing).options(
            joinedload(models.Listing.photos),
            joinedload(models.Listing.reviews),
            joinedload(models.Listing.amenities),
            joinedload(models.Listing.bookings),
        ).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return to_detail(listing)


def _sync_photos(db: Session, listing: models.Listing, urls: list[str]):
    for p in list(listing.photos):
        db.delete(p)
    listing.photos = [models.ListingPhoto(url=u, position=i) for i, u in enumerate(urls)]


def _sync_amenities(db: Session, listing: models.Listing, names: list[str]):
    amenities = []
    for name in names:
        amenity = db.query(models.Amenity).filter(models.Amenity.name == name).first()
        if not amenity:
            amenity = models.Amenity(name=name)
            db.add(amenity)
            db.flush()
        amenities.append(amenity)
    listing.amenities = amenities


@router.post("", response_model=schemas.ListingDetailOut)
def create_listing(payload: schemas.ListingCreate, db: Session = Depends(get_db)):
    host = db.query(models.User).get(payload.host_id)
    if not host:
        raise HTTPException(status_code=404, detail="Host not found")

    data = payload.model_dump(exclude={"photo_urls", "amenity_names"})
    listing = models.Listing(**data)
    db.add(listing)
    db.flush()  # assign listing.id before attaching children

    _sync_photos(db, listing, payload.photo_urls)
    _sync_amenities(db, listing, payload.amenity_names)

    # A host account is implied by creating a listing.
    if not host.is_host:
        host.is_host = True

    db.commit()
    db.refresh(listing)
    return to_detail(listing)


@router.put("/{listing_id}", response_model=schemas.ListingDetailOut)
def update_listing(listing_id: int, payload: schemas.ListingUpdate, db: Session = Depends(get_db)):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    data = payload.model_dump(exclude_unset=True, exclude={"photo_urls", "amenity_names"})
    for field, value in data.items():
        setattr(listing, field, value)

    if payload.photo_urls is not None:
        _sync_photos(db, listing, payload.photo_urls)
    if payload.amenity_names is not None:
        _sync_amenities(db, listing, payload.amenity_names)

    db.commit()
    db.refresh(listing)
    return to_detail(listing)


@router.delete("/{listing_id}")
def delete_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    db.delete(listing)
    db.commit()
    return {"deleted": True}


@router.get("/host/{host_id}")
def host_dashboard(host_id: int, db: Session = Depends(get_db)):
    """Owned listings plus their bookings, for the host dashboard."""
    listings = db.query(models.Listing).options(
        joinedload(models.Listing.photos),
        joinedload(models.Listing.reviews),
        joinedload(models.Listing.bookings).joinedload(models.Booking.guest),
    ).filter(models.Listing.host_id == host_id).all()

    out = []
    for l in listings:
        rating, count = listing_rating(l)
        out.append({
            "id": l.id,
            "title": l.title,
            "city": l.city,
            "country": l.country,
            "price_per_night": l.price_per_night,
            "is_active": l.is_active,
            "cover_photo": l.photos[0].url if l.photos else None,
            "rating": rating,
            "review_count": count,
            "bookings": [
                {
                    "id": b.id,
                    "guest_name": b.guest.name,
                    "check_in": b.check_in.isoformat(),
                    "check_out": b.check_out.isoformat(),
                    "guests": b.guests,
                    "total_price": b.total_price,
                    "status": b.status,
                }
                for b in sorted(l.bookings, key=lambda b: b.check_in)
            ],
        })
    return out
