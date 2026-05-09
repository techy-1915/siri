import React from "react";
import { Link } from "react-router-dom";
import { Placeholder } from "../lib/icons";
import { COLORS, inr } from "../lib/constants";

export default function ProductCard({ p }) {
  return (
    <Link to={`/shop/${p.id}`} className="product-card" data-testid={`product-card-${p.id}`}>
      <div className="ph-wrap">
        <Placeholder label={p.name} hue={p.hue} image={(p.images && p.images[0]) || null} />
        {p.tag && (
          <div className="corner-tag">
            <span className={`chip ${p.tag === "Sale" ? "gold" : (p.tag === "Couture" || p.tag === "Maggam" ? "solid" : "wine")}`}>{p.tag}</span>
          </div>
        )}
        <div className="quick">Quick view</div>
      </div>
      <div className="pname">{p.name}</div>
      <div className="psub">{p.style}</div>
      <div className="prow">
        <div>
          <span className="price">{inr(p.price)}</span>
          {p.was && <span style={{ textDecoration: "line-through", color: "var(--ink-3)", fontSize: 12, marginLeft: 8 }}>{inr(p.was)}</span>}
        </div>
        <div className="swatches">
          {COLORS.slice(0, 3).map((c) => <span key={c.id} className="sw" style={{ background: c.hex }} />)}
        </div>
      </div>
    </Link>
  );
}
