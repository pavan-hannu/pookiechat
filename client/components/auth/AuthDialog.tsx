import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "antd";
import { Input } from "antd";
import { useSession } from "@/store/session";

export default function AuthDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, login } = useSession();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const res = await register(username, password);
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
          <DialogTitle>{mode === "signup" ? "Create your account" : "Welcome back"}</DialogTitle>
          <DialogDescription>
            {mode === "signup" ? "Create a new account on the server." : "Use your username and password."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm">Username</label>
            <Input placeholder="e.g. pookie" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Password</label>
            <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex items-center justify-between pt-2">
            <button type="button" className="text-sm text-primary" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
              {mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}
            </button>
            <Button type="primary" htmlType="submit" loading={loading}>{mode === "signup" ? "Sign up" : "Sign in"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
