"""
Booking flow: create a booking (validated against overlaps + capacity),
list a guest's trips, and cancel a booking (frees the dates again).
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _has_overlap(db: Session, listing_id: int, check_in: datetime, check_out: datetime) -> bool:
    existing = db.query(models.Booking).filter(
        models.Booking.listing_id == listing_id,
        models.Booking.status == "confirmed",
    ).all()
    for b in existing:
        if check_in < b.check_out and check_out > b.check_in:
            return True
    return False


@router.post("", response_model=schemas.BookingOut)
def create_booking(payload: schemas.BookingCreate, db: Session = Depends(get_db)):
    if payload.check_out <= payload.check_in:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    if payload.check_in < datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0):
        raise HTTPException(status_code=400, detail="Check-in cannot be in the past")

    listing = db.query(models.Listing).get(payload.listing_id)
    if not listing or not listing.is_active:
        raise HTTPException(status_code=404, detail="Listing not found")

    guest = db.query(models.User).get(payload.guest_id)
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")

    if payload.guests > listing.max_guests:
        raise HTTPException(
            status_code=400,
            detail=f"This listing sleeps a maximum of {listing.max_guests} guests",
        )

    if _has_overlap(db, listing.id, payload.check_in, payload.check_out):
        raise HTTPException(status_code=409, detail="Those dates are no longer available")

    nights = (payload.check_out - payload.check_in).days
    subtotal = round(listing.price_per_night * nights, 2)
    cleaning_fee = listing.cleaning_fee or 0
    service_fee = round(subtotal * listing.service_fee_rate, 2)
    total_price = round(subtotal + cleaning_fee + service_fee, 2)

    booking = models.Booking(
        listing_id=listing.id,
        guest_id=guest.id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests=payload.guests,
        nightly_rate=listing.price_per_night,
        nights=nights,
        subtotal=subtotal,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        total_price=total_price,
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


@router.get("/guest/{guest_id}", response_model=list[schemas.BookingWithListingOut])
def my_trips(guest_id: int, db: Session = Depends(get_db)):
    bookings = db.query(models.Booking).options(
        joinedload(models.Booking.listing).joinedload(models.Listing.photos),
        joinedload(models.Booking.review),
    ).filter(models.Booking.guest_id == guest_id).order_by(models.Booking.check_in.desc()).all()

    now = datetime.utcnow()
    out = []
    for b in bookings:
        is_past = b.check_out < now
        out.append({
            "id": b.id,
            "listing_id": b.listing_id,
            "guest_id": b.guest_id,
            "check_in": b.check_in,
            "check_out": b.check_out,
            "guests": b.guests,
            "nightly_rate": b.nightly_rate,
            "nights": b.nights,
            "subtotal": b.subtotal,
            "cleaning_fee": b.cleaning_fee,
            "service_fee": b.service_fee,
            "total_price": b.total_price,
            "status": b.status,
            "created_at": b.created_at,
            "listing_title": b.listing.title,
            "listing_city": b.listing.city,
            "listing_country": b.listing.country,
            "cover_photo": b.listing.photos[0].url if b.listing.photos else None,
            "can_review": is_past and b.status == "confirmed" and b.review is None,
            "has_review": b.review is not None,
        })
    return out


@router.post("/{booking_id}/cancel", response_model=schemas.BookingOut)
def cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    return booking
