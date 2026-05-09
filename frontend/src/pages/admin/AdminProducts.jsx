import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { inr, COLORS, FABRICS, SIZES } from "../../lib/constants";
import { I, Placeholder } from "../../lib/icons";
import { toast } from "sonner";

const EMPTY = {
  name: "", style: "", cat: "Designer Dresses", price: 0, was: null, hue: 20, tag: "",
  description: "", images: [], colors: ["wine","ivory"], fabrics: ["silk","georg"], sizes: ["XS","S","M","L","XL"], stock: 10, tags: [], custom_available: true,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [cats, setCats] = useState([]);

  const load = () => api.get("/products").then((r) => setProducts(r.data.products));
  useEffect(() => { load(); api.get("/categories").then((r) => setCats(r.data.categories)); }, []);

  const startCreate = () => setEditing({ ...EMPTY });
  const startEdit = (p) => setEditing({ ...p });

  const save = async () => {
    if (!editing.name || !editing.price) { toast.error("Name and price required"); return; }
    try {
      if (editing.id) {
        await api.put(`/admin/products/${editing.id}`, editing);
        toast.success("Product updated");
      } else {
        await api.post("/admin/products", editing);
        toast.success("Product created");
      }
      setEditing(null); load();
    } catch (e) { toast.error(e.response?.data?.detail || "Could not save"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await api.delete(`/admin/products/${id}`); toast.success("Deleted"); load();
  };

  const onFiles = async (files) => {
    const out = [...(editing.images || [])];
    for (const f of files) {
      try {
        const fd = new FormData();
        fd.append("file", f);
        const { data } = await api.post("/admin/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
        out.push(data.url);
      } catch (e) {
        toast.error(`Upload failed: ${f.name}`);
      }
    }
    setEditing({ ...editing, images: out });
  };

  return (
    <div data-testid="admin-products">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
        <div className="eyebrow">{products.length} products</div>
        <button className="btn btn-primary sm" onClick={startCreate} data-testid="new-product-btn"><I.plus/> New product</button>
      </div>

      <div className="panel">
        <table className="adm-table">
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Stock</th><th className="r">Price</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} data-testid={`adm-product-${p.id}`}>
                <td style={{ width: 80 }}>
                  <div style={{ width: 60, height: 60, position: "relative", border: "1px solid var(--hairline)" }}>
                    <Placeholder hue={p.hue} image={(p.images && p.images[0]) || null} label={p.name}/>
                  </div>
                </td>
                <td><div className="serif" style={{ fontSize: 16, fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: 12, color: "var(--ink-2)" }}>{p.style}</div></td>
                <td>{p.cat}</td>
                <td>{p.stock}</td>
                <td className="r">{inr(p.price)}</td>
                <td className="r">
                  <button className="btn btn-link sm" onClick={() => startEdit(p)} data-testid={`edit-product-${p.id}`}>edit</button>
                  &nbsp;·&nbsp;
                  <button className="btn btn-link sm" onClick={() => del(p.id)} data-testid={`delete-product-${p.id}`} style={{ color: "var(--danger)" }}>delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ gridTemplateColumns: "1fr", maxWidth: 760, maxHeight: "94vh" }} data-testid="product-modal">
            <div className="right" style={{ overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3>{editing.id ? "Edit" : "New"} product</h3>
                <button className="btn btn-link" onClick={() => setEditing(null)}><I.close/></button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="field">Name <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} data-testid="product-name-input"/></label>
                <label className="field">Style line <input value={editing.style} onChange={(e) => setEditing({ ...editing, style: e.target.value })} data-testid="product-style-input"/></label>
                <label className="field">Category
                  <select value={editing.cat} onChange={(e) => setEditing({ ...editing, cat: e.target.value })} data-testid="product-cat-select">
                    {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="field">Tag (optional)
                  <select value={editing.tag || ""} onChange={(e) => setEditing({ ...editing, tag: e.target.value || null })}>
                    <option value="">None</option><option>New</option><option>Bestseller</option><option>Sale</option><option>Couture</option><option>Maggam</option>
                  </select>
                </label>
                <label className="field">Price (₹) <input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} data-testid="product-price-input"/></label>
                <label className="field">Was price (optional) <input type="number" value={editing.was || ""} onChange={(e) => setEditing({ ...editing, was: e.target.value ? parseFloat(e.target.value) : null })}/></label>
                <label className="field">Stock <input type="number" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: parseInt(e.target.value) || 0 })} data-testid="product-stock-input"/></label>
                <label className="field">Hue (0–360 for placeholder colour) <input type="number" min="0" max="360" value={editing.hue || 0} onChange={(e) => setEditing({ ...editing, hue: parseInt(e.target.value) || 0 })}/></label>
              </div>
              <label className="field" style={{ marginTop: 12 }}>Description <textarea rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} data-testid="product-description-input"/></label>

              <div style={{ marginTop: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Available colours</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {COLORS.map((c) => {
                    const on = (editing.colors || []).includes(c.id);
                    return <button key={c.id} className={`color-swatch ${on ? "active" : ""}`} style={{ background: c.hex }} onClick={() => setEditing({ ...editing, colors: on ? editing.colors.filter((x) => x !== c.id) : [...(editing.colors || []), c.id] })} aria-label={c.name}/>;
                  })}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Available fabrics</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {FABRICS.map((f) => {
                    const on = (editing.fabrics || []).includes(f.id);
                    return <button key={f.id} className={`chip ${on ? "solid" : ""}`} style={{ height: 30, padding: "0 14px", cursor: "pointer" }} onClick={() => setEditing({ ...editing, fabrics: on ? editing.fabrics.filter((x) => x !== f.id) : [...(editing.fabrics || []), f.id] })}>{f.name}</button>;
                  })}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Sizes</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {SIZES.map((s) => {
                    const on = (editing.sizes || []).includes(s);
                    return <button key={s} className={`size-pill ${on ? "active" : ""}`} onClick={() => setEditing({ ...editing, sizes: on ? editing.sizes.filter((x) => x !== s) : [...(editing.sizes || []), s] })}>{s}</button>;
                  })}
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Images</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {(editing.images || []).map((img, i) => (
                    <div key={i} style={{ position: "relative", aspectRatio: "1", border: "1px solid var(--hairline)" }}>
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                      <button onClick={() => setEditing({ ...editing, images: editing.images.filter((_, j) => j !== i) })} style={{ position: "absolute", top: 4, right: 4, background: "var(--ink)", color: "#fff", border: 0, padding: "2px 6px", cursor: "pointer", fontSize: 10 }}>×</button>
                    </div>
                  ))}
                  <label style={{ aspectRatio: "1", border: "1px dashed var(--hairline-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--surface)", color: "var(--ink-2)", fontSize: 12 }}>
                    <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => onFiles(e.target.files)} data-testid="product-image-upload"/>
                    <span><I.upload/> upload</span>
                  </label>
                </div>
              </div>

              <div className="footer-row">
                <button className="btn btn-link" onClick={() => setEditing(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={save} data-testid="save-product-btn">{editing.id ? "Save changes" : "Create product"} <I.check/></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function fileToDataUrl(file) {
  // legacy fallback (unused after object-storage upload)
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
