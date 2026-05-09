import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { inr, MEASUREMENT_FIELDS } from "../../lib/constants";
import { toast } from "sonner";

const NEXT_STATUS = ["pickup-scheduled", "in-progress", "measuring", "stitching", "ready", "completed"];

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [openId, setOpenId] = useState(null);

  const load = () => api.get("/admin/bookings").then((r) => setBookings(r.data.bookings));
  useEffect(load, []);

  const advance = async (id, status) => {
    await api.put(`/admin/bookings/${id}/status`, { status });
    toast.success(`Booking ${id} → ${status}`);
    load();
  };

  return (
    <div data-testid="admin-bookings">
      <div className="panel">
        <table className="adm-table">
          <thead><tr><th>ID</th><th>Customer</th><th>Service</th><th>Mode</th><th>Status</th><th>When</th><th className="r">Estimate</th></tr></thead>
          <tbody>
            {bookings.map((b) => (
              <React.Fragment key={b.id}>
                <tr className="clickable" onClick={() => setOpenId(openId === b.id ? null : b.id)} data-testid={`adm-booking-${b.id}`}>
                  <td className="order-id">{b.id}</td>
                  <td><div className="cust"><div className="av">{(b.name || "?").slice(0, 2).toUpperCase()}</div>{b.name}</div></td>
                  <td>{b.service_name}</td>
                  <td>{b.mode === "rapido" ? "Rapido" : "Store"}</td>
                  <td><span className={`status ${b.status === "completed" || b.status === "ready" ? "shipped" : "stitching"}`}><span className="dotc"/>{b.status}</span></td>
                  <td style={{ color: "var(--ink-2)", fontSize: 12 }}>{b.when_text}</td>
                  <td className="r">{inr(b.estimate)}</td>
                </tr>
                {openId === b.id && (
                  <tr><td colSpan="7" style={{ background: "var(--bg-soft)", padding: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
                      <div>
                        <div className="eyebrow">Notes</div>
                        <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.7 }}>{b.notes || "—"}</p>
                        <div className="eyebrow" style={{ marginTop: 12 }}>Address</div>
                        <p style={{ marginTop: 6, fontSize: 13 }}>{b.address || "—"}</p>
                        <div className="eyebrow" style={{ marginTop: 12 }}>Phone</div>
                        <p style={{ marginTop: 6, fontSize: 13, fontFamily: "var(--mono)" }}>{b.phone}</p>
                      </div>
                      <div>
                        {b.measurements && (
                          <>
                            <div className="eyebrow">Measurements ({b.measurements.unit || "in"})</div>
                            <div className="measurements-grid" style={{ marginTop: 8 }}>
                              {MEASUREMENT_FIELDS.map((f) => b.measurements[f.id] != null && (
                                <div key={f.id} className="m"><span className="lab">{f.label}</span><span className="val">{b.measurements[f.id]}</span></div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {NEXT_STATUS.map((s) => (
                        <button key={s} className={`btn sm ${b.status === s ? "btn-primary" : "btn-ghost"}`} onClick={() => advance(b.id, s)} data-testid={`booking-status-${b.id}-${s}`}>{s}</button>
                      ))}
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
            {bookings.length === 0 && <tr><td colSpan="7" style={{ padding: 32, textAlign: "center", color: "var(--ink-2)" }}>No bookings yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
