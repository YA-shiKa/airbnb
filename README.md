# Airbnb Clone

A full-stack Airbnb-style booking platform: browse and search stays, view
listing details, book dates, manage trips, leave reviews, save wishlists, and
— as a host — create/edit/delete listings and see bookings against them.

**Live demo:** https://airbnb-seven-pi.vercel.app
**API:** https://airbnb-t1qb.onrender.com
**Source:** https://github.com/YA-shiKa/airbnb

> Note: the backend is hosted on Render's free tier, which spins down after
> inactivity — the first request after a period of idle time can take 30–60
> seconds to wake it up.

---

## Tech stack

| Layer          | Technology |
|----------------|------------|
| Frontend       | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend        | Python, FastAPI |
| ORM            | SQLAlchemy |
| Database       | SQLite |
| Icons          | lucide-react |
| Deployment     | Vercel (frontend) + Render (backend) |

No external/paid APIs are used anywhere — maps, images, and payments are all
mocked or use free, keyless public services (see [Assumptions](#assumptions-made)).

---

## Setup instructions

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On first run this creates `backend/airbnb.db` (SQLite) and seeds it
automatically with demo hosts, guests, listings, bookings, and reviews.
Delete `airbnb.db` and restart to reseed from scratch.

Interactive API docs: http://localhost:8000/docs

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
| amara.host@example.com     | Host (Superhost) |
| diego.host@example.com     | Host |
| priya.host@example.com     | Host (Superhost) |
| lars.host@example.com      | Host |

The login page also lists every seeded account with one-click sign-in, so you
don't need to type these in by hand.

### Deploying your own copy

1. **Push to GitHub**, then:
2. **Backend → Render (or Railway):** New Web Service, root directory
   `backend/`, build command `pip install -r requirements.txt`, start command
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set a `PYTHON_VERSION`
   env var (e.g. `3.11.9`) — some pinned dependencies don't yet have
   prebuilt wheels for the very latest Python versions some platforms default
   to.
3. **Frontend → Vercel:** root directory `frontend/`, environment variable
   `NEXT_PUBLIC_API_URL` set to your Render backend's URL (no trailing
   slash), deploy.
4. Optionally tighten the backend's CORS `allow_origins` in `app/main.py` to
   your exact Vercel domain instead of `"*"`.

---

## Architecture overview

```
airbnb-clone/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, startup seeding
│   │   ├── database.py      # SQLAlchemy engine/session
│   │   ├── models.py        # ORM schema (see Database Schema below)
│   │   ├── schemas.py       # Pydantic request/response models
│   │   ├── seed.py          # Demo data (hosts, guests, listings, bookings, reviews)
│   │   ├── utils.py         # Rating aggregation / serialization helpers
│   │   └── routers/
│   │       ├── users.py     # Mocked register/login
│   │       ├── listings.py  # Search, filters, detail, host CRUD, dashboard
│   │       ├── bookings.py  # Create (with overlap validation), my trips, cancel
│   │       ├── reviews.py   # Leave a review for a completed stay
│   │       └── wishlist.py  # Toggle / list favorites
│   ├── runtime.txt          # Pins Python version for hosting platforms
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── page.tsx                          # Explore/search home page
    │   ├── listings/[id]/page.tsx             # Listing detail + booking widget
    │   ├── trips/page.tsx                     # My trips (cancel, leave review)
    │   ├── wishlist/page.tsx                  # Saved listings
    │   ├── messages/page.tsx                  # Messaging placeholder ("Coming soon")
    │   ├── login/page.tsx                     # Mocked login/signup
    │   └── host/
    │       ├── page.tsx                       # Host dashboard (listings + bookings)
    │       └── listings/new, [id]/edit        # Create/edit listing forms
    ├── components/                            # Navbar, SearchBar, ListingCard,
    │                                           # AvailabilityCalendar, BookingWidget, etc.
    ├── lib/                                   # api client, auth + search + toast contexts, date utils
    └── types/                                 # Shared TypeScript types
```

**Request flow:** the frontend never touches the database directly — every
page calls a typed client in `lib/api.ts`, which hits the FastAPI routers,
which go through SQLAlchemy to SQLite. Search/filter state, once applied
(from either the navbar's segmented search pill or the homepage's inline
search bar), lives in a shared React context (`lib/search-context.tsx`) so
both UIs stay in sync without prop-drilling or URL round-trips.

**Auth flow:** login/register hit the backend once, and the returned user
object is cached client-side (`lib/auth.tsx`, backed by `localStorage`) for
the rest of the session — see [Assumptions](#assumptions-made) for why this
is intentionally simplified rather than a full session/JWT system.

---

## Database schema

```
User (guest and/or host via is_host flag)
  ├─1:N─ Listing (as host)
  ├─1:N─ Booking (as guest)
  ├─1:N─ Review (as guest)
  └─N:M─ Listing (via Wishlist)

Listing
  ├─1:N─ ListingPhoto
  ├─N:M─ Amenity (via listing_amenities join table)
  ├─1:N─ Booking
  └─1:N─ Review

Booking ──1:1── Review (optional; a review can be tied to the specific stay
                        it was left for, via booking_id)
```

**Tables:** `users`, `listings`, `listing_photos`, `amenities`,
`listing_amenities` (join table), `bookings`, `reviews`, `wishlists`.

Notable schema decisions:
- **Booking prices are snapshotted** at creation time (`nightly_rate`,
  `subtotal`, `cleaning_fee`, `service_fee`, `total_price` all stored on the
  `Booking` row itself), so a guest's past trip receipt stays accurate even
  if the host changes the listing's price later.
- **Reviews can exist with or without a `booking_id`** — most are tied to a
  specific completed stay (enforced: only after `check_out`, one review per
  booking), but a few seeded "extra" reviews have no booking link, simulating
  reviews that predate this constraint.
- **Wishlist** is a plain join table (`user_id`, `listing_id`) with a unique
  constraint on the pair, rather than a boolean flag, so it scales to any
  number of saved listings per user.

Full column-level detail lives in `backend/app/models.py`.

---

## API overview

All routes are prefixed `/api`.

| Method | Path                              | Purpose                                        |
|--------|-----------------------------------|-------------------------------------------------|
| POST   | `/users/register`                 | Create an account (guest or host)               |
| POST   | `/users/login`                    | Mocked login                                    |
| GET    | `/users`                          | List seeded accounts (used by the login page's quick-sign-in list) |
| GET    | `/listings`                       | Search/filter/paginate active listings          |
| GET    | `/listings/{id}`                  | Listing detail (photos, amenities, reviews, booked date ranges) |
| POST   | `/listings`                       | Create a listing (host)                         |
| PUT    | `/listings/{id}`                  | Update a listing (host)                         |
| DELETE | `/listings/{id}`                  | Delete a listing (host)                         |
| GET    | `/listings/host/{host_id}`        | Host dashboard: owned listings + their bookings |
| GET    | `/listings/meta/categories`       | Distinct category values (icon filter row)      |
| GET    | `/listings/meta/property-types`   | Distinct property types (filters)               |
| GET    | `/listings/meta/amenities`        | All amenities (filters + listing form)          |
| POST   | `/bookings`                       | Create a booking (validates dates/capacity/overlap) |
| GET    | `/bookings/guest/{guest_id}`      | A guest's trips                                 |
| POST   | `/bookings/{id}/cancel`           | Cancel a booking                                |
| POST   | `/listings/{id}/reviews`          | Leave a review for a (completed) stay           |
| POST   | `/wishlist/toggle`                | Add/remove a listing from a user's wishlist     |
| GET    | `/wishlist/{user_id}`             | A user's saved listings                         |

Interactive, always-current documentation for every endpoint (request/response
schemas, try-it-out) is auto-generated by FastAPI at `/docs`.

---

## Assumptions made

- **Auth is intentionally mocked**, per the assignment's explicit allowance.
  Passwords are SHA-256 hashed (not a production-grade scheme) and there's no
  session/JWT layer — the frontend simply holds the logged-in user's id/role
  in `localStorage` after a login/register call and passes `user_id` /
  `guest_id` / `host_id` explicitly wherever an endpoint needs to know who's
  asking. This keeps the project focused on the booking domain rather than
  reimplementing auth infrastructure.
- **Photos are URLs, not uploaded files.** The create/edit listing form takes
  photo URLs directly (seed data uses picsum.photos placeholder images, per
  the assignment's "all data/images can be mocked" note).
- **The static map** uses OpenStreetMap's own free, keyless embed endpoint —
  no API key or paid service required, satisfying the "static map image is
  fine" allowance while being interactive (pannable/zoomable) rather than a
  flat image.
- **Messaging between guest and host is a placeholder** ("Coming soon"),
  exactly as the assignment lists it under mocked/out-of-scope sections. It's
  reachable from the navbar's user menu and from a "Contact host" button on
  every listing detail page, so the entry points exist even though the
  feature itself doesn't yet.
- **CORS is wide open** (`allow_origins=["*"]`) for ease of local development
  and grading; this would be locked down to a specific origin before any
  real production deployment.
- **SQLite resets on redeploy** on most free hosting tiers (no persistent
  disk). The app is designed around this — it reseeds automatically on
  startup whenever the database is empty, so the demo is always in a known,
  working state after a cold start or redeploy.
- **Booking overlap validation happens server-side**, not just in the
  calendar UI, so it can't be bypassed by calling the API directly.

## Bonus features implemented

- Leave a review after a completed stay (My Trips → "Leave a review", only
  enabled once `check_out` has passed and the stay hasn't been reviewed yet)
- Superhost badges (seeded on some hosts, shown on the listing detail page)
  and live ratings aggregation (average + count computed from actual reviews,
  not cached)
- An interactive map on the listing detail page ("Where you'll be")
- Wishlist / favorites with optimistic UI
- Fully responsive layout (mobile/tablet/desktop breakpoints throughout)
- A segmented, Airbnb-style global search in the navbar (location dropdown
  with suggested destinations, a visual availability calendar with
  Today/Tomorrow/This weekend shortcuts, and a guest counter), in addition to
  the required search bar on the homepage — both share the same underlying
  search state

**Not implemented** (left as placeholders per the assignment's explicit
mocked-sections list, or out of scope): messaging (see above), image upload
to cloud storage, dark mode, identity verification, real payments.

## Possible next steps

- Real authentication (hashed passwords + sessions/JWT)
- Image upload instead of URL-only photos
- Map view with pins across search results (not just a single listing)
- Building out real messaging on top of the existing placeholder/entry points
- Server-side cursor-based pagination instead of offset-based paging
