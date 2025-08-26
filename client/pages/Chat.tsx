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
  const [results, setResults] = useState<
    { username: string; is_staff: boolean }[]
  >([]);

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
                <Input
                  placeholder="search usernames"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <Button type="primary" onClick={onSearch}>
                  Search
                </Button>
              </div>
              <List
                className="mt-3"
                dataSource={results}
                renderItem={(u) => (
                  <List.Item
                    actions={[
                      <Button key="start" onClick={() => startChat(u.username)}>
                        Start chat
                      </Button>,
                    ]}
                  >
                    @{u.username}
                  </List.Item>
                )}
              />
            </div>
          </div>
        </div>

        <div className="row g-3 mt-4">
          <div className="col-md-6">
            <div className="border rounded p-3">
              <h5>Create a post</h5>
              <PostForm />
            </div>
          </div>
        </div>

        <ChatWindow />
      </main>
      <Footer />
    </div>
  );
}

function PostForm() {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [file, setFile] = useState<File | null>(null);

  async function submit() {
    const fd = new FormData();
    fd.append("text", text);
    fd.append("visibility", visibility);
    if (file) fd.append("image", file);
    await api.post("/posts/create/", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setText("");
    setFile(null);
    message.success("Posted");
  }

  return (
    <div className="d-flex flex-column gap-2">
      <Input.TextArea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share something..."
      />
      <div className="d-flex gap-2 align-items-center">
        <Upload
          beforeUpload={(f) => {
            setFile(f);
            return false;
          }}
          maxCount={1}
          accept="image/*"
        >
          <Button>Attach image</Button>
        </Upload>
        <Select
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: "public", label: "Public" },
            { value: "followers", label: "Followers" },
            { value: "private", label: "Private" },
          ]}
          style={{ width: 160 }}
        />
        <Button type="primary" onClick={submit} disabled={!text && !file}>
          Post
        </Button>
      </div>
    </div>
  );
}
