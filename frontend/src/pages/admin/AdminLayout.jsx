import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { I } from "../../lib/icons";
import api from "../../lib/api";
import BackButton from "../../components/BackButton";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [counts, setCounts] = useState({ orders: 0, bookings: 0, products: 0, customers: 0 });

  useEffect(() => {
    if (!user) navigate("/admin/login"); else if (user.role !== "admin") navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    Promise.all([
      api.get("/admin/orders"),
      api.get("/admin/bookings"),
      api.get("/admin/customers"),
      api.get("/products"),
    ]).then(([o, b, c, p]) => {
      setCounts({ orders: o.data.orders.length, bookings: b.data.bookings.length, customers: c.data.customers.length, products: p.data.products.length });
    }).catch(() => {});
  }, [user, loc.pathname]);

  if (!user || user.role !== "admin") return null;

  const NavItem = ({ to, icon, label, count }) => (
    <NavLink to={to} end={to === "/admin"} className={({ isActive }) => `navrow ${isActive ? "active" : ""}`} data-testid={`adm-nav-${label.toLowerCase()}`}>
      {icon} <span>{label}</span>
      {count != null && <span className="ct">{count}</span>}
    </NavLink>
  );

  return (
    <div className="adm-shell" data-testid="admin-layout">
      <aside className="adm-side">
        <div className="brand">Siri<span className="dot">.</span><span className="sub">Operations Console</span></div>
        <h5>Operate</h5>
        <NavItem to="/admin" icon={<I.dash/>} label="Dashboard"/>
        <NavItem to="/admin/orders" icon={<I.orders/>} label="Orders" count={counts.orders}/>
        <NavItem to="/admin/bookings" icon={<I.scissor/>} label="Bookings" count={counts.bookings}/>
        <h5>Catalog</h5>
        <NavItem to="/admin/products" icon={<I.prods/>} label="Products" count={counts.products}/>
        <NavItem to="/admin/coupons" icon={<I.shield/>} label="Coupons"/>
        <h5>People</h5>
        <NavItem to="/admin/customers" icon={<I.custs/>} label="Customers" count={counts.customers}/>
        <h5>Insights</h5>
        <NavItem to="/admin/reports" icon={<I.rep/>} label="Reports"/>
        <div className="user">
          <div className="av">{(user.name || "A").slice(0, 2).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div className="name">{user.name}</div>
            <div className="role">Owner · admin</div>
          </div>
          <button className="btn btn-link" onClick={() => { logout(); navigate("/admin/login"); }} data-testid="adm-logout-btn">Sign out</button>
        </div>
      </aside>
      <main className="adm-main">
        <div className="adm-top">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BackButton/>
            <div>
              <div className="breadcrumb">SIRI · {loc.pathname.replace("/admin", "ADMIN").toUpperCase().replace(/\//g, " / ") || "ADMIN"}</div>
              <h1 style={{ marginTop: 4 }}>{titleFor(loc.pathname)}</h1>
            </div>
          </div>
          <div className="actions">
            <input className="search" placeholder="Search orders, customers…"/>
            <button className="btn btn-ghost sm" onClick={() => navigate("/")} data-testid="adm-view-store-btn">View storefront</button>
          </div>
        </div>
        <div className="adm-content">
          <Outlet/>
        </div>
      </main>
    </div>
  );
}

function titleFor(path) {
  if (path === "/admin") return "Dashboard";
  if (path.startsWith("/admin/orders")) return "Orders";
  if (path.startsWith("/admin/bookings")) return "Tailoring bookings";
  if (path.startsWith("/admin/products")) return "Products & inventory";
  if (path.startsWith("/admin/customers")) return "Customers";
  if (path.startsWith("/admin/coupons")) return "Coupons";
  if (path.startsWith("/admin/reports")) return "Reports";
  return "Admin";
}
