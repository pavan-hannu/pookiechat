import Header from "@/components/app/Header";
import Footer from "@/components/app/Footer";
import ChatWindow from "@/components/chat/ChatWindow";
import { useSession } from "@/store/session";
import { useState } from "react";
import { Button, Input, List, message, Upload, Select } from "antd";
import { api } from "@/lib/api";

export default function ChatPage() {
  const { me } = useSession();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ username: string; is_staff: boolean }[]>([]);

  async function onSearch() {
    try {
      const res = await api.get(`/users/search/`, { params: { q } });
      setResults(res.data);
    } catch {
      message.error("Search failed");
    }
  }

  async function startChat(username: string) {
    if (!me) return;
    await api.post("/conversations/", { usernames: [me.username, username] });
    message.success(`Conversation started with @${username}`);
  }

  return (
    <div className="min-h-screen d-flex flex-column">
      <Header />
      <main className="container py-4 flex-1">
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div className="border rounded p-3">
              <h5>Find new pookies</h5>
              <div className="d-flex gap-2 mt-2">
                <Input placeholder="search usernames" value={q} onChange={(e) => setQ(e.target.value)} />
                <Button type="primary" onClick={onSearch}>Search</Button>
              </div>
              <List className="mt-3" dataSource={results} renderItem={(u) => (
                <List.Item actions={[<Button key="start" onClick={() => startChat(u.username)}>Start chat</Button>]}>
                  @{u.username}
                </List.Item>
              )} />
            </div>
          </div>
        </div>

        <ChatWindow />
      </main>
      <Footer />
    </div>
  );
}
