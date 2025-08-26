import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, Input, Select } from "antd";
import { useSession } from "@/store/session";

export default function AuthDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, login } = useSession();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const res = await register(
          username,
          password,
          firstName,
          lastName,
          profileVisibility,
        );
        if (!res.ok) setError(res.error || "Unable to sign up");
        else {
          const ok = await login(username, password);
          if (!ok) setError("Sign in failed");
          else setOpen(false);
        }
      } else {
        const ok = await login(username, password);
        if (!ok) setError("Invalid credentials");
        else setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signup"
              ? "Join the PookieChat community. Username can only contain letters, numbers, dots, and single underscores."
              : "Use your username and password."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm">Username</label>
            <Input
              placeholder="e.g. pookie_123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {mode === "signup" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm">First Name</label>
                  <Input
                    placeholder="First"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm">Last Name</label>
                  <Input
                    placeholder="Last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm">Profile Visibility</label>
                <Select
                  value={profileVisibility}
                  onChange={setProfileVisibility}
                  style={{ width: "100%" }}
                  options={[
                    { value: "public", label: "Public - Anyone can see" },
                    { value: "followers", label: "Followers Only" },
                    { value: "private", label: "Private - Only you" },
                  ]}
                />
              </div>
            </>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="text-sm text-primary"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            >
              {mode === "signup"
                ? "Have an account? Sign in"
                : "New here? Create account"}
            </button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {mode === "signup" ? "Sign up" : "Sign in"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
