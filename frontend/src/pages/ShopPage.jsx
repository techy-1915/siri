import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import ProductCard from "../components/ProductCard";
import { Reveal, Stagger, StaggerItem } from "../components/anim";
import { COLORS } from "../lib/constants";

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const [all, setAll] = useState([]);
  const [cats, setCats] = useState([]);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data.categories));
    api.get("/products").then((r) => setAll(r.data.products));
  }, []);

  const cat = params.get("cat") || "";

  const filtered = useMemo(() => {
    let list = [...all];
    if (cat) list = list.filter((p) => p.cat === cat);
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    else if (sort === "high") list.sort((a, b) => b.price - a.price);
    return list;
  }, [all, cat, sort]);

  const setCat = (c) => {
    if (c) params.set("cat", c); else params.delete("cat");
    setParams(params, { replace: true });
  };

  return (
    <div data-testid="shop-page">
      <section className="catalog-shell">
        <aside className="filter-rail">
          <h4>Categories</h4>
          <div>
            <label className="opt">
              <span><input type="radio" name="cat" checked={cat === ""} onChange={() => setCat("")} data-testid="cat-all"/> All edits</span>
              <span className="ct">{all.length}</span>
            </label>
            {cats.map((c) => (
              <label key={c} className="opt">
                <span><input type="radio" name="cat" checked={cat === c} onChange={() => setCat(c)} data-testid={`cat-${c.replace(/\W+/g, "-")}`}/> {c}</span>
                <span className="ct">{all.filter((p) => p.cat === c).length}</span>
              </label>
            ))}
          </div>
          <h4>Colour</h4>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COLORS.map((c) => <span key={c.id} title={c.name} style={{ width: 22, height: 22, borderRadius: "50%", background: c.hex, border: "1px solid var(--hairline-2)" }}/>)}
          </div>
          <h4>Price</h4>
          <label className="opt"><span><input type="checkbox"/> Under ₹15,000</span></label>
          <label className="opt"><span><input type="checkbox"/> ₹15,000 – ₹25,000</span></label>
          <label className="opt"><span><input type="checkbox"/> ₹25,000+</span></label>
        </aside>
        <div className="catalog-main">
          <div className="catalog-toolbar">
            <Reveal>
              <span className="eyebrow">{cat || "All edits"} · {filtered.length} pieces</span>
            </Reveal>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} data-testid="sort-select">
                <option value="newest">Newest</option>
                <option value="low">Price · low to high</option>
                <option value="high">Price · high to low</option>
              </select>
            </div>
          </div>
          <Stagger className="catalog-grid" gap={0.04}>
            {filtered.map((p) => (
              <StaggerItem key={p.id}><ProductCard p={p}/></StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </div>
  );
}
