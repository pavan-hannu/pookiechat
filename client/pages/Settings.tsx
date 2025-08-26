import Header from "@/components/app/Header";
import Footer from "@/components/app/Footer";
import { useSession } from "@/store/session";
import { useEffect, useState } from "react";
import { Button, Form, Input, Switch, Upload, message, Select } from "antd";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { me, updateSettings, fetchMe } = useSession();
  const [theme, setTheme] = useState<string>("light");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [profileVisibility, setProfileVisibility] = useState<string>("public");

  useEffect(() => {
    if (me) {
      setTheme(me.settings?.theme || "light");
      setAvatarUrl(me.settings?.avatarUrl || "");
      setFirstName(me.first_name || "");
      setLastName(me.last_name || "");
      setProfileVisibility(me.profile_visibility || "public");
    }
  }, [me]);

  async function onFinish() {
    await updateSettings({ theme });
    message.success("Settings saved");
  }

  async function saveProfile() {
    try {
      await api.post("/profile/", {
        first_name: firstName,
        last_name: lastName,
        profile_visibility: profileVisibility
      });
      await fetchMe();
      message.success("Profile updated");
    } catch {
      message.error("Failed to update profile");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-2xl font-bold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Profile Visibility</label>
                <Select
                  value={profileVisibility}
                  onChange={setProfileVisibility}
                  style={{ width: '100%' }}
                  options={[
                    { value: "public", label: "Public - Anyone can see your profile" },
                    { value: "followers", label: "Followers Only - Only people you follow back" },
                    { value: "private", label: "Private - Only you can see your profile" },
                  ]}
                />
              </div>
              <Button type="primary" onClick={saveProfile}>
                Update Profile
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-2xl font-bold mb-4">App Settings</h2>
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
              Save Settings
            </Button>
          </Form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
