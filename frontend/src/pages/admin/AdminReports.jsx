import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { inr } from "../../lib/constants";

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)); }, []);
  if (!stats) return <p>Loading…</p>;
  const max = Math.max(...stats.bars.map((b) => b.value), 1);
  return (
    <div data-testid="admin-reports">
      <div className="kpis">
        <div className="kpi"><div className="t">All-time revenue</div><div className="v">{inr(stats.kpis.revenue)}</div></div>
        <div className="kpi"><div className="t">Total orders</div><div className="v">{stats.kpis.orders}</div></div>
        <div className="kpi"><div className="t">Delivered</div><div className="v">{stats.kpis.delivered}</div></div>
        <div className="kpi"><div className="t">Avg basket</div><div className="v">{stats.kpis.orders > 0 ? inr(Math.round(stats.kpis.revenue / stats.kpis.orders)) : inr(0)}</div></div>
      </div>
      <div className="panel">
        <div className="panel-h"><h3>Daily revenue · last 12 days</h3></div>
        <div className="panel-body">
          <div className="bars">
            {stats.bars.map((b, i) => <div key={i} className={`bar ${i % 4 === 0 ? "gold" : ""}`} style={{ height: `${(b.value / max) * 100}%` }} title={`${b.label}: ${inr(b.value)}`}/>)}
          </div>
          <div className="bars-x">{stats.bars.map((b, i) => <span key={i}>{b.label}</span>)}</div>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-h"><h3>Top selling items</h3></div>
        <div className="panel-body">
          {stats.categories.length === 0 ? <p style={{ color: "var(--ink-2)" }}>No data yet.</p> :
            stats.categories.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i ? "1px dotted var(--hairline)" : 0 }}>
                <span>{c.name}</span>
                <span style={{ fontFamily: "var(--mono)" }}>{inr(c.value)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
