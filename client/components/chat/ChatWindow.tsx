import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/store/auth";
import { useChat } from "@/store/chat";

export default function ChatWindow() {
  const { me, users } = useAuth();
  const { threads, listDecrypted, send } = useChat();
  const [peer, setPeer] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<{ id: string; dir: "in" | "out"; text: string; createdAt: number }[]>([]);

  useEffect(() => {
    if (!peer) return;
    let mounted = true;
    listDecrypted(peer, password).then((msgs) => mounted && setItems(msgs));
    const iv = setInterval(() => {
      listDecrypted(peer, password).then((msgs) => mounted && setItems(msgs));
    }, 600);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [peer, password, listDecrypted]);

  const peers = useMemo(() => users.filter((u) => me && u.id !== me.id), [users, me]);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [items]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!peer || !message.trim()) return;
    await send(peer, message.trim());
    setMessage("");
    listDecrypted(peer, password).then(setItems);
  }

  if (!me) return <div className="p-6 text-muted-foreground">Sign in to start chatting.</div>;

  return (
    <div className="grid grid-cols-12 gap-4 h-[540px]">
      <aside className="col-span-4 rounded-xl border bg-card">
        <div className="p-3 border-b">
          <h4 className="font-semibold">People</h4>
        </div>
        <ScrollArea className="h-[480px]">
          <div className="p-2 space-y-1">
            {peers.length === 0 && (
              <p className="text-sm text-muted-foreground p-2">No other users yet. Open a new tab and sign up another user to test real‑time.</p>
            )}
            {peers.map((u) => (
              <button
                key={u.id}
                onClick={() => setPeer(u.id)}
                className={
                  "w-full text-left rounded-lg px-3 py-2 hover:bg-accent " + (peer === u.id ? "bg-accent" : "")
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
          <h4 className="font-semibold flex-1">{peer ? `Chat with @${peer}` : "Select a person"}</h4>
          <Input placeholder="Password to unlock inbox" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="max-w-xs" />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {!peer && <p className="text-sm text-muted-foreground">Choose a recipient from the left to begin.</p>}
            {peer && items.map((m) => (
              <div key={m.id} className={"max-w-[80%] rounded-2xl px-4 py-2 text-sm " + (m.dir === "out" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-foreground") }>
                <p>{m.text}</p>
                <span className="block text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </ScrollArea>
        <form onSubmit={onSend} className="p-3 border-t flex items-center gap-2">
          <Input placeholder="Type a message" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button type="submit" disabled={!peer || !message.trim()}>Send</Button>
        </form>
      </section>
    </div>
  );
}
