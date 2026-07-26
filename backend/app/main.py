"""
FastAPI application entrypoint.

On startup, creates tables if missing and seeds demo data if the DB is
empty, so `uvicorn app.main:app` alone is enough to get a usable API.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import users, listings, bookings, reviews, wishlist
from . import seed

app = FastAPI(title="Airbnb Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo project: wide open. Lock this down for real deployments.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(reviews.router)
app.include_router(wishlist.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed.run()


@app.get("/api/health")
def health():
    return {"status": "ok"}
