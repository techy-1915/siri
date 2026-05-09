import React from "react";
import { BRAND } from "../lib/constants";
import { Reveal, Stagger, StaggerItem } from "../components/anim";
import { I } from "../lib/icons";

export default function AboutPage() {
  return (
    <div style={{ padding: "60px 56px" }} data-testid="about-page">
      <Reveal>
        <span className="eyebrow">The atelier</span>
        <h1 className="serif" style={{ fontSize: 64, fontWeight: 400, margin: "8px 0 18px", letterSpacing: "-0.012em" }}>
          Hand-finished <em style={{ color: "var(--primary)" }}>since {BRAND.established}</em>.
        </h1>
        <p style={{ maxWidth: 760, fontSize: 16, color: "var(--ink-2)", lineHeight: 1.8 }}>
          Siri Boutique began as a single tailoring chair in Kondapur, Hyderabad — and has grown into a full atelier specialising in maggam work, hand zardosi, and bespoke dresses. Every piece is cut, fitted, and finished by our team in-house.
        </p>
      </Reveal>
      <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="about-grid">
        <Stagger gap={0.08}>
          {[
            { t: "Couture made-to-measure", d: "Send us your measurements via the website or visit our atelier — every dress is built to fit you exactly." },
            { t: "Maggam & zardosi", d: "Our karigars do hand-set crystals, pearls and zardosi work passed down across two generations." },
            { t: "Saree services", d: "Pre-pleating, box folding, fall-stitching and pico — same day turnaround for most pieces." },
          ].map((c, i) => (
            <StaggerItem key={i} style={{ background: "var(--surface)", border: "1px solid var(--hairline)", padding: 28 }}>
              <div className="serif" style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>{c.t}</div>
              <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7 }}>{c.d}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  );
}
