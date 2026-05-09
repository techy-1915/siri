import React, { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext(null);
const KEY = "siri_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  const add = (it) => {
    setItems((curr) => {
      const idx = curr.findIndex((x) => x.product_id === it.product_id && x.size === it.size && x.color === it.color && x.fabric === it.fabric && JSON.stringify(x.measurements || {}) === JSON.stringify(it.measurements || {}));
      if (idx >= 0) {
        const next = [...curr];
        next[idx] = { ...next[idx], qty: next[idx].qty + (it.qty || 1) };
        return next;
      }
      return [...curr, { ...it, qty: it.qty || 1 }];
    });
  };

  const remove = (idx) => setItems((curr) => curr.filter((_, i) => i !== idx));
  const setQty = (idx, qty) => setItems((curr) => curr.map((c, i) => i === idx ? { ...c, qty: Math.max(1, qty) } : c));
  const clear = () => setItems([]);

  const subtotal = items.reduce((a, b) => a + b.price * b.qty, 0);
  const count = items.reduce((a, b) => a + b.qty, 0);

  return (
    <CartCtx.Provider value={{ items, add, remove, setQty, clear, subtotal, count }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
