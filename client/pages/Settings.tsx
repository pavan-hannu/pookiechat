import Header from "@/components/app/Header";
import Footer from "@/components/app/Footer";
import { useAuth } from "@/store/auth";
import { useEffect, useState } from "react";
import { Button, Form, Input, Switch, Upload } from "antd";

export default function SettingsPage() {
  const { me, updateSettings } = useAuth();
  const [theme, setTheme] = useState<string>("light");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    if (me?.settings) {
      setTheme(me.settings.theme || "light");
      setAvatarUrl(me.settings.avatarUrl || "");
    }
  }, [me]);

  function onFinish() {
    updateSettings({ theme, avatarUrl });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-xl mx-auto rounded-xl border bg-card p-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <Form layout="vertical" className="mt-6" onFinish={onFinish}>
            <Form.Item label="Dark mode">
              <Switch checked={theme === "dark"} onChange={(v) => setTheme(v ? "dark" : "light")} />
            </Form.Item>
            <Form.Item label="Avatar URL (pookie profile)">
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://.../avatar.png" />
            </Form.Item>
            <Button type="primary" htmlType="submit">Save</Button>
          </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
