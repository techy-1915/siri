import React from "react";
import { BRAND } from "../lib/constants";
import { Reveal } from "../components/anim";
import { I } from "../lib/icons";

export default function VisitPage() {
  return (
    <div style={{ padding: "60px 56px" }} data-testid="visit-page">
      <Reveal>
        <span className="eyebrow">Visit the atelier</span>
        <h1 className="serif" style={{ fontSize: 56, fontWeight: 400, margin: "8px 0 18px" }}>
          Come <em style={{ color: "var(--primary)" }}>say hello</em>.
        </h1>
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, marginTop: 32 }} className="visit-grid">
        <Reveal>
          <div style={{ background: "var(--surface)", border: "1px solid var(--hairline)", padding: 32 }}>
            <h3 className="serif" style={{ fontSize: 22, fontWeight: 500, margin: "0 0 14px" }}>Address</h3>
            <p style={{ lineHeight: 1.8 }}><I.pin/> {BRAND.address}</p>
            <p style={{ lineHeight: 1.8 }}><I.bell/> {BRAND.hours}</p>
            <p style={{ lineHeight: 1.8 }}>📞 <a href={`tel:${BRAND.phone}`} style={{ color: "var(--primary)", textDecoration: "underline" }}>{BRAND.phoneFmt}</a></p>
            <p style={{ lineHeight: 1.8 }}>✉ <a href={`mailto:${BRAND.email}`} style={{ color: "var(--primary)", textDecoration: "underline" }}>{BRAND.email}</a></p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="ph-tile" style={{ minHeight: 360, background: "linear-gradient(180deg, #efe7da 0%, #d9b87a33 100%)" }}>
            <span className="ph-label">KONDAPUR · HYDERABAD</span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
