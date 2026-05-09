import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { COLORS, FABRICS, SIZES, inr, colorById, fabricById } from "../lib/constants";
import { I, Placeholder } from "../lib/icons";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import MeasurementsModal from "../components/MeasurementsModal";
import { toast } from "sonner";
import { Reveal, Stagger, StaggerItem } from "../components/anim";
import ProductCard from "../components/ProductCard";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { user, saveMeasurements } = useAuth();

  const [data, setData] = useState(null);
  const [color, setColor] = useState("wine");
  const [size, setSize] = useState("M");
  const [fabric, setFabric] = useState("silk");
  const [qty, setQty] = useState(1);
  const [custom, setCustom] = useState(false);
  const [m, setM] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => {
      setData(r.data);
      const p = r.data.product;
      setColor((p.colors || ["wine"])[0]);
      setFabric((p.fabrics || ["silk"])[0]);
    }).catch(() => navigate("/shop"));
  }, [id, navigate]);

  if (!data) return <div style={{ padding: 80, textAlign: "center", color: "var(--ink-2)" }}>Loading…</div>;
  const p = data.product;
  const fabricObj = fabricById(fabric);
  const finalPrice = (p.price + (fabricObj.add || 0)) * qty;
  const images = p.images && p.images.length ? p.images : [];

  const onAdd = () => {
    add({
      product_id: p.id,
      name: p.name,
      image: images[0] || null,
      size,
      color,
      fabric,
      qty,
      price: p.price + (fabricObj.add || 0),
      custom,
      measurements: custom ? m : null,
    });
    toast.success("Added to bag", { description: `${p.name} · ${size} · ${colorById(color).name}` });
  };

  const onSaveMeasurements = async (vals) => {
    setM(vals); setCustom(true); setSize("Custom"); setOpenModal(false);
    if (user) {
      try { await saveMeasurements(vals); toast.success("Measurements saved to your profile"); } catch {}
    }
  };

  return (
    <div data-testid={`product-page-${p.id}`}>
      <section className="pdp">
        <div className="gallery">
          <div className="thumbs">
            {(images.length ? images : [null, null, null]).slice(0, 4).map((img, i) => (
              <div key={i} className={`thumb ${galleryIdx === i ? "active" : ""}`} onClick={() => setGalleryIdx(i)}>
                <Placeholder hue={p.hue + i * 10} image={img} label={`${i + 1}`}/>
              </div>
            ))}
          </div>
          <div className="main">
            <Placeholder hue={p.hue + galleryIdx * 10} image={images[galleryIdx] || null} label={p.name}/>
            <div className="pager">{galleryIdx + 1} / {Math.max(images.length, 4)}</div>
          </div>
        </div>
        <div className="info">
          <span className="eyebrow">{p.cat}</span>
          <h1>{p.name}</h1>
          <div className="sub">{p.style}</div>
          <div className="price-row">
            <span className="price">{inr(p.price + (fabricObj.add || 0))}</span>
            {p.was && <span className="strike">{inr(p.was)}</span>}
            {p.was && <span className="save">Save {inr(p.was - p.price)}</span>}
          </div>

          {p.description && <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>{p.description}</p>}

          <div className="opt-group">
            <div className="opt-head"><span className="label">Colour</span><span className="value">{colorById(color).name}</span></div>
            <div className="color-swatches">
              {(p.colors || []).map((cid) => {
                const c = colorById(cid);
                return <button key={cid} className={`color-swatch ${color === cid ? "active" : ""}`} style={{ background: c.hex }} onClick={() => setColor(cid)} aria-label={c.name} data-testid={`color-${cid}`}/>;
              })}
            </div>
          </div>

          <div className="opt-group">
            <div className="opt-head"><span className="label">Size</span><span className="value"><button className="btn btn-link" onClick={() => setOpenModal(true)} data-testid="size-chart-btn">Size chart</button></span></div>
            <div className="size-row">
              {SIZES.map((s) => (
                <button key={s} className={`size-pill ${size === s && !custom ? "active" : ""}`} onClick={() => { setSize(s); setCustom(false); }} data-testid={`size-${s}`}>{s}</button>
              ))}
              <button className={`size-pill custom ${custom ? "active" : ""}`} onClick={() => setOpenModal(true)} data-testid="size-custom">Custom · made-to-measure</button>
            </div>
            {custom && Object.keys(m).length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink-2)", fontFamily: "var(--mono)" }}>
                Bust {m.bust}{m.unit} · Waist {m.waist}{m.unit} · Hip {m.hip}{m.unit} · Stitch fee +{inr(800)}
              </div>
            )}
          </div>

          <div className="opt-group">
            <div className="opt-head"><span className="label">Fabric</span><span className="value">{fabricObj.name}{fabricObj.add ? ` · ${fabricObj.add > 0 ? "+" : ""}${inr(fabricObj.add)}` : ""}</span></div>
            <div className="fabric-row">
              {(p.fabrics || []).map((fid) => {
                const f = fabricById(fid);
                return (
                  <div key={fid} className={`fabric-card ${fabric === fid ? "active" : ""}`} onClick={() => setFabric(fid)} data-testid={`fabric-${fid}`}>
                    <div className="swatch" style={{ background: fid === "silk" ? "#d9b87a" : fid === "georg" ? "#efe6d3" : "#3a1a28" }}/>
                    <div className="name">{f.name}</div>
                    <div className="price">{f.add > 0 ? `+${inr(f.add)}` : f.add < 0 ? `${inr(f.add)}` : "Included"}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="add-row">
            <div className="qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} data-testid="qty-decrement">−</button>
              <span className="n">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} data-testid="qty-increment">+</button>
            </div>
            <button className="btn btn-primary" onClick={onAdd} data-testid="add-to-bag-btn">Add to bag · {inr(finalPrice + (custom ? 800 * qty : 0))} <I.arrow/></button>
          </div>

          <div className="meta-strip">
            <div><div className="t">Free shipping</div><div className="d">Above ₹5,000 across India</div></div>
            <div><div className="t">Made to order</div><div className="d">7–14 working days</div></div>
            <div><div className="t">Easy returns</div><div className="d">10-day return on stock pieces</div></div>
          </div>
        </div>
      </section>

      {data.recommendations && data.recommendations.length > 0 && (
        <section style={{ borderTop: "1px solid var(--hairline)" }}>
          <Reveal>
            <div className="section-h">
              <div>
                <span className="eyebrow">Curated for you</span>
                <h2>You might also love</h2>
              </div>
            </div>
          </Reveal>
          <Stagger className="product-grid" gap={0.05}>
            {data.recommendations.map((r) => <StaggerItem key={r.id}><ProductCard p={r}/></StaggerItem>)}
          </Stagger>
        </section>
      )}

      <MeasurementsModal open={openModal} onClose={() => setOpenModal(false)} onSave={onSaveMeasurements} initial={user?.measurements || {}} title={`Custom fit · ${p.name}`}/>
    </div>
  );
}
