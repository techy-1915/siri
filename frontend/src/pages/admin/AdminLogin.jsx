import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { I } from "../../lib/icons";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      if (u.role !== "admin") { toast.error("Not an admin account"); return; }
      navigate("/admin");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <section className="auth-shell" data-testid="admin-login-page">
      <div className="auth-art">
        <div className="ribbon">Siri Ops Console</div>
        <div>
          <h2>Admin <em>console</em>.</h2>
          <p style={{ marginTop: 18, fontSize: 14, color: "rgba(246,240,232,0.78)", maxWidth: 420, lineHeight: 1.7 }}>Live orders, tailoring bookings, inventory, customers and reports — one console.</p>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.18em", color: "var(--accent-2)" }}>RESTRICTED ACCESS</div>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <span className="eyebrow">Admin sign in</span>
        <h1 className="serif">Operations console</h1>
        <p className="sub">Enter your admin credentials to continue.</p>
        <label className="field" style={{ marginBottom: 14 }}>Email <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="admin-login-email"/></label>
        <label className="field" style={{ marginBottom: 18 }}>Password <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="admin-login-password"/></label>
        <button type="submit" className="btn btn-primary" disabled={busy} data-testid="admin-login-submit-btn">{busy ? "Signing in…" : "Sign in"} <I.arrow/></button>
        <p style={{ marginTop: 12, fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--mono)" }}>Default · admin@siriboutique.in · SiriAdmin@2026</p>
      </form>
    </section>
  );
}
