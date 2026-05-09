import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("siri_token");
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (_) {
      localStorage.removeItem("siri_token");
      setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("siri_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("siri_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("siri_token");
    setUser(null);
  };

  const saveMeasurements = async (m) => {
    const { data } = await api.put("/auth/measurements", m);
    setUser((u) => ({ ...u, measurements: data.measurements }));
    return data.measurements;
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, saveMeasurements, refresh: fetchMe }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
