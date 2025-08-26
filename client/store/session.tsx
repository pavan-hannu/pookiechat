import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Me = { username: string; is_staff: boolean; settings?: { theme?: "light" | "dark"; avatarUrl?: string } } | null;

type SessionState = {
  me: Me;
  fetchMe: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateSettings: (settings: { theme?: "light" | "dark"; avatarUrl?: string }) => Promise<void>;
};

const Ctx = createContext<SessionState | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [me, setMe] = useState<Me>(null);

  const fetchMe = async () => {
    try {
      const res = await api.get("/me/");
      setMe(res.data);
      const theme = res.data?.settings?.theme === "dark" ? "dark" : "light";
      if (theme === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {
      setMe(null);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  async function login(username: string, password: string) {
    try {
      await api.post("/auth/login/", { username, password });
      await fetchMe();
      return true;
    } catch {
      return false;
    }
  }

  async function register(username: string, password: string) {
    try {
      await api.post("/auth/register/", { username, password });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.error || "Unable to register" };
    }
  }

  async function logout() {
    await api.post("/auth/logout/");
    setMe(null);
  }

  async function updateSettings(settings: { theme?: "light" | "dark"; avatarUrl?: string }) {
    await api.post("/settings/", settings);
    await fetchMe();
  }

  const value = useMemo(() => ({ me, fetchMe, login, register, logout, updateSettings }), [me]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
