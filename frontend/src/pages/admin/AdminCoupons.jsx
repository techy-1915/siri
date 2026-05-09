import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { inr } from "../../lib/constants";
import { I } from "../../lib/icons";
import { toast } from "sonner";

const EMPTY = { code: "", description: "", type: "percent", value: 10, min_order: 0, active: true };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);

  const load = () => api.get("/admin/coupons").then((r) => setCoupons(r.data.coupons));
  useEffect(load, []);

  const create = async () => {
    if (!form.code || !form.value) return;
    await api.post("/admin/coupons", form);
    toast.success("Coupon saved"); setForm(EMPTY); load();
  };
  const del = async (code) => { await api.delete(`/admin/coupons/${code}`); toast.success("Removed"); load(); };

  return (
    <div data-testid="admin-coupons">
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-h"><h3>New coupon</h3></div>
        <div className="panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr) auto", gap: 10, alignItems: "end" }}>
            <label className="field">Code <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} data-testid="coupon-code"/></label>
            <label className="field">Description <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="coupon-desc"/></label>
            <label className="field">Type <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="percent">%</option><option value="flat">Flat ₹</option></select></label>
            <label className="field">Value <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}/></label>
            <label className="field">Min order ₹ <input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: parseFloat(e.target.value) || 0 })}/></label>
            <button className="btn btn-primary" onClick={create} data-testid="create-coupon-btn">Save <I.plus/></button>
          </div>
        </div>
      </div>
      <div className="panel">
        <table className="adm-table">
          <thead><tr><th>Code</th><th>Description</th><th>Discount</th><th>Min order</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.code}>
                <td className="order-id">{c.code}</td>
                <td>{c.description}</td>
                <td>{c.type === "percent" ? `${c.value}%` : inr(c.value)}</td>
                <td>{inr(c.min_order)}</td>
                <td><span className={`status ${c.active ? "shipped" : "return"}`}><span className="dotc"/>{c.active ? "active" : "inactive"}</span></td>
                <td><button className="btn btn-link" onClick={() => del(c.code)} style={{ color: "var(--danger)" }}>delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
