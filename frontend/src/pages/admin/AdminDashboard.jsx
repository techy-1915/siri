import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { inr } from "../../lib/constants";
import { Reveal, Stagger, StaggerItem } from "../../components/anim";
import { Placeholder } from "../../lib/icons";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data));
    api.get("/admin/orders").then((r) => setOrders(r.data.orders.slice(0, 6)));
    api.get("/admin/low-stock").then((r) => setLowStock(r.data.products));
  }, []);

  if (!stats) return <p style={{ color: "var(--ink-2)" }}>Loading…</p>;

  const max = Math.max(...stats.bars.map((b) => b.value), 1);

  const kpis = [
    { t: "Revenue", v: inr(stats.kpis.revenue), d: "+12.4%", up: true },
    { t: "Orders", v: stats.kpis.orders, d: `${stats.kpis.pending} active`, up: true },
    { t: "Customers", v: stats.kpis.customers, d: "all time", up: true },
    { t: "Bookings", v: stats.kpis.bookings, d: `${stats.kpis.pending_bookings} live`, up: true },
  ];

  return (
    <div data-testid="admin-dashboard">
      <Stagger className="kpis" gap={0.06}>
        {kpis.map((k, i) => (
          <StaggerItem key={i} className="kpi" data-testid={`kpi-${k.t.toLowerCase()}`}>
            <div className="t">{k.t}</div>
            <div className="v">{k.v}</div>
            <div className={`delta ${k.up ? "up" : "down"}`}><span className="arrow">{k.up ? "↑" : "↓"}</span>{k.d}</div>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal>
        <div className="adm-grid">
          <div className="panel">
            <div className="panel-h">
              <h3>Revenue · last 12 days</h3>
              <span className="eyebrow">Live</span>
            </div>
            <div className="panel-body">
              <div className="bars">
                {stats.bars.map((b, i) => (
                  <div key={i} className={`bar ${i % 3 === 0 ? "gold" : ""}`} style={{ height: `${(b.value / max) * 100}%` }} title={`${b.label}: ${inr(b.value)}`}/>
                ))}
              </div>
              <div className="bars-x">
                {stats.bars.map((b, i) => <span key={i}>{b.label}</span>)}
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-h"><h3>Top items</h3></div>
            <div className="panel-body">
              {stats.categories.length === 0 ? <p style={{ color: "var(--ink-2)", fontSize: 13 }}>Once orders flow in, you'll see best sellers here.</p> :
                stats.categories.map((c) => (
                  <div key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, borderTop: "1px dotted var(--hairline)" }}>
                    <span>{c.name}</span>
                    <span style={{ fontFamily: "var(--mono)" }}>{inr(c.value)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Reveal>

      <div className="panel">
        <div className="panel-h"><h3>Recent orders</h3></div>
        <table className="adm-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Status</th><th className="r">Total</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="clickable" onClick={() => (window.location.href = `/admin/orders/${o.id}`)} data-testid={`dash-order-${o.id}`}>
                <td className="order-id">{o.id}</td>
                <td><div className="cust"><div className="av">{(o.customer || "?").slice(0, 2).toUpperCase()}</div>{o.customer}</div></td>
                <td style={{ color: "var(--ink-2)" }}>{o.items.map((i) => i.name).join(", ")}</td>
                <td><span className={`status ${o.status}`}><span className="dotc"/>{o.status}</span></td>
                <td className="r">{inr(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lowStock.length > 0 && (
        <div className="panel" style={{ marginTop: 16 }} data-testid="low-stock-panel">
          <div className="panel-h">
            <h3>Low stock alerts</h3>
            <span className="chip wine">{lowStock.length} item{lowStock.length === 1 ? "" : "s"}</span>
          </div>
          <table className="adm-table">
            <thead><tr><th>Image</th><th>Product</th><th>Category</th><th>Stock</th><th className="r">Price</th></tr></thead>
            <tbody>
              {lowStock.map((p) => (
                <tr key={p.id} data-testid={`low-stock-${p.id}`}>
                  <td style={{ width: 70 }}>
                    <div style={{ width: 50, height: 50, position: "relative", border: "1px solid var(--hairline)" }}>
                      <Placeholder image={(p.images && p.images[0]) || null} label={p.name}/>
                    </div>
                  </td>
                  <td><Link to="/admin/products" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{p.name}</Link></td>
                  <td>{p.cat}</td>
                  <td><span className={`status ${p.stock === 0 ? "return" : "cutting"}`}><span className="dotc"/>{p.stock} left</span></td>
                  <td className="r">{inr(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
