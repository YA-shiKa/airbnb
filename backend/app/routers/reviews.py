"""Reviews: a guest may leave one review per completed booking (bonus feature)."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/listings", tags=["reviews"])


@router.post("/{listing_id}/reviews", response_model=schemas.ReviewOut)
def create_review(listing_id: int, payload: schemas.ReviewCreate, db: Session = Depends(get_db)):
    listing = db.query(models.Listing).get(listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if payload.booking_id is not None:
        booking = db.query(models.Booking).get(payload.booking_id)
        if not booking or booking.listing_id != listing_id or booking.guest_id != payload.guest_id:
            raise HTTPException(status_code=400, detail="Booking does not match this listing/guest")
        if booking.check_out > datetime.utcnow():
            raise HTTPException(status_code=400, detail="You can review a stay after checkout")
        if booking.review is not None:
            raise HTTPException(status_code=400, detail="This stay has already been reviewed")

    review = models.Review(
        listing_id=listing_id,
        guest_id=payload.guest_id,
        booking_id=payload.booking_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
