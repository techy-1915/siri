import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { I } from "../lib/icons";

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}`);
      if (u.role === "admin") navigate("/admin"); else navigate(next);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <section className="auth-shell" data-testid="login-page">
      <div className="auth-art">
        <div className="ribbon">Siri Atelier · Hyderabad</div>
        <div>
          <h2>Welcome <em>home</em>, to the atelier.</h2>
          <p style={{ marginTop: 18, fontSize: 14, color: "rgba(246,240,232,0.78)", maxWidth: 420, lineHeight: 1.7 }}>Saved measurements, order history and bespoke services — all in one place.</p>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", color: "var(--accent-2)" }}>EST · 2014</div>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">Sign in</span>
        <h1 className="serif">Welcome back.</h1>
        <p className="sub">Sign in to view your orders, saved measurements and bookings.</p>
        <label className="field" style={{ marginBottom: 14 }}>Email <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email"/></label>
        <label className="field" style={{ marginBottom: 18 }}>Password <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password"/></label>
        <button type="submit" className="btn btn-primary" disabled={busy} data-testid="login-submit-btn">{busy ? "Signing in…" : "Sign in"} <I.arrow/></button>
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--ink-2)" }}>
          Don't have an account? <Link to="/register" style={{ color: "var(--primary)", textDecoration: "underline" }} data-testid="login-register-link">Register here</Link>
        </p>
        <p style={{ marginTop: 4, fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>Demo customer: demo@siriboutique.in · demo1234</p>
      </form>
    </section>
  );
}
