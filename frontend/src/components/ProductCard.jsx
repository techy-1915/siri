import React from "react";
import { Link } from "react-router-dom";
import { Placeholder, I } from "../lib/icons";
import { COLORS, inr } from "../lib/constants";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function ProductCard({ p }) {
  const wish = useWishlist();
  const { user } = useAuth();
  const liked = wish ? wish.has(p.id) : false;

  const onHeart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.message("Sign in to save favourites"); return; }
    const added = await wish.toggle(p.id);
    toast.success(added ? "Saved to wishlist" : "Removed from wishlist");
  };

  return (
    <Link to={`/shop/${p.id}`} className="product-card" data-testid={`product-card-${p.id}`}>
      <div className="ph-wrap">
        <Placeholder label={p.name} hue={p.hue} image={(p.images && p.images[0]) || null} />
        {p.tag && (
          <div className="corner-tag">
            <span className={`chip ${p.tag === "Sale" ? "gold" : (p.tag === "Couture" || p.tag === "Maggam" ? "solid" : "wine")}`}>{p.tag}</span>
          </div>
        )}
        <button
          className="heart-btn"
          onClick={onHeart}
          aria-label={liked ? "Remove from wishlist" : "Save to wishlist"}
          data-testid={`wishlist-toggle-${p.id}`}
          style={{
            position: "absolute", top: 10, right: 10, width: 32, height: 32,
            border: "1px solid var(--hairline)", background: liked ? "var(--primary)" : "var(--surface)",
            color: liked ? "#fff" : "var(--ink)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%",
            transition: "background .2s, color .2s, transform .15s",
          }}
        >
          <I.heart/>
        </button>
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
