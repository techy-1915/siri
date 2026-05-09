import React from "react";
import { Link } from "react-router-dom";
import { BRAND } from "../lib/constants";

export default function Footer() {
  return (
    <footer className="site-foot">
      <div>
        <div className="brand">Siri<span className="dot">.</span></div>
        <p style={{ color: "rgba(246,240,232,0.7)", fontSize: 13, lineHeight: 1.7, marginTop: 14, maxWidth: 320 }}>
          Couture, custom dresses, blouses & saree services from our Hyderabad atelier. Established {BRAND.established}.
        </p>
      </div>
      <div>
        <h6>Shop</h6>
        <ul>
          <li><Link to="/shop">All Edits</Link></li>
          <li><Link to="/shop?cat=Lehengas+%26+Gagras">Lehengas</Link></li>
          <li><Link to="/shop?cat=Designer+Blouses">Blouses</Link></li>
          <li><Link to="/shop?cat=Sarees">Sarees</Link></li>
          <li><Link to="/shop?cat=Indo-Western">Indo-Western</Link></li>
        </ul>
      </div>
      <div>
        <h6>Atelier</h6>
        <ul>
          <li><Link to="/services">Custom tailoring</Link></li>
          <li><Link to="/services">Maggam work</Link></li>
          <li><Link to="/services">Saree pre-pleating</Link></li>
          <li><Link to="/services">Wholesale materials</Link></li>
        </ul>
      </div>
      <div>
        <h6>Visit</h6>
        <ul>
          <li>{BRAND.address}</li>
          <li>{BRAND.hours}</li>
          <li><a href={`tel:${BRAND.phone}`}>{BRAND.phoneFmt}</a></li>
          <li><a href={`mailto:${BRAND.email}`}>{BRAND.email}</a></li>
        </ul>
      </div>
    </footer>
  );
}
