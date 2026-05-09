import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { I } from "../lib/icons";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success(`Welcome to Siri, ${form.name}`);
      navigate("/");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registration failed");
    } finally { setBusy(false); }
  };

  return (
    <section className="auth-shell" data-testid="register-page">
      <div className="auth-art">
        <div className="ribbon">Siri Atelier · Spring MMXXVI</div>
        <div>
          <h2>Begin your <em>bespoke</em> story.</h2>
          <p style={{ marginTop: 18, fontSize: 14, color: "rgba(246,240,232,0.78)", maxWidth: 420, lineHeight: 1.7 }}>An account lets us remember your measurements, ship to your favourite address and respond faster on bookings.</p>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", color: "var(--accent-2)" }}>WHERE STYLE MEETS PERFECTION</div>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">Create account</span>
        <h1 className="serif">Welcome to Siri.</h1>
        <p className="sub">Takes less than 30 seconds.</p>
        <label className="field" style={{ marginBottom: 12 }}>Full name <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="register-name"/></label>
        <label className="field" style={{ marginBottom: 12 }}>Email <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="register-email"/></label>
        <label className="field" style={{ marginBottom: 12 }}>Phone <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="register-phone"/></label>
        <label className="field" style={{ marginBottom: 18 }}>Password <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="register-password"/></label>
        <button type="submit" className="btn btn-primary" disabled={busy} data-testid="register-submit-btn">{busy ? "Creating…" : "Create account"} <I.arrow/></button>
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--ink-2)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--primary)", textDecoration: "underline" }}>Sign in</Link>
        </p>
      </form>
    </section>
  );
}
