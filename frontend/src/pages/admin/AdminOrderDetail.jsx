import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../lib/api";
import { inr, MEASUREMENT_FIELDS } from "../../lib/constants";
import { toast } from "sonner";
import { Placeholder } from "../../lib/icons";

const NEXT = { new: "cutting", cutting: "stitching", stitching: "shipped", shipped: "delivered" };

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  const load = () => { api.get(`/orders/${id}`).then((r) => setOrder(r.data.order)); };
  useEffect(() => { load(); }, [id]);

  if (!order) return <p>Loading…</p>;

  const updateStatus = async (status) => {
    await api.put(`/admin/orders/${id}/status`, { status });
    toast.success(`Status updated to ${status}`);
    load();
  };

  const customMeasure = order.items.find((i) => i.custom)?.measurements;

  return (
    <div data-testid={`admin-order-${id}`}>
      <div className="adm-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="panel">
          <div className="panel-h">
            <h3>{order.id} · {order.customer}</h3>
            <span className={`status ${order.status}`}><span className="dotc"/>{order.status}</span>
          </div>
          <div>
            {order.items.map((it, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 14, padding: "14px 20px", borderTop: i ? "1px solid var(--hairline)" : 0 }}>
                <div style={{ aspectRatio: "3/4", position: "relative", background: "var(--surface)", border: "1px solid var(--hairline)" }}>
                  <Placeholder hue={20 + i * 30} image={it.image}/>
                </div>
                <div>
                  <div className="serif" style={{ fontSize: 17, fontWeight: 500 }}>{it.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.7 }}>
                    <span style={{ background: "var(--bg-soft)", padding: "1px 6px", marginRight: 4, fontFamily: "var(--mono)", fontSize: 10.5 }}>{it.size}</span>
                    <span style={{ background: "var(--bg-soft)", padding: "1px 6px", marginRight: 4, fontFamily: "var(--mono)", fontSize: 10.5 }}>{it.color}</span>
                    <span style={{ background: "var(--bg-soft)", padding: "1px 6px", marginRight: 4, fontFamily: "var(--mono)", fontSize: 10.5 }}>{it.fabric}</span>
                    {it.custom && <span style={{ background: "var(--primary)", color: "#fff", padding: "1px 6px", fontFamily: "var(--mono)", fontSize: 10.5 }}>MTM</span>}
                  </div>
                </div>
                <div style={{ fontWeight: 500 }}>{inr(it.price * it.qty)}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 20, borderTop: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {NEXT[order.status] && <button className="btn btn-primary sm" onClick={() => updateStatus(NEXT[order.status])} data-testid="advance-status-btn">Advance to {NEXT[order.status]}</button>}
              <button className="btn btn-ghost sm" onClick={() => updateStatus("return")} data-testid="mark-return-btn">Mark return</button>
              <button className="btn btn-ghost sm" onClick={() => updateStatus("refunded")} data-testid="mark-refunded-btn">Refund</button>
            </div>
            <div className="serif" style={{ fontSize: 22 }}>{inr(order.total)}</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-h"><h3>Ship to</h3></div>
          <div className="panel-body" style={{ fontSize: 13, lineHeight: 1.8 }}>
            {order.address.full_name}<br/>
            {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}<br/>
            {order.address.city}, {order.address.state} {order.address.pincode}<br/>
            {order.address.phone}<br/>
            <span className="eyebrow" style={{ marginTop: 12, display: "block" }}>Payment</span>
            {order.payment_method === "cod" ? "Cash on Delivery" : "Online (Mock)"}
          </div>
        </div>
      </div>

      {customMeasure && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-h"><h3>Customer measurements</h3><span className="eyebrow">Made-to-measure</span></div>
          <div className="panel-body">
            <div className="measurements-grid">
              {MEASUREMENT_FIELDS.map((f) => customMeasure[f.id] != null && (
                <div key={f.id} className="m"><span className="lab">{f.label}</span><span className="val">{customMeasure[f.id]} {customMeasure.unit || "in"}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-h"><h3>History</h3></div>
        <div className="panel-body">
          {(order.history || []).map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 14, padding: "8px 0", borderTop: i ? "1px dotted var(--hairline-2)" : 0 }}>
              <span className={`status ${h.status === "placed" ? "new" : h.status}`}><span className="dotc"/>{h.status}</span>
              <span style={{ color: "var(--ink-2)", fontSize: 12, fontFamily: "var(--mono)" }}>{new Date(h.at).toLocaleString("en-IN")}</span>
              {h.note && <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{h.note}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
