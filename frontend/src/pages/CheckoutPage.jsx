import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { inr, colorById, fabricById } from "../lib/constants";
import { I } from "../lib/icons";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [addr, setAddr] = useState({ full_name: user?.name || "", phone: user?.phone || "", line1: "", line2: "", city: "Hyderabad", state: "Telangana", pincode: "" });
  const [pay, setPay] = useState("cod");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && !user) navigate("/login?next=/checkout"); }, [user, loading, navigate]);
  useEffect(() => { if (items.length === 0) navigate("/cart"); }, [items.length, navigate]);

  const customCharge = items.filter((i) => i.custom).reduce((a, b) => a + 800 * b.qty, 0);
  const shipping = subtotal >= 5000 ? 0 : 149;
  const tax = Math.round((subtotal + customCharge) * 0.05);
  const total = subtotal + customCharge + shipping + tax;

  const placeOrder = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post("/orders", {
        items: items.map((i) => ({ ...i })),
        address: addr,
        payment_method: pay,
        notes: "",
      });
      clear();
      toast.success("Order placed");
      navigate(`/order/${data.order.id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not place order");
    } finally { setSubmitting(false); }
  };

  const validAddr = addr.full_name && addr.phone.length >= 10 && addr.line1 && addr.city && addr.pincode.length >= 6;

  return (
    <section className="co-shell" data-testid="checkout-page">
      <div className="co-main">
        <span className="eyebrow">Checkout</span>
        <h2>Complete your order</h2>
        <div className="co-stepper">
          <div className={`s ${step === 0 ? "active" : step > 0 ? "done" : ""}`}><span className="num">1</span> Shipping</div>
          <div className={`s ${step === 1 ? "active" : step > 1 ? "done" : ""}`}><span className="num">2</span> Payment</div>
          <div className={`s ${step === 2 ? "active" : ""}`}><span className="num">3</span> Review</div>
        </div>

        {step === 0 && (
          <div data-testid="step-shipping">
            <div className="co-section">
              <h3>Shipping address</h3>
              <div className="grid2">
                <label className="field">Full name <input value={addr.full_name} onChange={(e) => setAddr({ ...addr, full_name: e.target.value })} data-testid="addr-name"/></label>
                <label className="field">Phone <input value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} data-testid="addr-phone"/></label>
              </div>
              <div className="co-section">
                <label className="field">Address line 1 <input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} data-testid="addr-line1"/></label>
              </div>
              <div className="co-section">
                <label className="field">Address line 2 <input value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} data-testid="addr-line2"/></label>
              </div>
              <div className="grid3">
                <label className="field">City <input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} data-testid="addr-city"/></label>
                <label className="field">State <input value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} data-testid="addr-state"/></label>
                <label className="field">Pincode <input value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value })} data-testid="addr-pincode"/></label>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" disabled={!validAddr} onClick={() => setStep(1)} data-testid="continue-payment-btn">Continue to payment <I.arrow/></button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div data-testid="step-payment">
            <div className="co-section">
              <h3>Payment method</h3>
              <div className="pay-options">
                {[
                  { id: "cod", name: "Cash on Delivery", desc: "Pay when your order arrives", badge: "POPULAR" },
                  { id: "online", name: "Pay online (Mock)", desc: "Simulated UPI/Card payment for demo", badge: "DEMO" },
                ].map((opt) => (
                  <div key={opt.id} className={`pay-row ${pay === opt.id ? "active" : ""}`} onClick={() => setPay(opt.id)} data-testid={`pay-${opt.id}`}>
                    <div className="radio"/>
                    <div>
                      <div className="name">{opt.name}</div>
                      <div className="desc">{opt.desc}</div>
                    </div>
                    <span className="badge">{opt.badge}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep(2)} data-testid="continue-review-btn">Review order <I.arrow/></button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div data-testid="step-review">
            <div className="co-section">
              <h3>Review</h3>
              <div className="review-card">
                <div className="row"><span className="eyebrow">Ship to</span><span>{addr.full_name} · {addr.line1}, {addr.city} {addr.pincode}</span></div>
                <div className="row"><span className="eyebrow">Payment</span><span>{pay === "cod" ? "Cash on Delivery" : "Online (Mock)"}</span></div>
                {items.map((it, i) => (
                  <div key={i} className="row">
                    <span>{it.name} · {it.size} · {colorById(it.color).name} · {fabricById(it.fabric).name} · ×{it.qty}{it.custom ? " · MTM" : ""}</span>
                    <span>{inr(it.price * it.qty + (it.custom ? 800 * it.qty : 0))}</span>
                  </div>
                ))}
                <div className="row"><span>Shipping</span><span>{shipping === 0 ? "Free" : inr(shipping)}</span></div>
                <div className="row"><span>GST</span><span>{inr(tax)}</span></div>
                <div className="row total"><span>Total</span><span>{inr(total)}</span></div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={placeOrder} disabled={submitting} data-testid="place-order-btn">{submitting ? "Placing…" : `Place order · ${inr(total)}`} <I.check/></button>
            </div>
          </div>
        )}
      </div>
      <aside className="summary">
        <h3>Summary</h3>
        <div className="row"><span>Items</span><span>{items.length}</span></div>
        <div className="row"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
        {customCharge > 0 && <div className="row"><span>Stitching</span><span>+{inr(customCharge)}</span></div>}
        <div className="row"><span>Shipping</span><span>{shipping === 0 ? "Free" : inr(shipping)}</span></div>
        <div className="row"><span>Tax</span><span>{inr(tax)}</span></div>
        <div className="row total"><span>Total</span><span>{inr(total)}</span></div>
      </aside>
    </section>
  );
}
