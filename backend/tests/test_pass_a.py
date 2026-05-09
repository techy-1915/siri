"""Siri Boutique Pass A feature tests — uploads, wishlist, reviews, low-stock, notify-safe orders."""
import io
import os
import struct
import zlib
import pytest
import requests

# Read external URL from frontend .env
BASE_URL = ""
with open("/app/frontend/.env") as f:
    for line in f:
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@siriboutique.in"
ADMIN_PASSWORD = "SiriAdmin@2026"
DEMO_EMAIL = "demo@siriboutique.in"
DEMO_PASSWORD = "demo1234"


# ---------- helpers ----------
def _png_bytes() -> bytes:
    """Build a tiny valid PNG (1x1 red pixel)."""
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = b"IHDR" + struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    ihdr_chunk = struct.pack(">I", 13) + ihdr + struct.pack(">I", zlib.crc32(ihdr))
    raw = b"\x00\xff\x00\x00"
    comp = zlib.compress(raw)
    idat = b"IDAT" + comp
    idat_chunk = struct.pack(">I", len(comp)) + idat + struct.pack(">I", zlib.crc32(idat))
    iend = b"IEND"
    iend_chunk = struct.pack(">I", 0) + iend + struct.pack(">I", zlib.crc32(iend))
    return sig + ihdr_chunk + idat_chunk + iend_chunk


def _jpeg_bytes() -> bytes:
    """Tiny minimal JPEG SOI/EOI placeholder. Server treats as image/jpeg by content_type."""
    # Use a small valid-ish JPEG-like blob; server accepts on Content-Type basis.
    return b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00" + b"\x00" * 64 + b"\xff\xd9"


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def customer_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, f"customer login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_h(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def cust_h(customer_token):
    return {"Authorization": f"Bearer {customer_token}"}


# ---------- 1. Uploads ----------
class TestUploads:
    def test_upload_jpeg_returns_url(self, admin_h):
        files = {"file": ("test.jpg", _jpeg_bytes(), "image/jpeg")}
        r = requests.post(f"{API}/admin/uploads", headers=admin_h, files=files)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "kind" in data
        assert data["kind"] in ("storage", "base64")
        if data["kind"] == "storage":
            assert data["url"].startswith("/api/files/")
            assert "path" in data
        else:
            assert data["url"].startswith("data:image/jpeg;base64,")
        # Stash for next test
        pytest.upload_payload = data
        pytest.upload_bytes = _jpeg_bytes()

    def test_get_uploaded_file_roundtrip(self, admin_h):
        # Upload a fresh PNG (deterministic) and retrieve it
        png = _png_bytes()
        files = {"file": ("test.png", png, "image/png")}
        r = requests.post(f"{API}/admin/uploads", headers=admin_h, files=files)
        assert r.status_code == 200, r.text
        data = r.json()
        if data["kind"] != "storage":
            pytest.skip("Object storage not active; base64 fallback returned. Roundtrip via /files n/a.")
        url = f"{BASE_URL}{data['url']}"
        rg = requests.get(url)
        assert rg.status_code == 200, f"{rg.status_code} {rg.text[:200]}"
        # Content-type should be image/* (server stores image/png for this upload)
        ctype = rg.headers.get("Content-Type", "")
        assert ctype.startswith("image/"), f"unexpected ctype {ctype}"
        # Bytes match what we uploaded
        assert rg.content == png, "downloaded bytes != uploaded bytes"

    def test_upload_rejects_text_plain(self, admin_h):
        files = {"file": ("hello.txt", b"hello world", "text/plain")}
        r = requests.post(f"{API}/admin/uploads", headers=admin_h, files=files)
        assert r.status_code == 400, r.text

    def test_upload_requires_admin(self, cust_h):
        files = {"file": ("test.jpg", _jpeg_bytes(), "image/jpeg")}
        r = requests.post(f"{API}/admin/uploads", headers=cust_h, files=files)
        assert r.status_code == 403, r.text

    def test_upload_no_auth(self):
        files = {"file": ("test.jpg", _jpeg_bytes(), "image/jpeg")}
        r = requests.post(f"{API}/admin/uploads", files=files)
        assert r.status_code == 401, r.text


# ---------- 2. Wishlist ----------
class TestWishlist:
    def test_wishlist_no_auth_401(self):
        r = requests.get(f"{API}/wishlist")
        assert r.status_code == 401

    def test_wishlist_add_invalid_pid_404(self, cust_h):
        r = requests.post(f"{API}/wishlist/does-not-exist", headers=cust_h)
        assert r.status_code == 404

    def test_wishlist_add_get_delete(self, cust_h):
        pid = "p02"
        # add
        r = requests.post(f"{API}/wishlist/{pid}", headers=cust_h)
        assert r.status_code == 200, r.text
        # get
        r = requests.get(f"{API}/wishlist", headers=cust_h)
        assert r.status_code == 200
        items = r.json().get("items", [])
        ids = [it["id"] for it in items]
        assert pid in ids
        full = next(it for it in items if it["id"] == pid)
        assert "name" in full and "price" in full  # full product object
        # idempotent add
        r = requests.post(f"{API}/wishlist/{pid}", headers=cust_h)
        assert r.status_code == 200
        # delete
        r = requests.delete(f"{API}/wishlist/{pid}", headers=cust_h)
        assert r.status_code == 200
        # gone
        r = requests.get(f"{API}/wishlist", headers=cust_h)
        ids2 = [it["id"] for it in r.json().get("items", [])]
        assert pid not in ids2


# ---------- 3. Reviews ----------
class TestReviews:
    def test_get_reviews_public(self):
        r = requests.get(f"{API}/products/p01/reviews")
        assert r.status_code == 200
        data = r.json()
        assert "reviews" in data and "count" in data and "average" in data
        assert isinstance(data["reviews"], list)

    def test_post_review_requires_auth(self):
        r = requests.post(f"{API}/products/p01/reviews", json={"rating": 5, "body": "Nice"})
        assert r.status_code == 401

    def test_post_review_invalid_rating_422(self, cust_h):
        r = requests.post(f"{API}/products/p01/reviews",
                          headers={**cust_h, "Content-Type": "application/json"},
                          json={"rating": 7, "body": "out of range"})
        assert r.status_code == 422

        r = requests.post(f"{API}/products/p01/reviews",
                          headers={**cust_h, "Content-Type": "application/json"},
                          json={"rating": 0, "body": "below range"})
        assert r.status_code == 422

    def test_post_review_creates_and_verified_buyer_flag(self, cust_h):
        # Demo customer has no orders for p10 → verified_buyer should be False.
        body_text = "TEST_review body — auto"
        r = requests.post(f"{API}/products/p10/reviews",
                          headers={**cust_h, "Content-Type": "application/json"},
                          json={"rating": 4, "title": "TEST_t", "body": body_text})
        assert r.status_code == 200, r.text
        rev = r.json()["review"]
        assert rev["rating"] == 4
        assert rev["body"] == body_text
        assert rev["verified_buyer"] is False
        pytest.review_id_unverified = rev["id"]
        # GET shows it
        rg = requests.get(f"{API}/products/p10/reviews")
        assert any(x["id"] == rev["id"] for x in rg.json()["reviews"])

    def test_admin_delete_review(self, admin_h, cust_h):
        # create a review then have admin delete it
        r = requests.post(f"{API}/products/p11/reviews",
                          headers={**cust_h, "Content-Type": "application/json"},
                          json={"rating": 3, "body": "TEST_to-delete"})
        assert r.status_code == 200
        rid = r.json()["review"]["id"]

        # customer cannot delete
        r2 = requests.delete(f"{API}/admin/reviews/{rid}", headers=cust_h)
        assert r2.status_code == 403

        # admin can
        r3 = requests.delete(f"{API}/admin/reviews/{rid}", headers=admin_h)
        assert r3.status_code == 200

        # verify gone
        rg = requests.get(f"{API}/products/p11/reviews")
        assert all(x["id"] != rid for x in rg.json()["reviews"])

    def test_verified_buyer_after_order(self, cust_h):
        # Place an order containing p07, then post a review → verified_buyer=True
        order_payload = {
            "items": [{
                "product_id": "p07", "name": "Veera Lehenga", "size": "M",
                "color": "wine", "fabric": "silk", "qty": 1, "price": 38900, "custom": False,
            }],
            "address": {"full_name": "Test", "phone": "9876543210", "line1": "1 Lane",
                        "city": "Hyderabad", "state": "TS", "pincode": "500001"},
            "payment_method": "cod",
        }
        r = requests.post(f"{API}/orders",
                          headers={**cust_h, "Content-Type": "application/json"},
                          json=order_payload)
        assert r.status_code == 200, r.text

        r2 = requests.post(f"{API}/products/p07/reviews",
                           headers={**cust_h, "Content-Type": "application/json"},
                           json={"rating": 5, "body": "TEST_verified"})
        assert r2.status_code == 200
        assert r2.json()["review"]["verified_buyer"] is True


# ---------- 4. Low-stock ----------
class TestLowStock:
    def test_customer_forbidden(self, cust_h):
        r = requests.get(f"{API}/admin/low-stock", headers=cust_h)
        assert r.status_code == 403

    def test_default_threshold(self, admin_h):
        r = requests.get(f"{API}/admin/low-stock", headers=admin_h)
        assert r.status_code == 200
        data = r.json()
        assert data["threshold"] == 3
        for p in data["products"]:
            assert p["stock"] <= 3

    def test_custom_threshold(self, admin_h):
        r = requests.get(f"{API}/admin/low-stock?threshold=5", headers=admin_h)
        assert r.status_code == 200
        data = r.json()
        assert data["threshold"] == 5
        for p in data["products"]:
            assert p["stock"] <= 5


# ---------- 5. Order with notification (no-op safe) + stock decrement ----------
class TestOrderNotifyAndStock:
    def test_place_order_decrements_stock(self, cust_h):
        # Get current stock for p06
        r0 = requests.get(f"{API}/products/p06")
        assert r0.status_code == 200
        before = r0.json()["product"]["stock"]

        order_payload = {
            "items": [{
                "product_id": "p06", "name": "Diya Blouse", "size": "M",
                "color": "indigo", "fabric": "silk", "qty": 2, "price": 6400, "custom": False,
            }],
            "address": {"full_name": "Stock Test", "phone": "9876500006", "line1": "P06",
                        "city": "Hyderabad", "state": "TS", "pincode": "500001"},
            "payment_method": "cod",
        }
        r = requests.post(f"{API}/orders",
                          headers={**cust_h, "Content-Type": "application/json"},
                          json=order_payload)
        assert r.status_code == 200, r.text  # not 500 even though notifications are no-op
        oid = r.json()["order"]["id"]

        # Verify stock decremented by 2
        r2 = requests.get(f"{API}/products/p06")
        after = r2.json()["product"]["stock"]
        assert after == before - 2, f"expected stock {before-2}, got {after}"

        # Status update should also not 500
        admin_login = requests.post(f"{API}/auth/login",
                                    json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        atok = admin_login.json()["token"]
        r3 = requests.put(f"{API}/admin/orders/{oid}/status",
                          headers={"Authorization": f"Bearer {atok}",
                                   "Content-Type": "application/json"},
                          json={"status": "stitching"})
        assert r3.status_code == 200, r3.text
