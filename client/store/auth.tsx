import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { Jwk, SealedPrivateKey, generateKeyPair, openPrivateKey, sealPrivateKey } from "@/lib/crypto";
import { readJSON, writeJSON, del } from "@/lib/storage";

export type User = {
  id: string; // username (unique) for demo
  publicKey: Jwk;
  sealedPrivateKey?: SealedPrivateKey; // stored for the current device only
  following: string[];
  followers: string[];
  blocked?: boolean;
};

type AuthState = {
  me: User | null;
  users: User[];
  login: (id: string, password: string) => Promise<boolean>;
  signup: (id: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const USERS_KEY = "app.users";
const SESSION_KEY = "app.session";

const AuthCtx = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => readJSON<User[]>(USERS_KEY, []));
  const [me, setMe] = useState<User | null>(() => {
    const id = readJSON<string | null>(SESSION_KEY, null);
    if (!id) return null;
    const u = readJSON<User[]>(USERS_KEY, []).find((x) => x.id === id) || null;
    return u ?? null;
  });

  useEffect(() => writeJSON(USERS_KEY, users), [users]);
  useEffect(() => writeJSON(SESSION_KEY, me?.id ?? null), [me]);

  async function signup(id: string, password: string) {
    id = id.trim().toLowerCase();
    if (!id || !password) return { ok: false, error: "Username and password required" };
    if (users.some((u) => u.id === id)) return { ok: false, error: "Username already exists" };

    const { publicJwk, privateJwk } = await generateKeyPair();
    const sealed = await sealPrivateKey(privateJwk, password);
    const user: User = { id, publicKey: publicJwk, sealedPrivateKey: sealed, following: [], followers: [], blocked: false };
    const next = [...users, user];
    setUsers(next);
    setMe(user);
    broadcast({ type: "user-upsert", user });
    return { ok: true };
  }

  async function login(id: string, password: string) {
    id = id.trim().toLowerCase();
    const u = users.find((x) => x.id === id);
    if (!u || !u.sealedPrivateKey) return false;
    try {
      await openPrivateKey(u.sealedPrivateKey, password); // verify password can unlock
      setMe(u);
      broadcast({ type: "session", id: u.id });
      return true;
    } catch {
      return false;
    }
  }

  function logout() {
    setMe(null);
    del(SESSION_KEY);
  }

  // realtime via BroadcastChannel across tabs (demo only)
  useEffect(() => {
    const ch = new BroadcastChannel("app.events");
    const onMsg = (e: MessageEvent) => {
      const ev = e.data as AnyEvent;
      if (ev.type === "user-upsert") {
        setUsers((prev) => {
          const i = prev.findIndex((x) => x.id === ev.user.id);
          if (i >= 0) {
            const next = [...prev];
            next[i] = ev.user;
            return next;
          }
          return [...prev, ev.user];
        });
      }
    };
    ch.addEventListener("message", onMsg);
    return () => ch.removeEventListener("message", onMsg);
  }, []);

  const value = useMemo<AuthState>(() => ({ me, users, login, signup, logout }), [me, users]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Events
export type AnyEvent = { type: "user-upsert"; user: User } | { type: "session"; id: string };

function broadcast(ev: AnyEvent) {
  const ch = new BroadcastChannel("app.events");
  ch.postMessage(ev);
  ch.close();
}
