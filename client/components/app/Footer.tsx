export default function Footer() {
  return (
    <footer className="border-t bg-background/70">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} PookieChat • Secure, end‑to‑end
          encrypted messaging with follow & friend requests
        </p>
      </div>
    </footer>
  );
}
