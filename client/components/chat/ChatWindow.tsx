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
    return <div className="p-3 text-muted-foreground">Sign in to start chatting.</div>;

  return (
    <div className="row" style={{ height: 540 }}>
      <aside className="col-4">
        <div className="border rounded mb-2 p-2">
          <h5 className="m-0">People</h5>
        </div>
        <List
          bordered
          dataSource={peers}
          locale={{ emptyText: "No conversations yet" }}
          renderItem={(u) => (
            <List.Item onClick={() => setPeer(u)} style={{ cursor: "pointer", background: peer === u ? "#f0f5ff" : undefined }}>
              @{u}
            </List.Item>
          )}
          style={{ height: 480, overflowY: "auto" }}
        />
      </aside>

      <section className="col-8 d-flex flex-column">
        <div className="border rounded p-2 d-flex align-items-center mb-2">
          <h5 className="m-0 flex-grow-1">{peer ? `Chat with @${peer}` : "Select a person"}</h5>
        </div>
        <div className="border rounded p-2 flex-grow-1" style={{ overflowY: "auto" }}>
          {!peer && <p className="text-muted">Choose a recipient to begin.</p>}
          {peer && items.map((m) => (
            <div key={m.id} className={"p-2 mb-2 rounded-3 text-sm " + (m.dir === "out" ? "ms-auto bg-primary text-white" : "bg-light")} style={{ maxWidth: "80%" }}>
              <div>{m.text}</div>
              <small className="opacity-75">{new Date(m.created_at).toLocaleTimeString()}</small>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form onSubmit={onSend} className="d-flex gap-2 mt-2">
          <Input placeholder="Type a message" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button type="primary" htmlType="submit" disabled={!peer || !message.trim()}>Send</Button>
        </form>
      </section>
    </div>
  );
}
