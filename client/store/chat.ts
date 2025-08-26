import { useEffect, useMemo, useState } from "react";
import { readJSON, writeJSON } from "@/lib/storage";
import { Jwk, decryptWith, encryptFor, openPrivateKey } from "@/lib/crypto";
import { useAuth } from "@/store/auth";

export type Message = {
  id: string;
  from: string;
  to: string; // recipient username
  cipherText: string; // base64
  createdAt: number;
};

const MSG_KEY = "app.messages";

export function useChat() {
  const { me, users } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() =>
    readJSON<Message[]>(MSG_KEY, []),
  );

  useEffect(() => writeJSON(MSG_KEY, messages), [messages]);

  useEffect(() => {
    const ch = new BroadcastChannel("app.chat");
    const onMsg = (e: MessageEvent) => {
      const m = e.data as Message;
      setMessages((prev) =>
        prev.some((x) => x.id === m.id) ? prev : [...prev, m],
      );
    };
    ch.addEventListener("message", onMsg);
    return () => ch.removeEventListener("message", onMsg);
  }, []);

  async function send(to: string, plaintext: string) {
    if (!me) throw new Error("Not authenticated");
    const recipient = users.find((u) => u.id === to);
    if (!recipient) throw new Error("Recipient not found");
    const cipherText = await encryptFor(recipient.publicKey as Jwk, plaintext);
    const m: Message = {
      id: crypto.randomUUID(),
      from: me.id,
      to,
      cipherText,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, m]);
    const ch = new BroadcastChannel("app.chat");
    ch.postMessage(m);
    ch.close();
  }

  const threads = useMemo(() => {
    if (!me) return [] as { peer: string; lastAt: number }[];
    const ids = new Set<string>();
    messages.forEach((m) => {
      if (m.from === me.id) ids.add(m.to);
      if (m.to === me.id) ids.add(m.from);
    });
    return Array.from(ids).map((peer) => ({
      peer,
      lastAt: messages
        .filter(
          (m) =>
            (m.from === me.id && m.to === peer) ||
            (m.to === me.id && m.from === peer),
        )
        .reduce((acc, m) => Math.max(acc, m.createdAt), 0),
    }));
  }, [messages, me]);

  async function listDecrypted(peer: string, password: string) {
    if (!me)
      return [] as {
        id: string;
        dir: "in" | "out";
        text: string;
        createdAt: number;
      }[];
    const mine = messages.filter(
      (m) =>
        (m.from === me.id && m.to === peer) ||
        (m.to === me.id && m.from === peer),
    );
    const privateJwk = me.sealedPrivateKey
      ? await openPrivateKey(me.sealedPrivateKey, password)
      : null;
    const result: {
      id: string;
      dir: "in" | "out";
      text: string;
      createdAt: number;
    }[] = [];
    for (const m of mine) {
      if (m.from === me.id) {
        result.push({
          id: m.id,
          dir: "out",
          text: "(encrypted)",
          createdAt: m.createdAt,
        });
      } else if (privateJwk) {
        try {
          const text = await decryptWith(privateJwk as Jwk, m.cipherText);
          result.push({ id: m.id, dir: "in", text, createdAt: m.createdAt });
        } catch {
          result.push({
            id: m.id,
            dir: "in",
            text: "[unable to decrypt]",
            createdAt: m.createdAt,
          });
        }
      } else {
        result.push({
          id: m.id,
          dir: "in",
          text: "[locked]",
          createdAt: m.createdAt,
        });
      }
    }
    return result.sort((a, b) => a.createdAt - b.createdAt);
  }

  return { messages, send, threads, listDecrypted };
}
