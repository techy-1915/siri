import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../lib/api";
import { BRAND } from "../lib/constants";
import { Reveal, Stagger, StaggerItem, HeroTextReveal } from "../components/anim";
import ProductCard from "../components/ProductCard";
import { I, Placeholder } from "../lib/icons";

export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/recommendations?limit=8").then((r) => setProducts(r.data.products)).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-text">
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="eyebrow">
            Spring Atelier · MMXXVI · Hyderabad
          </motion.span>
          <h1>
            <HeroTextReveal text="Where style" delay={0.1}/>
            <br/>
            <em><HeroTextReveal text="meets perfection." delay={0.6}/></em>
          </h1>
          <Reveal delay={1.1}>
            <p>
              Hand-finished couture, made-to-measure dresses, and saree services from the Siri atelier in Kondapur. Choose a piece, choose a size — or send us your measurements and we will build it for you.
            </p>
          </Reveal>
          <Reveal delay={1.3} style={{ display: "flex", gap: 12 }}>
            <Link to="/shop" className="btn btn-primary" data-testid="hero-shop-btn">Shop the Spring edit <I.arrow/></Link>
            <Link to="/services" className="btn btn-ghost" data-testid="hero-services-btn">Custom tailoring <I.scissor/></Link>
          </Reveal>
        </div>
        <div className="hero-img">
          <motion.div
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.4, ease: [0.16,1,0.3,1] }}
            style={{ position: "absolute", inset: 0 }}
          >
            <Placeholder hue={20} label="ANAARA · LEHENGA"/>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.8 }} className="meta">
            <div>
              <div className="eyebrow">Look 04 · Maggam</div>
              <div className="serif" style={{ fontSize: 18, marginTop: 4 }}>Anaara Lehenga</div>
            </div>
            <span className="chip wine">Bestseller</span>
          </motion.div>
        </div>
      </section>

      {/* Specialities marquee */}
      <section className="spec-strip">
        <div className="marquee">
          {[...BRAND.specialties, ...BRAND.specialties].map((s, i) => <span key={i}>{s}</span>)}
        </div>
      </section>

      {/* Spring edit */}
      <section>
        <Reveal>
          <div className="section-h">
            <div>
              <span className="eyebrow">Curated for you</span>
              <h2>The Spring edit</h2>
            </div>
            <div className="right" style={{ alignSelf: "flex-end" }}>
              <Link to="/shop" style={{ textDecoration: "underline", textUnderlineOffset: 4 }}>View all <I.arrow/></Link>
            </div>
          </div>
        </Reveal>
        <Stagger className="product-grid" gap={0.08}>
          {products.slice(0, 4).map((p) => (
            <StaggerItem key={p.id}><ProductCard p={p}/></StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Service strip */}
      <section style={{ padding: "60px 56px", background: "var(--bg-soft)", borderBottom: "1px solid var(--hairline)" }}>
        <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }} className="home-services-grid">
            <div>
              <span className="eyebrow">Atelier services</span>
              <h2 className="serif" style={{ fontSize: 44, margin: "8px 0 18px", fontWeight: 400 }}>
                Bring us a fabric, a memory,<br/>or just an inspiration.
              </h2>
              <p style={{ color: "var(--ink-2)", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
                Designer blouse stitching, maggam work, hemming, alterations, custom dresses & saree pre-pleating. Visit us in store or send your garment via Rapido — we will pick up, work on it, and send it back.
              </p>
              <Link to="/services" className="btn btn-primary" data-testid="home-book-services-btn">Book a service <I.arrow/></Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Stagger gap={0.08}>
                <StaggerItem><div className="hint-card"><I.scissor/><div><div className="serif" style={{ fontSize: 16 }}>Maggam work</div><div style={{ fontSize: 12, color: "var(--ink-2)" }}>From ₹1800 · 12 days</div></div></div></StaggerItem>
                <StaggerItem><div className="hint-card"><I.ruler/><div><div className="serif" style={{ fontSize: 16 }}>Alteration</div><div style={{ fontSize: 12, color: "var(--ink-2)" }}>From ₹250 · 2 days</div></div></div></StaggerItem>
                <StaggerItem><div className="hint-card"><I.scissor/><div><div className="serif" style={{ fontSize: 16 }}>Saree pre-pleating</div><div style={{ fontSize: 12, color: "var(--ink-2)" }}>From ₹350 · 1 day</div></div></div></StaggerItem>
                <StaggerItem><div className="hint-card"><I.bike/><div><div className="serif" style={{ fontSize: 16 }}>Rapido pickup</div><div style={{ fontSize: 12, color: "var(--ink-2)" }}>Door-to-door</div></div></div></StaggerItem>
              </Stagger>
            </div>
          </div>
        </Reveal>
      </section>

      {/* More products */}
      {products.length > 4 && (
        <section>
          <Reveal>
            <div className="section-h">
              <div>
                <span className="eyebrow">Hand picked</span>
                <h2>More from the atelier</h2>
              </div>
            </div>
          </Reveal>
          <Stagger className="product-grid" gap={0.06}>
            {products.slice(4, 8).map((p) => (
              <StaggerItem key={p.id}><ProductCard p={p}/></StaggerItem>
            ))}
          </Stagger>
        </section>
      )}
    </div>
  );
}
