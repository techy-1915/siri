from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------
logger = logging.getLogger("siri")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
ACCESS_TTL_MIN = 60 * 24 * 7  # 7 days for convenience

app = FastAPI(title="Siri Boutique API")
api = APIRouter(prefix="/api")


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def serialize_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u.get("name", ""),
        "role": u.get("role", "customer"),
        "phone": u.get("phone", ""),
        "measurements": u.get("measurements", {}),
        "created_at": u.get("created_at", ""),
    }


async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class MeasurementsIn(BaseModel):
    bust: Optional[float] = None
    waist: Optional[float] = None
    hip: Optional[float] = None
    shoulder: Optional[float] = None
    sleeveL: Optional[float] = None
    kurtaL: Optional[float] = None
    armhole: Optional[float] = None
    neckD: Optional[float] = None
    neckB: Optional[float] = None
    unit: Optional[str] = "in"
    notes: Optional[str] = ""


class ProductIn(BaseModel):
    name: str
    style: str
    cat: str
    price: float
    was: Optional[float] = None
    hue: Optional[int] = 0
    tag: Optional[str] = None
    description: Optional[str] = ""
    images: List[str] = Field(default_factory=list)  # base64 data URLs
    colors: List[str] = Field(default_factory=lambda: ["wine", "ivory"])
    fabrics: List[str] = Field(default_factory=lambda: ["silk", "georg"])
    sizes: List[str] = Field(default_factory=lambda: ["XS", "S", "M", "L", "XL"])
    stock: int = 10
    tags: List[str] = Field(default_factory=list)
    custom_available: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    style: Optional[str] = None
    cat: Optional[str] = None
    price: Optional[float] = None
    was: Optional[float] = None
    hue: Optional[int] = None
    tag: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    fabrics: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    stock: Optional[int] = None
    tags: Optional[List[str]] = None
    custom_available: Optional[bool] = None


class CartItem(BaseModel):
    product_id: str
    name: str
    image: Optional[str] = None
    size: str = "M"
    color: str = "wine"
    fabric: str = "silk"
    qty: int = 1
    price: float
    custom: bool = False
    measurements: Optional[Dict[str, Any]] = None


class AddressIn(BaseModel):
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: str
    pincode: str


class OrderIn(BaseModel):
    items: List[CartItem]
    address: AddressIn
    payment_method: str = "cod"  # cod | online
    coupon: Optional[str] = None
    notes: Optional[str] = ""


class OrderStatusUpdate(BaseModel):
    status: str  # new | cutting | stitching | shipped | delivered | return | refunded


class BookingIn(BaseModel):
    service_id: str
    service_name: str
    estimate: float
    name: str
    phone: str
    mode: str  # rapido | store
    when_text: str
    address: Optional[str] = ""
    notes: Optional[str] = ""
    measurements: Optional[Dict[str, Any]] = None


class BookingStatusUpdate(BaseModel):
    status: str


class CouponIn(BaseModel):
    code: str
    description: str
    type: str  # percent | flat
    value: float
    min_order: float = 0
    active: bool = True


# -----------------------------------------------------------------------------
# Auth endpoints
# -----------------------------------------------------------------------------
@api.post("/auth/register")
async def register(payload: RegisterIn):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "phone": payload.phone or "",
        "role": "customer",
        "measurements": {},
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    user.pop("_id", None)
    token = create_token(user["id"], user["email"], user["role"])
    return {"token": token, "user": serialize_user(user)}


@api.post("/auth/login")
async def login(payload: LoginIn):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["email"], user["role"])
    return {"token": token, "user": serialize_user(user)}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": serialize_user(user)}


@api.put("/auth/measurements")
async def save_measurements(payload: MeasurementsIn, user: dict = Depends(get_current_user)):
    m = payload.model_dump(exclude_none=False)
    await db.users.update_one({"id": user["id"]}, {"$set": {"measurements": m, "measurements_saved_at": now_iso()}})
    return {"ok": True, "measurements": m}


# -----------------------------------------------------------------------------
# Public catalog endpoints
# -----------------------------------------------------------------------------
@api.get("/products")
async def list_products(cat: Optional[str] = None, tag: Optional[str] = None, q: Optional[str] = None):
    query: Dict[str, Any] = {}
    if cat:
        query["cat"] = cat
    if tag:
        query["tag"] = tag
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"style": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]
    rows = await db.products.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"products": rows}


@api.get("/products/{pid}")
async def get_product(pid: str):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    # recommendations: same category, different id, top 4
    recs = await db.products.find({"cat": p["cat"], "id": {"$ne": pid}}, {"_id": 0}).limit(4).to_list(4)
    return {"product": p, "recommendations": recs}


@api.get("/categories")
async def categories():
    cats = [
        "Designer Dresses", "Designer Blouses", "Indo-Western",
        "Lehengas & Gagras", "Crop Tops & Frocks", "Sarees",
    ]
    return {"categories": cats}


@api.get("/services")
async def services_list():
    return {"services": SERVICES}


@api.get("/recommendations")
async def recommendations(limit: int = 8):
    rows = await db.products.find({"tag": {"$in": ["Bestseller", "New", "Couture"]}}, {"_id": 0}).limit(limit).to_list(limit)
    if not rows:
        rows = await db.products.find({}, {"_id": 0}).limit(limit).to_list(limit)
    return {"products": rows}


# -----------------------------------------------------------------------------
# Coupons
# -----------------------------------------------------------------------------
@api.post("/coupons/validate")
async def validate_coupon(payload: dict):
    code = (payload.get("code") or "").upper().strip()
    subtotal = float(payload.get("subtotal") or 0)
    c = await db.coupons.find_one({"code": code, "active": True}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Invalid coupon")
    if subtotal < float(c.get("min_order", 0)):
        raise HTTPException(status_code=400, detail=f"Minimum order ₹{int(c['min_order'])} required")
    discount = (subtotal * c["value"] / 100.0) if c["type"] == "percent" else float(c["value"])
    discount = round(min(discount, subtotal), 2)
    return {"coupon": c, "discount": discount}


# -----------------------------------------------------------------------------
# Orders (customer)
# -----------------------------------------------------------------------------
@api.post("/orders")
async def place_order(payload: OrderIn, user: dict = Depends(get_current_user)):
    items = [i.model_dump() for i in payload.items]
    subtotal = sum(it["price"] * it["qty"] for it in items)
    custom_charge = sum(800 for it in items if it.get("custom"))
    discount = 0.0
    coupon_obj = None
    if payload.coupon:
        c = await db.coupons.find_one({"code": payload.coupon.upper().strip(), "active": True}, {"_id": 0})
        if c and subtotal >= float(c.get("min_order", 0)):
            coupon_obj = c
            discount = (subtotal * c["value"] / 100.0) if c["type"] == "percent" else float(c["value"])
            discount = round(min(discount, subtotal), 2)
    shipping = 0 if subtotal >= 5000 else 149
    tax = round((subtotal + custom_charge - discount) * 0.05, 2)  # 5% GST
    total = round(subtotal + custom_charge - discount + shipping + tax, 2)
    order_id = "SR-" + str(20000 + int(datetime.now().timestamp()) % 80000)
    has_custom = any(it.get("custom") for it in items)
    order = {
        "id": order_id,
        "user_id": user["id"],
        "customer": user.get("name", ""),
        "phone": payload.address.phone,
        "email": user["email"],
        "items": items,
        "address": payload.address.model_dump(),
        "payment_method": payload.payment_method,
        "subtotal": subtotal,
        "custom_charge": custom_charge,
        "discount": discount,
        "shipping": shipping,
        "tax": tax,
        "total": total,
        "coupon": coupon_obj,
        "status": "new",
        "custom": has_custom,
        "notes": payload.notes,
        "placed_at": now_iso(),
        "history": [{"status": "new", "at": now_iso(), "note": "Order placed"}],
    }
    await db.orders.insert_one(order)
    order.pop("_id", None)
    return {"order": order}


@api.get("/orders/me")
async def my_orders(user: dict = Depends(get_current_user)):
    rows = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("placed_at", -1).to_list(200)
    return {"orders": rows}


@api.get("/orders/{oid}")
async def order_detail(oid: str, user: dict = Depends(get_current_user)):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    if user.get("role") != "admin" and o.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"order": o}


# -----------------------------------------------------------------------------
# Bookings (tailoring services)
# -----------------------------------------------------------------------------
@api.post("/bookings")
async def place_booking(payload: BookingIn, user: dict = Depends(get_current_user)):
    bid = "BK-" + str(1000 + int(datetime.now().timestamp()) % 9000)
    booking = {
        "id": bid,
        "user_id": user["id"],
        **payload.model_dump(),
        "status": "pickup-scheduled" if payload.mode == "rapido" else "in-store",
        "placed_at": now_iso(),
        "history": [{"status": "placed", "at": now_iso()}],
    }
    await db.bookings.insert_one(booking)
    booking.pop("_id", None)
    return {"booking": booking}


@api.get("/bookings/me")
async def my_bookings(user: dict = Depends(get_current_user)):
    rows = await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).sort("placed_at", -1).to_list(200)
    return {"bookings": rows}


# -----------------------------------------------------------------------------
# Admin endpoints
# -----------------------------------------------------------------------------
@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(get_admin)):
    total_orders = await db.orders.count_documents({})
    pending = await db.orders.count_documents({"status": {"$in": ["new", "cutting", "stitching"]}})
    delivered = await db.orders.count_documents({"status": "delivered"})
    revenue_pipeline = [{"$match": {"status": {"$ne": "refunded"}}}, {"$group": {"_id": None, "sum": {"$sum": "$total"}}}]
    rev = await db.orders.aggregate(revenue_pipeline).to_list(1)
    revenue = rev[0]["sum"] if rev else 0
    customers = await db.users.count_documents({"role": "customer"})
    bookings = await db.bookings.count_documents({})
    pending_bookings = await db.bookings.count_documents({"status": {"$nin": ["delivered", "completed", "cancelled"]}})

    # last 12 months bar data
    now = datetime.now(timezone.utc)
    months = []
    for i in range(11, -1, -1):
        m = (now.month - i - 1) % 12 + 1
        y = now.year - ((now.month - i - 1) // 12 * -1 if now.month - i <= 0 else 0)
        if now.month - i <= 0:
            y = now.year - 1
        else:
            y = now.year
        months.append({"label": ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1], "value": 0})
    # simple last 12 days revenue
    bars = []
    for i in range(11, -1, -1):
        d_start = now - timedelta(days=i+1)
        d_end = now - timedelta(days=i)
        agg = await db.orders.aggregate([
            {"$match": {"placed_at": {"$gte": d_start.isoformat(), "$lt": d_end.isoformat()}}},
            {"$group": {"_id": None, "sum": {"$sum": "$total"}}},
        ]).to_list(1)
        bars.append({"label": d_start.strftime("%d %b"), "value": int(agg[0]["sum"]) if agg else 0})

    # category breakdown
    cat_agg = await db.orders.aggregate([
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.name", "value": {"$sum": "$items.price"}}},
        {"$sort": {"value": -1}},
        {"$limit": 6},
    ]).to_list(6)

    return {
        "kpis": {
            "revenue": revenue,
            "orders": total_orders,
            "pending": pending,
            "customers": customers,
            "delivered": delivered,
            "bookings": bookings,
            "pending_bookings": pending_bookings,
        },
        "bars": bars,
        "categories": [{"name": c["_id"], "value": c["value"]} for c in cat_agg],
    }


@api.get("/admin/orders")
async def admin_orders(status_filter: Optional[str] = None, _: dict = Depends(get_admin)):
    q = {"status": status_filter} if status_filter else {}
    rows = await db.orders.find(q, {"_id": 0}).sort("placed_at", -1).to_list(500)
    return {"orders": rows}


@api.put("/admin/orders/{oid}/status")
async def admin_update_status(oid: str, payload: OrderStatusUpdate, _: dict = Depends(get_admin)):
    o = await db.orders.find_one({"id": oid})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    history = o.get("history", [])
    history.append({"status": payload.status, "at": now_iso()})
    await db.orders.update_one({"id": oid}, {"$set": {"status": payload.status, "history": history}})
    return {"ok": True}


@api.get("/admin/bookings")
async def admin_bookings(_: dict = Depends(get_admin)):
    rows = await db.bookings.find({}, {"_id": 0}).sort("placed_at", -1).to_list(500)
    return {"bookings": rows}


@api.put("/admin/bookings/{bid}/status")
async def admin_update_booking(bid: str, payload: BookingStatusUpdate, _: dict = Depends(get_admin)):
    b = await db.bookings.find_one({"id": bid})
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")
    history = b.get("history", [])
    history.append({"status": payload.status, "at": now_iso()})
    await db.bookings.update_one({"id": bid}, {"$set": {"status": payload.status, "history": history}})
    return {"ok": True}


@api.get("/admin/customers")
async def admin_customers(_: dict = Depends(get_admin)):
    rows = await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    # add order counts
    for r in rows:
        cnt = await db.orders.count_documents({"user_id": r["id"]})
        agg = await db.orders.aggregate([
            {"$match": {"user_id": r["id"]}},
            {"$group": {"_id": None, "sum": {"$sum": "$total"}}},
        ]).to_list(1)
        r["orders_count"] = cnt
        r["lifetime_value"] = agg[0]["sum"] if agg else 0
    return {"customers": rows}


@api.post("/admin/products")
async def admin_create_product(payload: ProductIn, _: dict = Depends(get_admin)):
    pid = "p" + uuid.uuid4().hex[:8]
    p = {"id": pid, **payload.model_dump(), "created_at": now_iso()}
    await db.products.insert_one(p)
    p.pop("_id", None)
    return {"product": p}


@api.put("/admin/products/{pid}")
async def admin_update_product(pid: str, payload: ProductUpdate, _: dict = Depends(get_admin)):
    update = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.products.update_one({"id": pid}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    return {"product": p}


@api.delete("/admin/products/{pid}")
async def admin_delete_product(pid: str, _: dict = Depends(get_admin)):
    res = await db.products.delete_one({"id": pid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@api.get("/admin/coupons")
async def admin_list_coupons(_: dict = Depends(get_admin)):
    rows = await db.coupons.find({}, {"_id": 0}).to_list(200)
    return {"coupons": rows}


@api.post("/admin/coupons")
async def admin_create_coupon(payload: CouponIn, _: dict = Depends(get_admin)):
    c = {**payload.model_dump(), "code": payload.code.upper(), "created_at": now_iso()}
    await db.coupons.update_one({"code": c["code"]}, {"$set": c}, upsert=True)
    return {"coupon": c}


@api.delete("/admin/coupons/{code}")
async def admin_delete_coupon(code: str, _: dict = Depends(get_admin)):
    await db.coupons.delete_one({"code": code.upper()})
    return {"ok": True}


# -----------------------------------------------------------------------------
# Seed data
# -----------------------------------------------------------------------------
SERVICES = [
    {"id": "svc-blouse",  "name": "Designer blouse stitching",       "from": 1200, "days": 5,  "desc": "Maggam, hand-embroidery, princess-cut, padded blouses.", "icon": "scissor"},
    {"id": "svc-pleat",   "name": "Saree pre-pleating & box folding", "from":  350, "days": 1,  "desc": "Pickup your saree, return it pre-pleated and ready to drape.", "icon": "scissor"},
    {"id": "svc-alter",   "name": "Alteration & resizing",            "from":  250, "days": 2,  "desc": "Take in or let out any garment by 1-4 sizes, hem adjustments.", "icon": "ruler"},
    {"id": "svc-hem",     "name": "Hemming & finishing",              "from":  180, "days": 1,  "desc": "Hem dresses, sarees, suits. Invisible or contrast finish.", "icon": "ruler"},
    {"id": "svc-dress",   "name": "Custom dress / frock making",      "from": 2800, "days": 10, "desc": "Build a one-off dress from your fabric or ours. Pattern + cut + stitch.", "icon": "scissor"},
    {"id": "svc-maggam",  "name": "Maggam work (hand)",               "from": 1800, "days": 12, "desc": "Hand-zardosi, beadwork, sequins on blouses, dupattas, lehenga panels.", "icon": "scissor"},
    {"id": "svc-emb",     "name": "Machine embroidery",               "from":  900, "days": 4,  "desc": "Computerised embroidery on blouses, kurtas, dupattas.", "icon": "scissor"},
    {"id": "svc-mat",     "name": "Wholesale fabric / materials",     "from":    0, "days": 0,  "desc": "Bulk fabric, dupattas, linings, accessories. By appointment.", "icon": "store"},
]

SEED_PRODUCTS = [
    {"id": "p01", "name": "Anaara Lehenga",    "style": "Maggam work · Maroon",          "price": 28400, "was": 32000, "hue": 20,  "tag": "Bestseller", "cat": "Lehengas & Gagras", "tags": ["lehenga","wedding","maggam"], "stock": 6,  "description": "A heritage Maggam-work lehenga in deep maroon, hand-finished with antique gold thread."},
    {"id": "p02", "name": "Mahira Anarkali",   "style": "Indo-western · Ivory",          "price": 18900, "was": None,  "hue": 80,  "tag": "New",        "cat": "Indo-Western",      "tags": ["anarkali","party","silk"], "stock": 9,  "description": "An ivory Anarkali with delicate sequin work. Floor-grazing flare and embroidered yoke."},
    {"id": "p03", "name": "Saanvi Saree",      "style": "Box-pleated · Plum",            "price": 22500, "was": None,  "hue": 350, "tag": None,         "cat": "Sarees",            "tags": ["saree","silk","wedding"], "stock": 5,  "description": "Box-pleated raw silk saree with a hand-rolled gold border. Pre-pleating included."},
    {"id": "p04", "name": "Ira Crop & Frock",  "style": "Crop top + long frock · Ochre", "price": 12400, "was": None,  "hue": 65,  "tag": None,         "cat": "Crop Tops & Frocks","tags": ["crop","frock","party"], "stock": 12, "description": "Mughal-inspired ochre frock paired with a hand-embroidered crop top."},
    {"id": "p05", "name": "Nehrika Designer",  "style": "Designer dress · Olive",        "price": 16800, "was": 18000, "hue": 110, "tag": "Sale",       "cat": "Designer Dresses",  "tags": ["dress","party"], "stock": 8,  "description": "An olive A-line dress in featherweight georgette with statement sleeves."},
    {"id": "p06", "name": "Diya Blouse",       "style": "Designer blouse · Indigo",      "price":  6400, "was": None,  "hue": 250, "tag": None,         "cat": "Designer Blouses",  "tags": ["blouse","maggam"], "stock": 16, "description": "Indigo padded blouse with mirrored maggam border. Fully lined and finished."},
    {"id": "p07", "name": "Veera Lehenga",     "style": "Hand zardosi · Wine",           "price": 38900, "was": None,  "hue": 10,  "tag": "Couture",    "cat": "Lehengas & Gagras", "tags": ["lehenga","bridal","zardosi"], "stock": 3, "description": "Hand-zardosi bridal lehenga in deep wine. Six panels of motif and a heavy can-can."},
    {"id": "p08", "name": "Tara Saree",        "style": "Pre-pleated tussar · Gold",     "price": 19400, "was": None,  "hue": 75,  "tag": None,         "cat": "Sarees",            "tags": ["saree","pleated"], "stock": 7, "description": "Tussar saree in honey-gold with pre-pleated pallu and box-folded skirt."},
    {"id": "p09", "name": "Kaavya Indo-West",  "style": "Cape gown · Sage",              "price": 17200, "was": None,  "hue": 140, "tag": "New",        "cat": "Indo-Western",      "tags": ["indo","gown","party"], "stock": 9, "description": "Sage cape gown with sheer back and minimal bead-edge cape."},
    {"id": "p10", "name": "Reva Designer",     "style": "Linen dress · Blush",           "price": 11900, "was": None,  "hue": 25,  "tag": None,         "cat": "Designer Dresses",  "tags": ["dress","daily"], "stock": 14, "description": "Blush linen dress with shell buttons and a soft tie waist. Daily ease."},
    {"id": "p11", "name": "Mira Frock",        "style": "Long frock · Sky",              "price": 14600, "was": None,  "hue": 220, "tag": None,         "cat": "Crop Tops & Frocks","tags": ["frock","party"], "stock": 10, "description": "Sky-blue tiered long frock with hand-embroidered hem and ribbon belt."},
    {"id": "p12", "name": "Sira Blouse",       "style": "Maggam blouse · Terracotta",    "price":  7600, "was": None,  "hue": 35,  "tag": "Maggam",     "cat": "Designer Blouses",  "tags": ["blouse","maggam"], "stock": 11, "description": "Terracotta maggam blouse with hand-set crystals and silk lining."},
]

SEED_COUPONS = [
    {"code": "SIRI10",   "description": "10% off your first order", "type": "percent", "value": 10, "min_order": 0,    "active": True},
    {"code": "WED2500",  "description": "Flat ₹2500 off bridal",     "type": "flat",   "value": 2500, "min_order": 25000, "active": True},
    {"code": "SPRING15", "description": "15% off Spring edit",       "type": "percent", "value": 15, "min_order": 5000, "active": True},
]


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.bookings.create_index("id", unique=True)
    await db.coupons.create_index("code", unique=True)

    # Seed admin
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Siri Admin",
            "phone": "+91 98855 07423",
            "role": "admin",
            "measurements": {},
            "created_at": now_iso(),
        })
        logger.info("Seeded admin user: %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Seed demo customer
    demo_email = "demo@siriboutique.in"
    demo_existing = await db.users.find_one({"email": demo_email})
    if not demo_existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": demo_email,
            "password_hash": hash_password("demo1234"),
            "name": "Aanya Reddy",
            "phone": "+91 98765 43210",
            "role": "customer",
            "measurements": {"bust":36,"waist":28,"hip":38,"shoulder":14,"sleeveL":18,"kurtaL":42,"armhole":16,"neckD":7,"neckB":6,"unit":"in"},
            "created_at": now_iso(),
        })

    # Seed products
    if await db.products.count_documents({}) == 0:
        for p in SEED_PRODUCTS:
            await db.products.insert_one({
                **p,
                "images": [],
                "colors": ["wine","ivory","olive","indigo","gold"],
                "fabrics": ["silk","georg","velvet"],
                "sizes": ["XS","S","M","L","XL"],
                "custom_available": True,
                "created_at": now_iso(),
            })
        logger.info("Seeded %d products", len(SEED_PRODUCTS))

    # Seed coupons
    for c in SEED_COUPONS:
        await db.coupons.update_one({"code": c["code"]}, {"$set": {**c, "created_at": now_iso()}}, upsert=True)


@app.on_event("shutdown")
async def shutdown():
    client.close()


@api.get("/")
async def root():
    return {"app": "Siri Boutique API", "ok": True}


# Mount router & CORS
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
