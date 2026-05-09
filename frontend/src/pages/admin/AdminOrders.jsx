import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { inr } from "../../lib/constants";

const STATUSES = ["all", "new", "cutting", "stitching", "shipped", "delivered", "return", "refunded"];

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = () => {
    const url = filter === "all" ? "/admin/orders" : `/admin/orders?status_filter=${filter}`;
    api.get(url).then((r) => setOrders(r.data.orders));
  };
  useEffect(load, [filter]);

  return (
    <div data-testid="admin-orders">
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {STATUSES.map((s) => (
          <button key={s} className={`chip ${filter === s ? "solid" : ""}`} style={{ height: 30, padding: "0 14px", cursor: "pointer" }} onClick={() => setFilter(s)} data-testid={`status-filter-${s}`}>{s}</button>
        ))}
      </div>
      <div className="panel">
        <table className="adm-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Status</th><th>Date</th><th className="r">Total</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="clickable" onClick={() => navigate(`/admin/orders/${o.id}`)} data-testid={`adm-order-${o.id}`}>
                <td className="order-id">{o.id}</td>
                <td><div className="cust"><div className="av">{(o.customer || "?").slice(0, 2).toUpperCase()}</div>{o.customer}</div></td>
                <td style={{ color: "var(--ink-2)" }}>{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</td>
                <td><span className={`status ${o.status}`}><span className="dotc"/>{o.status}</span></td>
                <td style={{ color: "var(--ink-2)", fontSize: 12 }}>{new Date(o.placed_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</td>
                <td className="r">{inr(o.total)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan="6" style={{ padding: 32, textAlign: "center", color: "var(--ink-2)" }}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
