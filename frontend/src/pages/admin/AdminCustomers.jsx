import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { inr } from "../../lib/constants";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  useEffect(() => { api.get("/admin/customers").then((r) => setCustomers(r.data.customers)); }, []);
  return (
    <div data-testid="admin-customers">
      <div className="panel">
        <table className="adm-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th className="r">Lifetime value</th><th>Joined</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} data-testid={`customer-${c.id}`}>
                <td><div className="cust"><div className="av">{(c.name || "?").slice(0, 2).toUpperCase()}</div>{c.name}</div></td>
                <td>{c.email}</td>
                <td>{c.phone || "—"}</td>
                <td>{c.orders_count}</td>
                <td className="r">{inr(c.lifetime_value)}</td>
                <td style={{ color: "var(--ink-2)", fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan="6" style={{ padding: 32, textAlign: "center", color: "var(--ink-2)" }}>No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
