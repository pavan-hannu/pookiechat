import { Link, useLocation } from "react-router-dom";
import { Button } from "antd";
import { useAuth } from "@/store/auth";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import AuthDialog from "@/components/auth/AuthDialog";

export default function Header() {
  const { me, logout } = useAuth();
  const [theme, setTheme] = useState<string>(() => (
    typeof document === "undefined" ? "light" : (document.documentElement.classList.contains("dark") ? "dark" : "light")
  ));
  const location = useLocation();

  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur border-b bg-background/70">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
          <span className="font-extrabold text-xl tracking-tight">PookieChat</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
          {me ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">@{me.id}</span>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
          ) : (
            <AuthDialog>
              <Button>Sign in</Button>
            </AuthDialog>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link to={to} className={"text-sm font-medium hover:text-primary transition-colors " + (active ? "text-primary" : "text-muted-foreground")}>{children}</Link>
  );
}
