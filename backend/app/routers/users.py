"""
User registration / login.

Auth is intentionally mocked per the assignment brief ("real user
authentication may be simplified/mocked, but a notion of guest vs
host is needed"). There is no session/JWT layer: the frontend simply
holds the logged-in user's id/role in memory after login and passes
`?user_id=` where an endpoint needs to know who's asking.
"""
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/users", tags=["users"])


def _hash(password: str) -> str:
    # Not production-grade security -- just enough to avoid storing plaintext
    # for a mocked-auth assignment. Do not reuse this pattern for real auth.
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/register", response_model=schemas.UserOut)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=_hash(payload.password),
        is_host=payload.is_host,
        avatar_url=payload.avatar_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.UserOut)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or user.password_hash != _hash(payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    """Used by the mocked login screen to let a reviewer pick a seeded account."""
    return db.query(models.User).all()
