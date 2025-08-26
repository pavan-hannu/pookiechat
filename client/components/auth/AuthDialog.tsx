import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/store/auth";

export default function AuthDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signup, login } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const res = await signup(username, password);
        if (!res.ok) setError(res.error || "Unable to sign up");
        else setOpen(false);
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
            {mode === "signup"
              ? "Usernames are unique. Your private key is generated locally and protected by your password."
              : "Enter your credentials to unlock your private key and start chatting securely."}
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center justify-between pt-2">
            <button type="button" className="text-sm text-primary" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
              {mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}
            </button>
            <Button type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "signup" ? "Sign up" : "Sign in"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
