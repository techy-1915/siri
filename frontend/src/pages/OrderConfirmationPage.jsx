import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/api";
import { inr } from "../lib/constants";
import { I } from "../lib/icons";

const STEPS = [
  { key: "new", label: "Confirmed", desc: "Order placed" },
  { key: "cutting", label: "Cutting", desc: "Pattern & cut" },
  { key: "stitching", label: "Stitching", desc: "Assembly & finish" },
  { key: "shipped", label: "Shipped", desc: "Out for delivery" },
];

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => { api.get(`/orders/${id}`).then((r) => setOrder(r.data.order)).catch(() => {}); }, [id]);

  if (!order) return <div style={{ padding: 80, textAlign: "center" }}>Loading…</div>;

  const activeIdx = STEPS.findIndex((s) => s.key === order.status);
  const placedDate = new Date(order.placed_at);

  return (
    <section className="confirm" data-testid="order-confirmation">
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--ok)", fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          <I.check/> Order placed
        </div>
        <h1>Thank you, <em>{order.customer || "Friend"}</em>.</h1>
        <div className="num" data-testid="order-id">{order.id} · {placedDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div>

        <div className="timeline">
          {STEPS.map((s, i) => (
            <div key={s.key} className={`step ${i <= Math.max(activeIdx, 0) ? "active" : ""}`}>
              <div className="t">{s.label}</div>
              <div className="d">{s.desc}</div>
              <div className="when">{i === 0 ? placedDate.toLocaleString("en-IN", { hour: "numeric", minute: "2-digit" }) : i <= activeIdx ? "Done" : "—"}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, marginBottom: 24 }}>
          <div>
            <div className="eyebrow">Items</div>
            {order.items.map((it, i) => (
              <div key={i} style={{ padding: "10px 0", borderTop: i ? "1px solid var(--hairline)" : 0, fontSize: 14 }}>
                <div className="serif" style={{ fontSize: 17 }}>{it.name}</div>
                <div style={{ color: "var(--ink-2)", fontSize: 12, marginTop: 4 }}>{it.size} · ×{it.qty} · {inr(it.price)}{it.custom ? " · made-to-measure" : ""}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="eyebrow">Ship to</div>
            <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.7 }}>
              {order.address.full_name}<br/>
              {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}<br/>
              {order.address.city}, {order.address.state} {order.address.pincode}<br/>
              {order.address.phone}
            </div>
            <div className="eyebrow" style={{ marginTop: 18 }}>Total</div>
            <div className="serif" style={{ fontSize: 28 }}>{inr(order.total)}</div>
            <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{order.payment_method === "cod" ? "Cash on Delivery" : "Paid (Mock)"}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Link to="/account" className="btn btn-ghost" data-testid="view-orders-link">View all orders</Link>
          <Link to="/shop" className="btn btn-primary" data-testid="continue-shopping-link">Continue shopping <I.arrow/></Link>
        </div>
      </div>
    </section>
  );
}
