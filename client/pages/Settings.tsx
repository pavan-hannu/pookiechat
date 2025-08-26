import Header from "@/components/app/Header";
import Footer from "@/components/app/Footer";
import { useSession } from "@/store/session";
import { useEffect, useState } from "react";
import { Button, Form, Input, Switch, Upload, message } from "antd";

export default function SettingsPage() {
  const { me, updateSettings, fetchMe } = useSession();
  const [theme, setTheme] = useState<string>("light");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    if (me?.settings) {
      setTheme(me.settings.theme || "light");
      setAvatarUrl(me.settings.avatarUrl || "");
    }
  }, [me]);

  async function onFinish() {
    await updateSettings({ theme });
    message.success("Saved");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-xl mx-auto rounded-xl border bg-card p-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <Form layout="vertical" className="mt-6" onFinish={onFinish}>
            <Form.Item label="Dark mode">
              <Switch
                checked={theme === "dark"}
                onChange={(v) => setTheme(v ? "dark" : "light")}
              />
            </Form.Item>
            <Form.Item label="Avatar (pookie profile)">
              <Upload
                name="file"
                action="/api/accounts/avatar/"
                withCredentials
                showUploadList={false}
                onChange={(info) => {
                  if (info.file.status === "done") {
                    setAvatarUrl(info.file.response.avatarUrl);
                    fetchMe();
                    message.success("Avatar updated");
                  }
                }}
              >
                <Button>Upload</Button>
              </Upload>
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="mt-3 rounded"
                  style={{ height: 64, width: 64, objectFit: "cover" }}
                />
              )}
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
