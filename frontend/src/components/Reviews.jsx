import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { I } from "../lib/icons";
import { motion } from "framer-motion";

function Stars({ value, onSet, readonly = false, size = 18 }) {
  return (
    <div style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => !readonly && onSet && onSet(n)}
          disabled={readonly}
          style={{ background: "none", border: 0, padding: 0, cursor: readonly ? "default" : "pointer", color: n <= value ? "var(--accent)" : "var(--hairline-2)" }}
          aria-label={`${n} stars`}
          data-testid={readonly ? undefined : `rating-star-${n}`}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z"/></svg>
        </button>
      ))}
    </div>
  );
}

export default function Reviews({ productId }) {
  const { user } = useAuth();
  const [data, setData] = useState({ reviews: [], count: 0, average: 0 });
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/products/${productId}/reviews`).then((r) => setData(r.data));
  useEffect(() => { load(); }, [productId]);

  const submit = async () => {
    if (!user) { toast.error("Sign in to write a review"); return; }
    if (!body.trim()) { toast.error("Write a few words about the piece"); return; }
    setBusy(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, title: title.trim(), body: body.trim(), images: [] });
      toast.success("Thank you for your review");
      setTitle(""); setBody(""); setRating(5);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not submit review");
    } finally { setBusy(false); }
  };

  return (
    <section style={{ borderTop: "1px solid var(--hairline)", padding: "60px 56px" }} data-testid="reviews-section">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 56 }} className="reviews-grid">
        <div>
          <span className="eyebrow">From the wardrobe</span>
          <h2 className="serif" style={{ fontSize: 36, fontWeight: 400, margin: "8px 0 14px" }}>Reviews</h2>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
            <Stars value={Math.round(data.average)} readonly size={22}/>
            <span className="serif" style={{ fontSize: 24 }}>{data.average.toFixed(1)}</span>
          </div>
          <div className="eyebrow">{data.count} {data.count === 1 ? "review" : "reviews"}</div>

          <div style={{ marginTop: 24, padding: 18, background: "var(--surface)", border: "1px solid var(--hairline)" }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Write a review</div>
            {!user ? (
              <p style={{ fontSize: 13, color: "var(--ink-2)" }}>Sign in to share your experience.</p>
            ) : (
              <>
                <Stars value={rating} onSet={setRating} size={20}/>
                <input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginTop: 10 }} data-testid="review-title-input"/>
                <textarea rows={3} placeholder="What did you love about it?" value={body} onChange={(e) => setBody(e.target.value)} style={{ marginTop: 8 }} data-testid="review-body-input"/>
                <button className="btn btn-primary sm" onClick={submit} disabled={busy} style={{ marginTop: 10 }} data-testid="submit-review-btn">{busy ? "Posting…" : "Post review"} <I.arrow/></button>
              </>
            )}
          </div>
        </div>
        <div>
          {data.reviews.length === 0 ? (
            <p style={{ color: "var(--ink-2)" }}>Be the first to write a review.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {data.reviews.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ background: "var(--surface)", border: "1px solid var(--hairline)", padding: 22 }}
                  data-testid={`review-${r.id}`}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Stars value={r.rating} readonly size={14}/>
                      <span className="serif" style={{ fontSize: 17 }}>{r.title || "Review"}</span>
                    </div>
                    {r.verified_buyer && <span className="chip wine" style={{ height: 20, fontSize: 10 }}><I.shield/> Verified</span>}
                  </div>
                  <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{r.body}</p>
                  <div style={{ marginTop: 10, fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em" }}>— {r.user_name} · {new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
