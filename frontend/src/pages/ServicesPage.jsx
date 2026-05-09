import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { inr } from "../lib/constants";
import { I, Placeholder } from "../lib/icons";
import { Reveal, Stagger, StaggerItem } from "../components/anim";

export default function ServicesPage() {
  const [services, setServices] = useState([]);

  useEffect(() => { api.get("/services").then((r) => setServices(r.data.services)); }, []);

  const Ic = ({ k }) => (k === "ruler" ? <I.ruler/> : k === "store" ? <I.store/> : <I.scissor/>);

  return (
    <div data-testid="services-page">
      <Reveal>
        <div className="section-h" style={{ paddingTop: 56, paddingBottom: 12 }}>
          <div>
            <span className="eyebrow">Atelier services</span>
            <h2>Stitching, alterations & saree services.</h2>
          </div>
          <div className="right">
            <div className="hint-card"><I.bike/><div><strong>Rapido pickup</strong><div style={{ fontSize: 12 }}>We pickup your fabric or garment and return it.</div></div></div>
            <div className="hint-card"><I.store/><div><strong>Visit the atelier</strong><div style={{ fontSize: 12 }}>Walk in to Kondapur for a fitting.</div></div></div>
          </div>
        </div>
      </Reveal>
      <Stagger className="services-grid" gap={0.06}>
        {services.map((s) => (
          <StaggerItem key={s.id}>
            <Link to={`/services/book/${s.id}`} state={{ service: s }} className="service-card" data-testid={`service-${s.id}`} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
              <div className="service-ic"><Ic k={s.icon}/></div>
              <h3 className="serif" style={{ fontSize: 24, fontWeight: 500, margin: "0 0 6px" }}>{s.name}</h3>
              <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7, margin: "0 0 12px" }}>{s.desc}</p>
              <div className="service-row">
                <div>
                  <div className="eyebrow">From</div>
                  <div className="serif" style={{ fontSize: 22, marginTop: 4 }}>{s.from > 0 ? inr(s.from) : "On request"}</div>
                </div>
                <div>
                  <div className="eyebrow">Turnaround</div>
                  <div className="serif" style={{ fontSize: 22, marginTop: 4 }}>{s.days > 0 ? `${s.days} days` : "Visit"}</div>
                </div>
                <div>
                  <span className="btn btn-ghost sm">Book <I.arrow/></span>
                </div>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
