import ChatWindow from "@/components/chat/ChatWindow";
import Header from "@/components/app/Header";
import Footer from "@/components/app/Footer";
import AuthDialog from "@/components/auth/AuthDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";

export default function Index() {
  const { me } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_70%_-10%,hsl(var(--primary)/.15),transparent),radial-gradient(60%_80%_at_10%_10%,hsl(var(--accent)/.15),transparent)]" />
          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                  Realtime, end‑to‑end encrypted chat
                </h1>
                <p className="mt-4 text-muted-foreground text-lg">
                  PookieChat combines secure messaging with social vibes—follow
                  like Instagram, friend requests like Facebook, and admin‑level
                  protection when things look suspicious.
                </p>
                <div className="mt-6 flex gap-3">
                  {me ? (
                    <Button asChild size="lg">
                      <a href="/chat">Open chat</a>
                    </Button>
                  ) : (
                    <AuthDialog>
                      <Button size="lg">Create your account</Button>
                    </AuthDialog>
                  )}
                  <a
                    href="#how"
                    className="text-sm font-medium text-primary self-center"
                  >
                    How it works
                  </a>
                </div>
                <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <li className="rounded-lg border p-3 bg-card">
                    Anyone can sign up
                  </li>
                  <li className="rounded-lg border p-3 bg-card">
                    E2EE: database only sees ciphertext
                  </li>
                  <li className="rounded-lg border p-3 bg-card">
                    Django Admin: block suspicious users
                  </li>
                  <li className="rounded-lg border p-3 bg-card">
                    Follow & friend requests ("pookie")
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Live demo</h3>
                  <span className="text-xs text-muted-foreground">
                    Open another tab to test realtime
                  </span>
                </div>
                <ChatWindow />
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="container mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold">Secure by design</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border bg-card p-5">
              <h4 className="font-semibold">Client‑side keys</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Keys are generated in the browser. Private keys are protected
                with your password and never sent to the server.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h4 className="font-semibold">Ciphertext at rest</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Messages are encrypted with recipients’ public keys so the
                database can’t read them.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h4 className="font-semibold">Moderation ready</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Django Admin can block suspicious accounts without accessing
                private content.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
