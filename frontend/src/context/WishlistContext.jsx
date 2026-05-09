import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

const WishCtx = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set());

  const refresh = useCallback(async () => {
    if (!user) { setIds(new Set()); return; }
    try {
      const { data } = await api.get("/wishlist");
      setIds(new Set(data.items.map((p) => p.id)));
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (pid) => {
    if (!user) return false;
    if (ids.has(pid)) {
      await api.delete(`/wishlist/${pid}`);
      setIds((s) => { const n = new Set(s); n.delete(pid); return n; });
      return false;
    }
    await api.post(`/wishlist/${pid}`);
    setIds((s) => new Set(s).add(pid));
    return true;
  };

  const has = (pid) => ids.has(pid);

  return <WishCtx.Provider value={{ ids, has, toggle, refresh, count: ids.size }}>{children}</WishCtx.Provider>;
}

export const useWishlist = () => useContext(WishCtx);
