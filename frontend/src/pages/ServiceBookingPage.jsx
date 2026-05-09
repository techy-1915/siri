import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { I } from "../lib/icons";
import { inr, MEASUREMENT_FIELDS } from "../lib/constants";
import { toast } from "sonner";
import { Reveal } from "../components/anim";

export default function ServiceBookingPage() {
  const { id } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState(loc.state?.service || null);

  const [mode, setMode] = useState("rapido");
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [whenText, setWhen] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [m, setM] = useState({ unit: "in", ...((user?.measurements) || {}) });

  useEffect(() => {
    if (!user) navigate("/login?next=" + encodeURIComponent(`/services/book/${id}`));
  }, [user, navigate, id]);

  useEffect(() => {
    if (!service) {
      api.get("/services").then((r) => {
        const s = r.data.services.find((x) => x.id === id);
        if (s) setService(s); else navigate("/services");
      });
    }
  }, [service, id, navigate]);

  if (!service) return <div style={{ padding: 80, textAlign: "center" }}>Loading…</div>;

  const submit = async () => {
    if (!name || !phone || !whenText) { toast.error("Fill name, phone and preferred time"); return; }
    try {
      const { data } = await api.post("/bookings", {
        service_id: service.id,
        service_name: service.name,
        estimate: service.from,
        name, phone, mode,
        when_text: whenText,
        address: mode === "rapido" ? address : "Visit · Kondapur",
        notes,
        measurements: Object.keys(m).filter((k) => k !== "unit" && m[k]).length ? m : null,
      });
      toast.success("Booking confirmed", { description: `${data.booking.id} · ${service.name}` });
      navigate("/account?tab=bookings");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not book");
    }
  };

  return (
    <section className="co-shell" data-testid="service-booking-page">
      <div className="co-main">
        <Reveal>
          <span className="eyebrow">Atelier booking</span>
          <h2>{service.name}</h2>
          <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.7, maxWidth: 520, margin: "0 0 24px" }}>{service.desc}</p>
        </Reveal>

        <div className="co-section">
          <h3>How would you like to deliver?</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className={`pickup-card ${mode === "rapido" ? "active" : ""}`} onClick={() => setMode("rapido")} data-testid="pickup-rapido">
              <div className="ic"><I.bike/></div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 500 }}>Send via Rapido</div>
              <p>We send a Rapido rider to pickup your garment/fabric, work on it at the atelier, and ship it back. Door-to-door.</p>
              <div className="meta">PICKUP CHARGE · ₹120 (paid on delivery)</div>
            </div>
            <div className={`pickup-card ${mode === "store" ? "active" : ""}`} onClick={() => setMode("store")} data-testid="pickup-store">
              <div className="ic"><I.store/></div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 500 }}>Visit the atelier</div>
              <p>Walk in to our Kondapur boutique for an in-person consultation, fitting and measurement. Mon–Sat · 10:30 AM–8:30 PM.</p>
              <div className="meta">PLOT 4-12 · KONDAPUR MAIN ROAD</div>
            </div>
          </div>
        </div>

        <div className="co-section">
          <h3>Your details</h3>
          <div className="grid2">
            <label className="field">Name <input value={name} onChange={(e) => setName(e.target.value)} data-testid="booking-name"/></label>
            <label className="field">Phone <input value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="booking-phone"/></label>
          </div>
          <div className="co-section" style={{ marginTop: 12 }}>
            <label className="field">Preferred date / time <input placeholder="e.g. Tomorrow 11:00 AM" value={whenText} onChange={(e) => setWhen(e.target.value)} data-testid="booking-when"/></label>
          </div>
          {mode === "rapido" && (
            <div className="co-section">
              <label className="field">Pickup address <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} data-testid="booking-address"/></label>
            </div>
          )}
          <div className="co-section">
            <label className="field">Notes for our tailor <textarea rows={3} placeholder="e.g. take in waist by 1.5&quot;, padded blouse, embroidery to match dupatta…" value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="booking-notes"/></label>
          </div>
        </div>

        {(service.id === "svc-blouse" || service.id === "svc-dress" || service.id === "svc-alter") && (
          <div className="co-section">
            <h3>Measurements (optional, helps speed up)</h3>
            <div className="unit-toggle" style={{ marginBottom: 14 }}>
              <button className={m.unit === "in" ? "active" : ""} onClick={() => setM({ ...m, unit: "in" })} data-testid="booking-unit-in">Inches</button>
              <button className={m.unit === "cm" ? "active" : ""} onClick={() => setM({ ...m, unit: "cm" })} data-testid="booking-unit-cm">cm</button>
            </div>
            <div className="grid2">
              {MEASUREMENT_FIELDS.map((f) => (
                <label key={f.id} className="field">
                  {f.label}
                  <input type="number" step="0.1" placeholder="—" value={m[f.id] || ""} onChange={(e) => setM({ ...m, [f.id]: e.target.value })} data-testid={`booking-m-${f.id}`}/>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button className="btn btn-primary" onClick={submit} data-testid="confirm-booking-btn">Confirm booking <I.arrow/></button>
        </div>
      </div>

      <aside className="summary">
        <h3>Booking summary</h3>
        <div className="row"><span>Service</span><span style={{ textAlign: "right", maxWidth: 220 }}>{service.name}</span></div>
        <div className="row"><span>Estimate from</span><span>{service.from > 0 ? inr(service.from) : "On request"}</span></div>
        <div className="row"><span>Turnaround</span><span>{service.days > 0 ? `${service.days} days` : "Visit"}</span></div>
        <div className="row"><span>Mode</span><span>{mode === "rapido" ? "Rapido pickup" : "Visit store"}</span></div>
        <p style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 16, lineHeight: 1.7 }}>Final pricing depends on fabric, complexity and embellishment. Our tailor will confirm the exact amount after seeing your garment.</p>
      </aside>
    </section>
  );
}
