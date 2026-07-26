# Airbnb Clone

A full-stack Airbnb-style booking platform: browse and search stays, view listing
details, book dates, manage trips, leave reviews, save wishlists, and — as a
host — create/edit/delete listings and see bookings against them.

- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS

## Project structure

```
airbnb-clone/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, startup seeding
│   │   ├── database.py      # SQLAlchemy engine/session
│   │   ├── models.py        # ORM schema (see below)
│   │   ├── schemas.py       # Pydantic request/response models
│   │   ├── seed.py          # Demo data (hosts, guests, listings, bookings, reviews)
│   │   ├── utils.py         # Rating aggregation / serialization helpers
│   │   └── routers/
│   │       ├── users.py     # Mocked register/login
│   │       ├── listings.py  # Search, filters, detail, host CRUD, dashboard
│   │       ├── bookings.py  # Create (with overlap validation), my trips, cancel
│   │       ├── reviews.py   # Leave a review for a completed stay
│   │       └── wishlist.py  # Toggle / list favorites
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── page.tsx                          # Explore/search home page
    │   ├── listings/[id]/page.tsx             # Listing detail + booking widget
    │   ├── trips/page.tsx                     # My trips (cancel, leave review)
    │   ├── wishlist/page.tsx                  # Saved listings
    │   ├── login/page.tsx                     # Mocked login/signup
    │   └── host/
    │       ├── page.tsx                       # Host dashboard (listings + bookings)
    │       └── listings/new, [id]/edit        # Create/edit listing forms
    ├── components/                            # Navbar, SearchBar, ListingCard, etc.
    ├── lib/                                   # api client, auth context, toasts, date utils
    └── types/                                 # Shared TypeScript types
```

## Data model

```
User (guest and/or host via is_host flag)
  ├─1:N─ Listing (as host)
  ├─1:N─ Booking (as guest)
  ├─1:N─ Review (as guest)
  └─N:M─ Listing (via Wishlist)

Listing
  ├─1:N─ ListingPhoto
  ├─N:M─ Amenity
  ├─1:N─ Booking
  └─1:N─ Review

Booking ──1:1── Review (optional; a review can be tied to the specific stay)
```

Booking prices are **snapshotted** at creation time (nightly rate, subtotal,
cleaning fee, service fee, total) so past bookings stay accurate even if a
host later changes their price.

## Getting started

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On first run this creates `backend/airbnb.db` (SQLite) and seeds it automatically
with demo hosts, guests, listings, bookings, and reviews. Delete `airbnb.db` and
restart to reseed from scratch.

API docs (interactive): http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
npm install
npm run dev
```

Visit http://localhost:3000.

### Demo accounts (seeded, password `password123` for all)

| Email                      | Role  |
|----------------------------|-------|
| guest@example.com          | Guest |
| rohan@example.com          | Guest |
| amara.host@example.com     | Host  |
| diego.host@example.com     | Host  |
| priya.host@example.com     | Host  |
| lars.host@example.com      | Host  |

The login page also lists every seeded account with one-click sign-in, so you
don't need to type these in by hand.

## API overview

All routes are prefixed `/api`.

| Method | Path                              | Purpose                                      |
|--------|-----------------------------------|-----------------------------------------------|
| POST   | `/users/register`                 | Create an account (guest or host)             |
| POST   | `/users/login`                    | Mocked login                                   |
| GET    | `/listings`                       | Search/filter/paginate active listings         |
| GET    | `/listings/{id}`                  | Listing detail (photos, amenities, reviews, booked date ranges) |
| POST   | `/listings`                       | Create a listing (host)                        |
| PUT    | `/listings/{id}`                  | Update a listing (host)                        |
| DELETE | `/listings/{id}`                  | Delete a listing (host)                        |
| GET    | `/listings/host/{host_id}`        | Host dashboard: owned listings + their bookings |
| GET    | `/listings/meta/categories`       | Distinct category values (for the icon filter row) |
| GET    | `/listings/meta/property-types`   | Distinct property types (for filters)          |
| GET    | `/listings/meta/amenities`        | All amenities (for filters + listing form)     |
| POST   | `/bookings`                       | Create a booking (validates dates/capacity/overlap) |
| GET    | `/bookings/guest/{guest_id}`      | A guest's trips                                |
| POST   | `/bookings/{id}/cancel`           | Cancel a booking                               |
| POST   | `/listings/{id}/reviews`          | Leave a review for a (completed) stay          |
| POST   | `/wishlist/toggle`                | Add/remove a listing from a user's wishlist    |
| GET    | `/wishlist/{user_id}`             | A user's saved listings                        |

## Bonus features implemented

- Leave a review after a completed stay (My Trips → "Leave a review", only
  enabled once `check_out` has passed and the stay hasn't been reviewed yet)
- Superhost badges (seeded on some hosts, shown on the listing detail page)
  and live ratings aggregation (average + count computed from actual reviews)
- A static map on the listing detail page ("Where you'll be"), using the
  listing's stored lat/long
- Wishlist / favorites with optimistic UI
- Responsive layout (mobile/tablet/desktop breakpoints throughout)

Not implemented (left as "Coming soon" per the assignment's mocked-sections
list, or out of scope): interactive map with pins, image upload to cloud
storage (photos are URL-based), dark mode, messaging, identity verification,
real payments.

## Notable design decisions & scope notes

- **Auth is intentionally mocked.** There's no session/JWT layer — the frontend
  holds the logged-in user in `localStorage` after a login/register call, and
  passes `user_id`/`guest_id`/`host_id` explicitly to endpoints that need to
  know who's asking. This keeps the assignment focused on the booking domain
  rather than building a production auth system.
- **Booking overlap validation** happens server-side (`bookings.py`), so two
  guests can never double-book overlapping dates for the same listing, even if
  the frontend's client-side check is bypassed.
- **Prices are snapshotted** on the `Booking` row itself, rather than always
  recomputed from the live `Listing` price, so historical trips/receipts stay
  accurate.
- **Photos are stored as URLs**, not uploaded binary files — the create/edit
  listing form takes photo URLs directly (seed data uses picsum.photos).
- **CORS is wide open** (`allow_origins=["*"]`) for local development
  convenience; lock this down before any real deployment.

## Deploying

This repo is deployment-ready but hasn't been deployed for you — that needs
your own GitHub/hosting accounts. A simple, free path:

1. **Push to GitHub:** `git init`, commit, create a public repo, `git push`.
2. **Backend → Render (or Railway):** New Web Service from the repo, root
   directory `backend/`, build command `pip install -r requirements.txt`,
   start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Note the
   resulting URL (e.g. `https://your-api.onrender.com`).
   - SQLite lives in a file on disk — most free tiers wipe it on redeploy,
     which is fine here since the app reseeds automatically on startup
     whenever the DB is empty.
3. **Frontend → Vercel:** Import the repo, set root directory to `frontend/`,
   add an environment variable `NEXT_PUBLIC_API_URL` pointing at your deployed
   backend URL from step 2, deploy.
4. Update the backend's CORS `allow_origins` in `app/main.py` to your Vercel
   domain instead of `"*"` once you have it, for a tidier production setup.

## Possible next steps

- Real authentication (hashed passwords + sessions/JWT, currently only SHA-256
  hashed for the mocked flow)
- Image upload instead of URL-only photos
- Map view for search results
- Messaging between guests and hosts
- Server-side pagination cursor instead of offset-based paging
