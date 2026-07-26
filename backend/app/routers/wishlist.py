"""Wishlist / favorites (bonus feature, kept intentionally simple)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..utils import to_card

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


@router.post("/toggle")
def toggle_wishlist(payload: schemas.WishlistToggle, db: Session = Depends(get_db)):
    existing = db.query(models.Wishlist).filter(
        models.Wishlist.user_id == payload.user_id,
        models.Wishlist.listing_id == payload.listing_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"wishlisted": False}

    db.add(models.Wishlist(user_id=payload.user_id, listing_id=payload.listing_id))
    db.commit()
    return {"wishlisted": True}


@router.get("/{user_id}", response_model=list[schemas.ListingCardOut])
def get_wishlist(user_id: int, db: Session = Depends(get_db)):
    items = db.query(models.Wishlist).options(
        joinedload(models.Wishlist.listing).joinedload(models.Listing.photos),
        joinedload(models.Wishlist.listing).joinedload(models.Listing.reviews),
    ).filter(models.Wishlist.user_id == user_id).all()
    listing_ids = {item.listing_id for item in items}
    return [to_card(item.listing, listing_ids) for item in items if item.listing]
