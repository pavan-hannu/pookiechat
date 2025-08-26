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

export type FriendRequest = { id: string; from: string; to: string; status: "pending" | "accepted" | "rejected"; createdAt: number };

type AuthState = {
  me: User | null;
  users: User[];
  requests: FriendRequest[];
  login: (id: string, password: string) => Promise<boolean>;
  signup: (id: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  follow: (userId: string) => void;
  unfollow: (userId: string) => void;
  sendRequest: (to: string) => void;
  acceptRequest: (reqId: string) => void;
  rejectRequest: (reqId: string) => void;
};

const USERS_KEY = "app.users";
const SESSION_KEY = "app.session";
const REQ_KEY = "app.friendRequests";

const AuthCtx = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => readJSON<User[]>(USERS_KEY, []));
  const [requests, setRequests] = useState<FriendRequest[]>(() => readJSON<FriendRequest[]>(REQ_KEY, []));
  const [me, setMe] = useState<User | null>(() => {
    const id = readJSON<string | null>(SESSION_KEY, null);
    if (!id) return null;
    const u = readJSON<User[]>(USERS_KEY, []).find((x) => x.id === id) || null;
    return u ?? null;
  });

  useEffect(() => writeJSON(USERS_KEY, users), [users]);
  useEffect(() => writeJSON(REQ_KEY, requests), [requests]);
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

  function follow(userId: string) {
    if (!me || me.id === userId) return;
    setUsers((prev) => {
      const a = prev.find((u) => u.id === me.id)!;
      const b = prev.find((u) => u.id === userId);
      if (!b) return prev;
      const next = prev.map((u) =>
        u.id === a.id
          ? { ...u, following: Array.from(new Set([...u.following, userId])) }
          : u.id === b.id
          ? { ...u, followers: Array.from(new Set([...u.followers, me.id])) }
          : u,
      );
      broadcast({ type: "user-upsert", user: next.find((u) => u.id === a.id)! });
      broadcast({ type: "user-upsert", user: next.find((u) => u.id === b.id)! });
      if (me && me.id === a.id) setMe(next.find((u) => u.id === a.id)!);
      return next;
    });
  }

  function unfollow(userId: string) {
    if (!me || me.id === userId) return;
    setUsers((prev) => {
      const a = prev.find((u) => u.id === me.id)!;
      const b = prev.find((u) => u.id === userId);
      if (!b) return prev;
      const next = prev.map((u) =>
        u.id === a.id
          ? { ...u, following: u.following.filter((x) => x !== userId) }
          : u.id === b.id
          ? { ...u, followers: u.followers.filter((x) => x !== me.id) }
          : u,
      );
      broadcast({ type: "user-upsert", user: next.find((u) => u.id === a.id)! });
      broadcast({ type: "user-upsert", user: next.find((u) => u.id === b.id)! });
      if (me && me.id === a.id) setMe(next.find((u) => u.id === a.id)!);
      return next;
    });
  }

  function sendRequest(to: string) {
    if (!me || me.id === to) return;
    const req: FriendRequest = { id: crypto.randomUUID(), from: me.id, to, status: "pending", createdAt: Date.now() };
    setRequests((prev) => {
      const next = [...prev, req];
      broadcast({ type: "friend-request", request: req });
      return next;
    });
  }

  function acceptRequest(reqId: string) {
    setRequests((prev) => {
      const next = prev.map((r) => (r.id === reqId ? { ...r, status: "accepted" } : r));
      const r = next.find((x) => x.id === reqId);
      if (r) {
        // auto-follow both on accept
        setTimeout(() => {
          if (me && me.id === r.to) {
            follow(r.from);
            // also have other side follow me
            setUsers((uPrev) => {
              const fromUser = uPrev.find((u) => u.id === r.from);
              const toUser = uPrev.find((u) => u.id === r.to);
              if (!fromUser || !toUser) return uPrev;
              const nextU = uPrev.map((u) =>
                u.id === fromUser.id
                  ? { ...u, following: Array.from(new Set([...u.following, r.to])) }
                  : u.id === toUser.id
                  ? { ...u, followers: Array.from(new Set([...u.followers, r.from])) }
                  : u,
              );
              broadcast({ type: "user-upsert", user: nextU.find((u) => u.id === fromUser.id)! });
              broadcast({ type: "user-upsert", user: nextU.find((u) => u.id === toUser.id)! });
              return nextU;
            });
          }
        }, 0);
      }
      broadcast({ type: "friend-request-update", request: r! });
      return next;
    });
  }

  function rejectRequest(reqId: string) {
    setRequests((prev) => {
      const next = prev.map((r) => (r.id === reqId ? { ...r, status: "rejected" } : r));
      const r = next.find((x) => x.id === reqId)!;
      broadcast({ type: "friend-request-update", request: r });
      return next;
    });
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
      } else if (ev.type === "friend-request") {
        setRequests((prev) => (prev.some((r) => r.id === ev.request.id) ? prev : [...prev, ev.request]));
      } else if (ev.type === "friend-request-update") {
        setRequests((prev) => prev.map((r) => (r.id === ev.request.id ? ev.request : r)));
      }
    };
    ch.addEventListener("message", onMsg);
    return () => ch.removeEventListener("message", onMsg);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ me, users, requests, login, signup, logout, follow, unfollow, sendRequest, acceptRequest, rejectRequest }),
    [me, users, requests],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Events
export type AnyEvent =
  | { type: "user-upsert"; user: User }
  | { type: "session"; id: string }
  | { type: "friend-request"; request: FriendRequest }
  | { type: "friend-request-update"; request: FriendRequest };

function broadcast(ev: AnyEvent) {
  const ch = new BroadcastChannel("app.events");
  ch.postMessage(ev);
  ch.close();
}
