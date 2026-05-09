import React from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { I } from "../lib/icons";
import { BRAND } from "../lib/constants";
import BackButton from "./BackButton";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function CustomerNav() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { count } = useCart();
  const { user } = useAuth();

  const links = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/services", label: "Tailoring & Services" },
    { to: "/about", label: "Atelier" },
    { to: "/visit", label: "Visit" },
  ];

  return (
    <header className="cust-nav" data-testid="customer-nav">
      <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <BackButton/>
        <Link to="/" className="brand" data-testid="brand-link">
          Siri<span className="dot">.</span>
          <span className="tag">{BRAND.tagline}</span>
        </Link>
        <nav>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => isActive || (l.to === "/shop" && loc.pathname.startsWith("/shop")) ? "active" : ""}
              end={l.to === "/"}
              data-testid={`nav-${l.label.toLowerCase().replace(/\W+/g, "-")}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="nav-actions">
        <a href={`tel:${BRAND.phone}`} className="phone-link" data-testid="nav-phone">{BRAND.phoneFmt}</a>
        <button className="icon-btn" onClick={() => navigate("/shop")} data-testid="nav-search-btn"><I.search/></button>
        <button className="icon-btn" onClick={() => navigate(user ? "/account" : "/login")} data-testid="nav-user-btn"><I.user/></button>
        <button className="icon-btn" onClick={() => navigate("/cart")} data-testid="nav-cart-btn">
          <I.bag/>
          {count > 0 && <span className="badge" data-testid="nav-cart-count">{count}</span>}
        </button>
      </div>
    </header>
  );
}
