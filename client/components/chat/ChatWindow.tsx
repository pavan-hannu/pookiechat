import { useEffect, useRef, useState } from "react";
import { Button, Input, List } from "antd";
import { api } from "@/lib/api";

export default function ChatWindow() {
  const [me, setMe] = useState<string | null>(null);
  const [peers, setPeers] = useState<string[]>([]);
  const [peer, setPeer] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<{ id: string; dir: "in" | "out"; text: string; created_at: string }[]>([]);

  useEffect(() => {
    async function who() {
      try {
        const res = await api.get("/me/");
        setMe(res.data.username);
      } catch {}
    }
    who();
  }, []);

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const res = await api.get("/conversations/list/");
        const list: string[] = Array.from(new Set(res.data.flatMap((c: any) => c.peers)));
        if (!stop) setPeers(list);
      } catch {}
    }
    load();
    const iv = setInterval(load, 5000);
    return () => { stop = true; clearInterval(iv); };
  }, []);

  useEffect(() => {
    if (!peer || !me) return;
    let active = true;
    async function ensure() {
      const res = await api.post("/conversations/", { usernames: [me, peer] });
      if (active) setConversationId(res.data.id);
    }
    ensure();
    return () => { active = false };
  }, [peer, me]);

  useEffect(() => {
    if (!conversationId || !me) return;
    let stop = false;
    async function fetchMessages() {
      try {
        const res = await api.get(`/conversations/${conversationId}/messages/`);
        const rows = (res.data as any[]).map((m) => ({ id: m.id, dir: m.sender === me ? "out" : "in", text: m.ciphertext, created_at: m.created_at }));
        if (!stop) setItems(rows);
      } catch {}
    }
    fetchMessages();
    const iv = setInterval(fetchMessages, 5000);
    return () => { stop = true; clearInterval(iv); };
  }, [conversationId, me]);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [items]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!peer || !message.trim() || !conversationId) return;
    await api.post(`/conversations/${conversationId}/messages/post/`, { ciphertext: message.trim() });
    setMessage("");
  }

  if (!me)
    return (
      <div className="p-6 text-muted-foreground">
        Sign in to start chatting.
      </div>
    );

  return (
    <div className="grid grid-cols-12 gap-4 h-[540px]">
      <aside className="col-span-4 rounded-xl border bg-card">
        <div className="p-3 border-b">
          <h4 className="font-semibold">People</h4>
        </div>
        <ScrollArea className="h-[480px]">
          <div className="p-2 space-y-1">
            {peers.length === 0 && (
              <p className="text-sm text-muted-foreground p-2">
                No other users yet. Open a new tab and sign up another user to
                test real‑time.
              </p>
            )}
            {peers.map((u) => (
              <button
                key={u.id}
                onClick={() => setPeer(u.id)}
                className={
                  "w-full text-left rounded-lg px-3 py-2 hover:bg-accent " +
                  (peer === u.id ? "bg-accent" : "")
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">@{u.id}</span>
                  <span className="text-xs text-muted-foreground">public</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <section className="col-span-8 rounded-xl border bg-card flex flex-col">
        <div className="p-3 border-b flex items-center gap-3">
          <h4 className="font-semibold flex-1">
            {peer ? `Chat with @${peer}` : "Select a person"}
          </h4>
          <Input.Password
            placeholder="Password to unlock inbox"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {!peer && (
              <p className="text-sm text-muted-foreground">
                Choose a recipient from the left to begin.
              </p>
            )}
            {peer &&
              items.map((m) => (
                <div
                  key={m.id}
                  className={
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm " +
                    (m.dir === "out"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground")
                  }
                >
                  <p>{m.text}</p>
                  <span className="block text-[10px] opacity-70 mt-1">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            <div ref={endRef} />
          </div>
        </ScrollArea>
        <form
          onSubmit={onSend}
          className="p-3 border-t flex items-center gap-2"
        >
          <Input
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button type="submit" disabled={!peer || !message.trim()}>
            Send
          </Button>
        </form>
      </section>
    </div>
  );
}
