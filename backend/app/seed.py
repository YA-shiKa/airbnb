"""
Seeds the database with hosts, guests, listings (with photos & amenities),
a spread of past/future bookings, and a few reviews -- so the app is
immediately usable/demoable, per the assignment's "Sample Data" note.

Run directly: `python -m app.seed` (also auto-run on first server start
if the DB is empty -- see main.py).
"""
import hashlib
from datetime import datetime, timedelta

from .database import Base, engine, SessionLocal
from . import models

PICSUM = "https://picsum.photos/seed/{seed}/1200/800"


def photo_set(seed_prefix: str, n: int = 5) -> list[str]:
    return [PICSUM.format(seed=f"{seed_prefix}-{i}") for i in range(n)]


def _hash(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            print("Database already seeded, skipping.")
            return

        # ---- Users ----
        hosts = [
            models.User(name="Amara Okafor", email="amara.host@example.com", password_hash=_hash("password123"), is_host=True, is_superhost=True, avatar_url="https://i.pravatar.cc/150?u=amara"),
            models.User(name="Diego Fernandez", email="diego.host@example.com", password_hash=_hash("password123"), is_host=True, is_superhost=False, avatar_url="https://i.pravatar.cc/150?u=diego"),
            models.User(name="Priya Nair", email="priya.host@example.com", password_hash=_hash("password123"), is_host=True, is_superhost=True, avatar_url="https://i.pravatar.cc/150?u=priya"),
            models.User(name="Lars Johansson", email="lars.host@example.com", password_hash=_hash("password123"), is_host=True, is_superhost=False, avatar_url="https://i.pravatar.cc/150?u=lars"),
        ]
        guests = [
            models.User(name="Yashika Ahuja", email="guest@example.com", password_hash=_hash("password123"), is_host=False, avatar_url="https://i.pravatar.cc/150?u=yashika"),
            models.User(name="Rohan Mehta", email="rohan@example.com", password_hash=_hash("password123"), is_host=False, avatar_url="https://i.pravatar.cc/150?u=rohan"),
        ]
        db.add_all(hosts + guests)
        db.flush()

        # ---- Amenities (shared lookup) ----
        amenity_names = [
            "Wifi", "Kitchen", "Free parking", "Air conditioning", "Pool",
            "Washer", "Dryer", "Hot tub", "Fireplace", "Workspace",
            "TV", "Beach access", "Mountain view", "Pet friendly", "Gym",
        ]
        amenities = {name: models.Amenity(name=name) for name in amenity_names}
        db.add_all(amenities.values())
        db.flush()

        def amen(*names):
            return [amenities[n] for n in names]

        # ---- Listings ----
        listing_defs = [
            dict(host=hosts[0], title="Sunlit Beachfront Villa", property_type="Entire villa",
                 category="Beachfront", city="Goa", country="India", address="Candolim Beach Road",
                 latitude=15.5185, longitude=73.7645, price_per_night=142, cleaning_fee=25,
                 max_guests=6, bedrooms=3, beds=4, bathrooms=2,
                 description="Wake up to the sound of waves in this airy villa steps from Candolim beach. Floor-to-ceiling windows, a private plunge pool, and a rooftop deck perfect for sunset dinners.",
                 amenities=amen("Wifi", "Kitchen", "Pool", "Beach access", "Air conditioning")),
            dict(host=hosts[0], title="Cozy Studio in the Old Quarter", property_type="Entire studio",
                 category="Trending", city="Lisbon", country="Portugal", address="Rua de Sao Bento 22",
                 latitude=38.7139, longitude=-9.1523, price_per_night=68, cleaning_fee=15,
                 max_guests=2, bedrooms=1, beds=1, bathrooms=1,
                 description="A snug tiled studio on a cobblestone street, a five minute walk from Bairro Alto's restaurants and miradouros. Perfect base for exploring Lisbon on foot.",
                 amenities=amen("Wifi", "Kitchen", "Workspace", "TV")),
            dict(host=hosts[1], title="Modern Loft with Skyline Views", property_type="Entire loft",
                 category="Trending", city="Buenos Aires", country="Argentina", address="Puerto Madero",
                 latitude=-34.6083, longitude=-58.3629, price_per_night=95, cleaning_fee=20,
                 max_guests=4, bedrooms=2, beds=2, bathrooms=2,
                 description="Floor-to-ceiling glass loft overlooking the docks of Puerto Madero. Designer furniture, a chef's kitchen, and walking distance to the city's best steakhouses.",
                 amenities=amen("Wifi", "Kitchen", "Gym", "Air conditioning", "Workspace")),
            dict(host=hosts[1], title="Patagonian Cabin Retreat", property_type="Entire cabin",
                 category="Cabins", city="Bariloche", country="Argentina", address="Circuito Chico",
                 latitude=-41.1456, longitude=-71.4235, price_per_night=110, cleaning_fee=20,
                 max_guests=5, bedrooms=2, beds=3, bathrooms=1,
                 description="A timber cabin tucked into the forest with a wood-burning fireplace and floor-to-ceiling views of Nahuel Huapi lake. Ideal for hiking and stargazing.",
                 amenities=amen("Fireplace", "Kitchen", "Mountain view", "Wifi", "Pet friendly")),
            dict(host=hosts[2], title="Heritage Haveli Suite", property_type="Private room",
                 category="Amazing views", city="Jaipur", country="India", address="Near City Palace",
                 latitude=26.9255, longitude=75.8235, price_per_night=54, cleaning_fee=10,
                 max_guests=2, bedrooms=1, beds=1, bathrooms=1,
                 description="A restored suite in a 19th-century haveli, with hand-painted frescoes and a private balcony overlooking the Pink City rooftops.",
                 amenities=amen("Wifi", "Air conditioning", "TV", "Workspace")),
            dict(host=hosts[2], title="Backwater Houseboat Stay", property_type="Houseboat",
                 category="Amazing views", city="Alleppey", country="India", address="Vembanad Lake",
                 latitude=9.4981, longitude=76.3388, price_per_night=88, cleaning_fee=15,
                 max_guests=4, bedrooms=2, beds=2, bathrooms=2,
                 description="Drift through Kerala's backwaters aboard a traditional kettuvallam houseboat, with home-cooked meals served on a shaded deck.",
                 amenities=amen("Wifi", "Kitchen", "Mountain view", "TV")),
            dict(host=hosts[3], title="Fjord-View A-Frame Cabin", property_type="Entire cabin",
                 category="Cabins", city="Bergen", country="Norway", address="Fana",
                 latitude=60.2591, longitude=5.3268, price_per_night=132, cleaning_fee=25,
                 max_guests=4, bedrooms=2, beds=2, bathrooms=1,
                 description="An A-frame cabin perched above a fjord, with a wood-fired hot tub on the deck and floor-to-ceiling windows framing the water below.",
                 amenities=amen("Hot tub", "Fireplace", "Wifi", "Mountain view", "Kitchen")),
            dict(host=hosts[3], title="Downtown Design Apartment", property_type="Entire apartment",
                 category="Trending", city="Stockholm", country="Sweden", address="Sodermalm",
                 latitude=59.3151, longitude=18.0710, price_per_night=120, cleaning_fee=20,
                 max_guests=3, bedrooms=1, beds=2, bathrooms=1,
                 description="A light-filled Scandinavian apartment in trendy Sodermalm, blocks from cafes, vintage shops, and the waterfront.",
                 amenities=amen("Wifi", "Kitchen", "Washer", "Workspace", "TV")),
            dict(host=hosts[0], title="Desert Dome Under the Stars", property_type="Unique stay",
                 category="Amazing views", city="Jaisalmer", country="India", address="Sam Sand Dunes",
                 latitude=26.9157, longitude=70.9083, price_per_night=76, cleaning_fee=10,
                 max_guests=2, bedrooms=1, beds=1, bathrooms=1,
                 description="Sleep in a transparent dome amid the dunes of the Thar desert, with unobstructed stargazing and a camel safari at dawn.",
                 amenities=amen("Wifi", "Air conditioning", "Mountain view")),
            dict(host=hosts[1], title="Vineyard Guesthouse", property_type="Guesthouse",
                 category="Countryside", city="Mendoza", country="Argentina", address="Lujan de Cuyo",
                 latitude=-33.0334, longitude=-68.8865, price_per_night=99, cleaning_fee=15,
                 max_guests=4, bedrooms=2, beds=2, bathrooms=1,
                 description="A whitewashed guesthouse on a working vineyard, with a private terrace looking out over rows of Malbec vines to the Andes beyond.",
                 amenities=amen("Wifi", "Pool", "Kitchen", "Mountain view", "Pet friendly")),
            dict(host=hosts[2], title="Minimalist Treehouse", property_type="Treehouse",
                 category="Cabins", city="Wayanad", country="India", address="Vythiri",
                 latitude=11.6854, longitude=76.1320, price_per_night=64, cleaning_fee=10,
                 max_guests=2, bedrooms=1, beds=1, bathrooms=1,
                 description="A minimalist treehouse suspended in a working spice plantation, wrapped in mist most mornings, with monkeys for neighbors.",
                 amenities=amen("Wifi", "Mountain view", "Pet friendly")),
            dict(host=hosts[3], title="Coastal Cottage with Sauna", property_type="Entire cottage",
                 category="Beachfront", city="Malmo", country="Sweden", address="Ribersborg",
                 latitude=55.6122, longitude=12.9694, price_per_night=105, cleaning_fee=15,
                 max_guests=4, bedrooms=2, beds=2, bathrooms=1,
                 description="A red-timber cottage a short walk from the Ribersborg beach, with a private sauna and an outdoor shower for post-swim rinses.",
                 amenities=amen("Wifi", "Kitchen", "Hot tub", "Beach access", "Washer")),
        ]

        listings = []
        for i, d in enumerate(listing_defs):
            listing = models.Listing(
                host_id=d["host"].id,
                title=d["title"],
                description=d["description"],
                property_type=d["property_type"],
                category=d["category"],
                city=d["city"],
                country=d["country"],
                address=d["address"],
                latitude=d["latitude"],
                longitude=d["longitude"],
                price_per_night=d["price_per_night"],
                cleaning_fee=d["cleaning_fee"],
                max_guests=d["max_guests"],
                bedrooms=d["bedrooms"],
                beds=d["beds"],
                bathrooms=d["bathrooms"],
                amenities=d["amenities"],
            )
            db.add(listing)
            db.flush()
            urls = photo_set(d["title"].lower().replace(" ", "-"), 5)
            listing.photos = [models.ListingPhoto(url=u, position=idx) for idx, u in enumerate(urls)]
            listings.append(listing)

        db.flush()

        # ---- Bookings: a mix of past (completed) and future (upcoming) ----
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        def add_booking(listing, guest, start_offset_days, nights, guests_count, status="confirmed"):
            check_in = today + timedelta(days=start_offset_days)
            check_out = check_in + timedelta(days=nights)
            subtotal = round(listing.price_per_night * nights, 2)
            service_fee = round(subtotal * listing.service_fee_rate, 2)
            total = round(subtotal + listing.cleaning_fee + service_fee, 2)
            b = models.Booking(
                listing_id=listing.id, guest_id=guest.id,
                check_in=check_in, check_out=check_out, guests=guests_count,
                nightly_rate=listing.price_per_night, nights=nights,
                subtotal=subtotal, cleaning_fee=listing.cleaning_fee,
                service_fee=service_fee, total_price=total, status=status,
            )
            db.add(b)
            db.flush()
            return b

        # Past, completed stays (for "leave a review" + My Trips history)
        past1 = add_booking(listings[0], guests[0], -20, 4, 2)
        past2 = add_booking(listings[2], guests[0], -40, 3, 2)
        past3 = add_booking(listings[6], guests[1], -15, 5, 3)

        # Upcoming stays (also blocks dates on the listing detail calendar)
        add_booking(listings[0], guests[1], 15, 3, 4)
        add_booking(listings[3], guests[0], 30, 6, 2)
        add_booking(listings[7], guests[1], 10, 2, 2)
        add_booking(listings[9], guests[0], 45, 4, 3)

        db.flush()

        # ---- Reviews for past stays ----
        db.add_all([
            models.Review(listing_id=listings[0].id, guest_id=guests[0].id, booking_id=past1.id,
                           rating=5, comment="The pool at sunset was unreal, and the host left us fresh coconuts every morning. Would book again in a heartbeat."),
            models.Review(listing_id=listings[2].id, guest_id=guests[0].id, booking_id=past2.id,
                           rating=4, comment="Great location right on the water, though the WiFi was patchy for video calls. Everything else was spotless."),
            models.Review(listing_id=listings[6].id, guest_id=guests[1].id, booking_id=past3.id,
                           rating=5, comment="Waking up to fjord views from the hot tub is something I still think about. Impeccably clean and well stocked."),
            # A couple of extra reviews not tied to a specific seeded booking, for rating variety.
            models.Review(listing_id=listings[0].id, guest_id=guests[1].id, rating=5,
                           comment="Best beach villa we've stayed at in Goa. The rooftop deck at sunset sold it for us."),
            models.Review(listing_id=listings[4].id, guest_id=guests[0].id, rating=4,
                           comment="Beautiful frescoes and a really peaceful courtyard. A bit of street noise at night."),
            models.Review(listing_id=listings[9].id, guest_id=guests[1].id, rating=5,
                           comment="The vineyard views with the Andes in the background were worth the trip alone."),
        ])

        db.commit()
        print(f"Seeded {len(hosts)} hosts, {len(guests)} guests, {len(listings)} listings.")
        print("Login as guest@example.com / password123 (or any *.host@example.com / password123).")
    finally:
        db.close()


if __name__ == "__main__":
    run()
