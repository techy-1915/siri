"""Siri Boutique backend API tests."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://custom-stitch-hub-3.preview.emergentagent.com").rstrip("/")
# Try to read frontend .env to get correct external URL
try:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
except Exception:
    pass

API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@siriboutique.in"
ADMIN_PASSWORD = "SiriAdmin@2026"
DEMO_EMAIL = "demo@siriboutique.in"
DEMO_PASSWORD = "demo1234"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def customer_token(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, f"Demo login failed: {r.status_code} {r.text}"
    return r.json()["token"]


def admin_h(t): return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}
def cust_h(t): return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


# ----------------------------- Health & Public -----------------------------
class TestPublic:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_categories(self, session):
        r = session.get(f"{API}/categories")
        assert r.status_code == 200
        data = r.json()
        cats = data["categories"]
        expected = {"Designer Dresses", "Designer Blouses", "Indo-Western",
                    "Lehengas & Gagras", "Crop Tops & Frocks", "Sarees"}
        assert expected.issubset(set(cats))

    def test_services(self, session):
        r = session.get(f"{API}/services")
        assert r.status_code == 200
        services = r.json()["services"]
        assert len(services) == 8
        ids = {s["id"] for s in services}
        assert {"svc-blouse", "svc-pleat", "svc-alter", "svc-hem",
                "svc-dress", "svc-maggam", "svc-emb", "svc-mat"}.issubset(ids)

    def test_products_list(self, session):
        r = session.get(f"{API}/products")
        assert r.status_code == 200
        products = r.json()["products"]
        assert len(products) >= 12
        # ensure no _id leaked
        for p in products:
            assert "_id" not in p
            assert "id" in p

    def test_product_detail_with_recs(self, session):
        r = session.get(f"{API}/products")
        pid = r.json()["products"][0]["id"]
        r2 = session.get(f"{API}/products/{pid}")
        assert r2.status_code == 200
        body = r2.json()
        assert body["product"]["id"] == pid
        assert "_id" not in body["product"]
        assert isinstance(body["recommendations"], list)
        for rec in body["recommendations"]:
            assert "_id" not in rec
            assert rec["id"] != pid

    def test_product_404(self, session):
        r = session.get(f"{API}/products/does-not-exist")
        assert r.status_code == 404


# ----------------------------- Auth -----------------------------
class TestAuth:
    def test_register_and_login(self, session):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        pwd = "Test@1234"
        r = session.post(f"{API}/auth/register", json={"email": email, "password": pwd, "name": "Test User", "phone": "+91 9999999999"})
        assert r.status_code == 200, r.text
        body = r.json()
        assert "token" in body and body["user"]["email"] == email.lower()
        assert body["user"]["role"] == "customer"
        assert "_id" not in body["user"]

        # duplicate
        r2 = session.post(f"{API}/auth/register", json={"email": email, "password": pwd, "name": "Dup", "phone": ""})
        assert r2.status_code == 400

        # login
        r3 = session.post(f"{API}/auth/login", json={"email": email, "password": pwd})
        assert r3.status_code == 200
        token = r3.json()["token"]

        # /auth/me
        r4 = session.get(f"{API}/auth/me", headers=cust_h(token))
        assert r4.status_code == 200
        assert r4.json()["user"]["email"] == email

    def test_login_invalid(self, session):
        r = session.post(f"{API}/auth/login", json={"email": "nope@example.com", "password": "x"})
        assert r.status_code == 401

    def test_me_without_token(self, session):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_save_measurements(self, session, customer_token):
        m = {"bust": 34, "waist": 28, "hip": 36, "unit": "in", "notes": "test"}
        r = session.put(f"{API}/auth/measurements", json=m, headers=cust_h(customer_token))
        assert r.status_code == 200
        assert r.json()["ok"] is True
        # verify persisted
        r2 = session.get(f"{API}/auth/me", headers=cust_h(customer_token))
        assert r2.json()["user"]["measurements"]["bust"] == 34


# ----------------------------- Coupons -----------------------------
class TestCoupons:
    def test_siri10(self, session):
        r = session.post(f"{API}/coupons/validate", json={"code": "SIRI10", "subtotal": 10000})
        assert r.status_code == 200
        assert r.json()["discount"] == 1000.0

    def test_spring15_below_min(self, session):
        r = session.post(f"{API}/coupons/validate", json={"code": "SPRING15", "subtotal": 4000})
        assert r.status_code == 400

    def test_spring15_ok(self, session):
        r = session.post(f"{API}/coupons/validate", json={"code": "SPRING15", "subtotal": 6000})
        assert r.status_code == 200
        assert r.json()["discount"] == 900.0

    def test_wed2500_below_min(self, session):
        r = session.post(f"{API}/coupons/validate", json={"code": "WED2500", "subtotal": 10000})
        assert r.status_code == 400

    def test_wed2500_flat(self, session):
        r = session.post(f"{API}/coupons/validate", json={"code": "WED2500", "subtotal": 30000})
        assert r.status_code == 200
        assert r.json()["discount"] == 2500.0

    def test_invalid_coupon(self, session):
        r = session.post(f"{API}/coupons/validate", json={"code": "NOPE", "subtotal": 1000})
        assert r.status_code == 404


# ----------------------------- Orders -----------------------------
def _sample_order_payload(price=2000, qty=1, custom=False, coupon=None):
    return {
        "items": [{
            "product_id": "p01", "name": "Anaara Lehenga", "size": "M", "color": "wine",
            "fabric": "silk", "qty": qty, "price": price, "custom": custom,
        }],
        "address": {
            "full_name": "Aanya Reddy", "phone": "+91 9876543210",
            "line1": "1-2-3 Test Street", "line2": "Block A",
            "city": "Hyderabad", "state": "TS", "pincode": "500001"
        },
        "payment_method": "cod",
        "coupon": coupon,
        "notes": "test order"
    }


class TestOrders:
    def test_place_order_no_auth(self, session):
        r = requests.post(f"{API}/orders", json=_sample_order_payload())
        assert r.status_code == 401

    def test_place_order_below_5000_shipping(self, session, customer_token):
        # subtotal 2000 -> shipping 149, tax = 5% of 2000 = 100
        r = session.post(f"{API}/orders", json=_sample_order_payload(price=2000, qty=1), headers=cust_h(customer_token))
        assert r.status_code == 200, r.text
        o = r.json()["order"]
        assert o["id"].startswith("SR-")
        assert o["subtotal"] == 2000
        assert o["shipping"] == 149
        assert o["tax"] == 100.0
        assert o["total"] == 2000 + 149 + 100.0
        assert "_id" not in o

    def test_place_order_free_shipping(self, session, customer_token):
        time.sleep(1.1)  # avoid id collision
        r = session.post(f"{API}/orders", json=_sample_order_payload(price=6000, qty=1), headers=cust_h(customer_token))
        assert r.status_code == 200, r.text
        o = r.json()["order"]
        assert o["shipping"] == 0
        # tax = 5% of 6000 = 300
        assert o["tax"] == 300.0
        assert o["total"] == 6000 + 300.0

    def test_place_order_with_custom_charge(self, session, customer_token):
        time.sleep(1.1)
        r = session.post(f"{API}/orders", json=_sample_order_payload(price=3000, qty=1, custom=True), headers=cust_h(customer_token))
        assert r.status_code == 200
        o = r.json()["order"]
        assert o["custom_charge"] == 800
        assert o["custom"] is True
        # tax = 5% of (3000+800) = 190
        assert o["tax"] == 190.0
        assert o["total"] == 3000 + 800 + 149 + 190.0

    def test_place_order_with_coupon(self, session, customer_token):
        time.sleep(1.1)
        r = session.post(f"{API}/orders", json=_sample_order_payload(price=10000, qty=1, coupon="SIRI10"), headers=cust_h(customer_token))
        assert r.status_code == 200
        o = r.json()["order"]
        assert o["discount"] == 1000.0
        # subtotal 10000 - 1000 disc = 9000, shipping 0 (>5000), tax = 5% of 9000 = 450
        assert o["shipping"] == 0
        assert o["tax"] == 450.0
        assert o["total"] == 10000 - 1000 + 450.0

    def test_orders_me(self, session, customer_token):
        r = session.get(f"{API}/orders/me", headers=cust_h(customer_token))
        assert r.status_code == 200
        orders = r.json()["orders"]
        assert isinstance(orders, list)
        assert len(orders) >= 1
        for o in orders:
            assert "_id" not in o

    def test_order_detail_owner(self, session, customer_token):
        r = session.get(f"{API}/orders/me", headers=cust_h(customer_token))
        oid = r.json()["orders"][0]["id"]
        r2 = session.get(f"{API}/orders/{oid}", headers=cust_h(customer_token))
        assert r2.status_code == 200
        assert r2.json()["order"]["id"] == oid

    def test_order_detail_forbidden(self, session, customer_token):
        # create another user, try to access first user's order
        email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        reg = session.post(f"{API}/auth/register", json={"email": email, "password": "Test@1234", "name": "Other"})
        other_token = reg.json()["token"]
        # get demo customer's order id
        r = session.get(f"{API}/orders/me", headers=cust_h(customer_token))
        oid = r.json()["orders"][0]["id"]
        r2 = session.get(f"{API}/orders/{oid}", headers=cust_h(other_token))
        assert r2.status_code == 403


# ----------------------------- Bookings -----------------------------
class TestBookings:
    def test_place_booking(self, session, customer_token):
        payload = {
            "service_id": "svc-blouse", "service_name": "Designer blouse stitching",
            "estimate": 1200, "name": "Aanya", "phone": "+91 9876543210",
            "mode": "rapido", "when_text": "Tomorrow 3pm",
            "address": "1-2-3 Banjara Hills", "notes": "padded",
            "measurements": {"bust": 34}
        }
        r = session.post(f"{API}/bookings", json=payload, headers=cust_h(customer_token))
        assert r.status_code == 200, r.text
        b = r.json()["booking"]
        assert b["id"].startswith("BK-")
        assert b["status"] == "pickup-scheduled"
        assert "_id" not in b

    def test_booking_store_mode(self, session, customer_token):
        time.sleep(1.1)
        payload = {
            "service_id": "svc-alter", "service_name": "Alteration",
            "estimate": 250, "name": "Aanya", "phone": "+91 9876543210",
            "mode": "store", "when_text": "Sat 4pm"
        }
        r = session.post(f"{API}/bookings", json=payload, headers=cust_h(customer_token))
        assert r.status_code == 200
        assert r.json()["booking"]["status"] == "in-store"

    def test_bookings_me(self, session, customer_token):
        r = session.get(f"{API}/bookings/me", headers=cust_h(customer_token))
        assert r.status_code == 200
        bookings = r.json()["bookings"]
        assert len(bookings) >= 1
        for b in bookings:
            assert "_id" not in b

    def test_booking_no_auth(self, session):
        r = requests.post(f"{API}/bookings", json={"service_id": "x", "service_name": "y", "estimate": 1, "name": "n", "phone": "p", "mode": "store", "when_text": "now"})
        assert r.status_code == 401


# ----------------------------- Admin -----------------------------
class TestAdmin:
    def test_admin_role_check_customer(self, session, customer_token):
        r = session.get(f"{API}/admin/stats", headers=cust_h(customer_token))
        assert r.status_code == 403

    def test_admin_no_token(self, session):
        r = requests.get(f"{API}/admin/stats")
        assert r.status_code == 401

    def test_admin_stats(self, session, admin_token):
        r = session.get(f"{API}/admin/stats", headers=admin_h(admin_token))
        assert r.status_code == 200
        body = r.json()
        assert "kpis" in body and "bars" in body and "categories" in body
        assert "orders" in body["kpis"]

    def test_admin_orders(self, session, admin_token):
        r = session.get(f"{API}/admin/orders", headers=admin_h(admin_token))
        assert r.status_code == 200
        for o in r.json()["orders"]:
            assert "_id" not in o

    def test_admin_update_order_status(self, session, admin_token, customer_token):
        # find an order
        r = session.get(f"{API}/orders/me", headers=cust_h(customer_token))
        oid = r.json()["orders"][0]["id"]
        r2 = session.put(f"{API}/admin/orders/{oid}/status", json={"status": "stitching"}, headers=admin_h(admin_token))
        assert r2.status_code == 200
        # verify
        r3 = session.get(f"{API}/orders/{oid}", headers=admin_h(admin_token))
        assert r3.json()["order"]["status"] == "stitching"

    def test_admin_bookings(self, session, admin_token):
        r = session.get(f"{API}/admin/bookings", headers=admin_h(admin_token))
        assert r.status_code == 200

    def test_admin_update_booking_status(self, session, admin_token, customer_token):
        r = session.get(f"{API}/bookings/me", headers=cust_h(customer_token))
        bid = r.json()["bookings"][0]["id"]
        r2 = session.put(f"{API}/admin/bookings/{bid}/status", json={"status": "completed"}, headers=admin_h(admin_token))
        assert r2.status_code == 200

    def test_admin_customers(self, session, admin_token):
        r = session.get(f"{API}/admin/customers", headers=admin_h(admin_token))
        assert r.status_code == 200
        custs = r.json()["customers"]
        assert len(custs) >= 1
        for c in custs:
            assert "_id" not in c
            assert "password_hash" not in c
            assert "orders_count" in c

    def test_admin_product_crud(self, session, admin_token):
        # CREATE
        payload = {
            "name": "TEST_Product", "style": "Test style", "cat": "Sarees",
            "price": 1234.0, "was": 1500.0, "tag": "New",
            "description": "Test product",
            "images": ["data:image/png;base64,iVBORw0KGgo="],
            "stock": 5
        }
        r = session.post(f"{API}/admin/products", json=payload, headers=admin_h(admin_token))
        assert r.status_code == 200, r.text
        p = r.json()["product"]
        assert p["id"].startswith("p")
        pid = p["id"]
        assert "_id" not in p

        # UPDATE
        r2 = session.put(f"{API}/admin/products/{pid}", json={"price": 999.0, "stock": 10}, headers=admin_h(admin_token))
        assert r2.status_code == 200
        assert r2.json()["product"]["price"] == 999.0

        # GET to verify
        r3 = session.get(f"{API}/products/{pid}")
        assert r3.status_code == 200
        assert r3.json()["product"]["price"] == 999.0
        assert r3.json()["product"]["stock"] == 10

        # DELETE
        r4 = session.delete(f"{API}/admin/products/{pid}", headers=admin_h(admin_token))
        assert r4.status_code == 200
        # verify
        r5 = session.get(f"{API}/products/{pid}")
        assert r5.status_code == 404

    def test_admin_coupon_crud(self, session, admin_token):
        # list
        r = session.get(f"{API}/admin/coupons", headers=admin_h(admin_token))
        assert r.status_code == 200
        codes = {c["code"] for c in r.json()["coupons"]}
        assert {"SIRI10", "SPRING15", "WED2500"}.issubset(codes)

        # create
        new_code = f"TEST{uuid.uuid4().hex[:4].upper()}"
        payload = {"code": new_code, "description": "Test", "type": "percent", "value": 5, "min_order": 0, "active": True}
        r2 = session.post(f"{API}/admin/coupons", json=payload, headers=admin_h(admin_token))
        assert r2.status_code == 200

        # validate
        r3 = session.post(f"{API}/coupons/validate", json={"code": new_code, "subtotal": 1000})
        assert r3.status_code == 200
        assert r3.json()["discount"] == 50.0

        # delete
        r4 = session.delete(f"{API}/admin/coupons/{new_code}", headers=admin_h(admin_token))
        assert r4.status_code == 200

        # confirm gone
        r5 = session.post(f"{API}/coupons/validate", json={"code": new_code, "subtotal": 1000})
        assert r5.status_code == 404
