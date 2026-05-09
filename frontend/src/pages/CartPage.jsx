import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { inr, colorById, fabricById, resolveImg } from "../lib/constants";
import { Placeholder, I } from "../lib/icons";
import api from "../lib/api";
import { toast } from "sonner";

export default function CartPage() {
  const { items, remove, setQty, subtotal, count } = useCart();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(null);
  const [discount, setDiscount] = useState(0);

  const customCharge = items.filter((i) => i.custom).reduce((a, b) => a + 800 * b.qty, 0);
  const shipping = subtotal >= 5000 ? 0 : 149;
  const tax = Math.round((subtotal + customCharge - discount) * 0.05);
  const total = subtotal + customCharge - discount + shipping + tax;

  const apply = async () => {
    if (!coupon.trim()) return;
    try {
      const { data } = await api.post("/coupons/validate", { code: coupon.trim().toUpperCase(), subtotal });
      setApplied(data.coupon); setDiscount(data.discount);
      toast.success(`${data.coupon.code} applied`, { description: `Saved ${inr(data.discount)}` });
    } catch (e) {
      toast.error(e.response?.data?.detail || "Invalid coupon");
    }
  };

  if (count === 0) {
    return (
      <div style={{ padding: 80, textAlign: "center" }} data-testid="cart-empty">
        <h2 className="serif" style={{ fontSize: 36, fontWeight: 400, marginBottom: 8 }}>Your bag is empty</h2>
        <p style={{ color: "var(--ink-2)", marginBottom: 24 }}>Discover the Spring edit and find a piece that feels like you.</p>
        <Link to="/shop" className="btn btn-primary" data-testid="cart-empty-shop-btn">Browse the shop <I.arrow/></Link>
      </div>
    );
  }

  return (
    <section className="cart-shell" data-testid="cart-page">
      <div className="cart-list">
        <h2>Your bag · {count} {count === 1 ? "piece" : "pieces"}</h2>
        {items.map((it, idx) => (
          <div key={idx} className="cart-item" data-testid={`cart-item-${idx}`}>
            <div className="ph">{it.image ? <img src={resolveImg(it.image)} alt={it.name}/> : <Placeholder label={it.name}/>}</div>
            <div className="info">
              <div className="name">{it.name}</div>
              <div className="opts">
                <span className="tag">{it.size}</span>
                <span className="tag">{colorById(it.color).name}</span>
                <span className="tag">{fabricById(it.fabric).name}</span>
                {it.custom && <span className="tag" style={{ background: "var(--primary)", color: "#fff" }}>Made to measure +{inr(800)}</span>}
              </div>
              <div className="links">
                <button onClick={() => remove(idx)} data-testid={`cart-remove-${idx}`}>Remove</button>
                <button>Save for later</button>
              </div>
            </div>
            <div className="right">
              <div className="p">{inr(it.price * it.qty + (it.custom ? 800 * it.qty : 0))}</div>
              <div className="qty" style={{ height: 32 }}>
                <button onClick={() => setQty(idx, it.qty - 1)} data-testid={`cart-qty-dec-${idx}`}>−</button>
                <span className="n">{it.qty}</span>
                <button onClick={() => setQty(idx, it.qty + 1)} data-testid={`cart-qty-inc-${idx}`}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <aside className="summary">
        <h3>Order summary</h3>
        <div className="row"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
        {customCharge > 0 && <div className="row"><span>Bespoke stitching</span><span>+{inr(customCharge)}</span></div>}
        {applied && <div className="applied"><span>{applied.code} · {applied.description}</span><button className="btn btn-link" onClick={() => { setApplied(null); setDiscount(0); }}>remove</button></div>}
        {discount > 0 && <div className="row"><span>Discount</span><span>−{inr(discount)}</span></div>}
        <div className="row"><span>Shipping</span><span>{shipping === 0 ? "Free" : inr(shipping)}</span></div>
        <div className="row"><span>GST (5%)</span><span>{inr(tax)}</span></div>
        <div className="row total"><span>Total</span><span data-testid="cart-total">{inr(total)}</span></div>
        <div className="promo">
          <input placeholder="Promo code" value={coupon} onChange={(e) => setCoupon(e.target.value)} data-testid="coupon-input"/>
          <button className="btn btn-ghost sm" onClick={apply} data-testid="apply-coupon-btn">Apply</button>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 14 }}>Try <code style={{ fontFamily: "var(--mono)" }}>SIRI10</code> for 10% off your first order.</p>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => navigate("/checkout")} data-testid="checkout-btn">Checkout · {inr(total)} <I.arrow/></button>
      </aside>
    </section>
  );
}
