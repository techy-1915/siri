import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import api from "../lib/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { inr, MEASUREMENT_FIELDS } from "../lib/constants";
import { toast } from "sonner";
import { I } from "../lib/icons";
import ProductCard from "../components/ProductCard";
import { Stagger, StaggerItem } from "../components/anim";

export default function AccountPage() {
  const { user, loading, logout, saveMeasurements } = useAuth();
  const wish = useWishlist();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "orders";
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [m, setM] = useState({});

  useEffect(() => { if (!loading && !user) navigate("/login?next=/account"); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    api.get("/orders/me").then((r) => setOrders(r.data.orders));
    api.get("/bookings/me").then((r) => setBookings(r.data.bookings));
    api.get("/wishlist").then((r) => setWishlist(r.data.items));
    setM({ unit: "in", ...(user.measurements || {}) });
  }, [user, tab]);

  if (!user) return null;

  const saveM = async () => {
    try { await saveMeasurements(m); toast.success("Measurements saved"); } catch { toast.error("Could not save"); }
  };

  return (
    <div style={{ padding: "48px 56px" }} data-testid="account-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <span className="eyebrow">Your account</span>
          <h1 className="serif" style={{ fontSize: 44, fontWeight: 400, margin: "8px 0 4px" }}>{user.name}</h1>
          <div style={{ color: "var(--ink-2)", fontSize: 13 }}>{user.email}{user.phone ? ` · ${user.phone}` : ""}</div>
        </div>
        <button className="btn btn-ghost" onClick={logout} data-testid="logout-btn">Sign out</button>
      </div>
      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--hairline)", marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { id: "orders", label: "Orders" },
          { id: "bookings", label: "Bookings" },
          { id: "wishlist", label: `Wishlist${wish && wish.count ? ` · ${wish.count}` : ""}` },
          { id: "measurements", label: "Measurements" },
        ].map((t) => (
          <button key={t.id} onClick={() => setParams({ tab: t.id })}
            style={{ background: "none", border: 0, padding: "12px 0", cursor: "pointer", fontSize: 13, color: tab === t.id ? "var(--ink)" : "var(--ink-3)", borderBottom: tab === t.id ? "1px solid var(--ink)" : "0", marginBottom: -1 }}
            data-testid={`tab-${t.id}`}>{t.label}</button>
        ))}
      </div>

      {tab === "orders" && (
        <div>
          {orders.length === 0 ? (
            <p style={{ color: "var(--ink-2)" }}>No orders yet. <Link to="/shop" style={{ textDecoration: "underline" }}>Browse the shop →</Link></p>
          ) : (
            <table className="adm-table">
              <thead><tr><th>Order</th><th>Items</th><th>Status</th><th>Date</th><th className="r">Total</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="clickable" onClick={() => navigate(`/order/${o.id}`)} data-testid={`order-row-${o.id}`}>
                    <td className="order-id">{o.id}</td>
                    <td>{o.items.map((i) => i.name).join(", ")}</td>
                    <td><span className={`status ${o.status}`}><span className="dotc"/>{o.status}</span></td>
                    <td style={{ color: "var(--ink-2)", fontSize: 12 }}>{new Date(o.placed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</td>
                    <td className="r">{inr(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "bookings" && (
        <div>
          {bookings.length === 0 ? (
            <p style={{ color: "var(--ink-2)" }}>No bookings yet. <Link to="/services" style={{ textDecoration: "underline" }}>Book a service →</Link></p>
          ) : (
            <table className="adm-table">
              <thead><tr><th>ID</th><th>Service</th><th>Mode</th><th>Status</th><th>Placed</th><th className="r">Estimate</th></tr></thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="order-id">{b.id}</td>
                    <td>{b.service_name}</td>
                    <td>{b.mode === "rapido" ? "Rapido pickup" : "Store visit"}</td>
                    <td><span className={`status ${b.status === "completed" ? "shipped" : "stitching"}`}><span className="dotc"/>{b.status}</span></td>
                    <td style={{ color: "var(--ink-2)", fontSize: 12 }}>{new Date(b.placed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</td>
                    <td className="r">{inr(b.estimate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "wishlist" && (
        <div data-testid="wishlist-tab">
          {wishlist.length === 0 ? (
            <p style={{ color: "var(--ink-2)" }}>No saved pieces yet. <Link to="/shop" style={{ textDecoration: "underline" }}>Browse the shop →</Link></p>
          ) : (
            <Stagger className="product-grid" gap={0.05} style={{ borderTop: "1px solid var(--hairline)", padding: 0 }}>
              {wishlist.map((p) => <StaggerItem key={p.id}><ProductCard p={p}/></StaggerItem>)}
            </Stagger>
          )}
        </div>
      )}

      {tab === "measurements" && (
        <div style={{ maxWidth: 720 }}>
          <p style={{ color: "var(--ink-2)", marginBottom: 16, fontSize: 14 }}>We use these for made-to-measure pieces and tailoring bookings. All values in {m.unit === "cm" ? "centimetres" : "inches"}.</p>
          <div className="unit-toggle" style={{ marginBottom: 18 }}>
            <button className={m.unit === "in" ? "active" : ""} onClick={() => setM({ ...m, unit: "in" })}>Inches</button>
            <button className={m.unit === "cm" ? "active" : ""} onClick={() => setM({ ...m, unit: "cm" })}>Centimetres</button>
          </div>
          <div className="grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px" }}>
            {MEASUREMENT_FIELDS.map((f) => (
              <label key={f.id} className="field">{f.label} <input type="number" step="0.1" value={m[f.id] || ""} onChange={(e) => setM({ ...m, [f.id]: e.target.value })} data-testid={`acc-m-${f.id}`}/></label>
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-primary" onClick={saveM} data-testid="save-measurements-btn">Save measurements <I.check/></button>
          </div>
        </div>
      )}
    </div>
  );
}
