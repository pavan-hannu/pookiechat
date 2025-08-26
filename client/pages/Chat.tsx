import Header from "@/components/app/Header";
import Footer from "@/components/app/Footer";
import ChatWindow from "@/components/chat/ChatWindow";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";

export default function ChatPage() {
  const {
    me,
    users,
    requests,
    follow,
    unfollow,
    sendRequest,
    acceptRequest,
    rejectRequest,
  } = useAuth();
  const others = users.filter((u) => (me ? u.id !== me.id : true));
  const myIncoming = requests.filter(
    (r) => me && r.to === me.id && r.status === "pending",
  );
  const myOutgoing = requests.filter(
    (r) => me && r.from === me.id && r.status === "pending",
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="grid lg:grid-cols-3 gap-6">
          <section className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold">People</h3>
            <div className="mt-3 space-y-2">
              {others.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No users yet. Open a new tab and sign up another user.
                </p>
              )}
              {others.map((u) => {
                const following = !!me && me.following.includes(u.id);
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div>
                      <div className="font-medium">@{u.id}</div>
                      <div className="text-xs text-muted-foreground">
                        {u.followers.length} followers • {u.following.length}{" "}
                        following
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {following ? (
                        <Button
                          variant="outline"
                          onClick={() => unfollow(u.id)}
                        >
                          Unfollow
                        </Button>
                      ) : (
                        <Button onClick={() => follow(u.id)}>Follow</Button>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => sendRequest(u.id)}
                      >
                        Add friend
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold">Friend requests</h3>
            <div className="mt-3 space-y-2">
              {myIncoming.length === 0 && myOutgoing.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No friend request activity.
                </p>
              )}
              {myIncoming.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div>
                    <div className="text-sm">
                      @{r.from} wants to be your friend
                    </div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => acceptRequest(r.id)}>Accept</Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectRequest(r.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {myOutgoing.map((r) => (
                <div key={r.id} className="rounded-lg border p-2">
                  <div className="text-sm">Request sent to @{r.to}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-1 rounded-xl border bg-card p-4">
            <h3 className="font-semibold">Start chatting</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Pick a person in the chat window and send a message. Messages sent
              to you require your password to decrypt.
            </p>
          </section>
        </div>

        <div className="mt-6">
          <ChatWindow />
        </div>
      </main>
      <Footer />
    </div>
  );
}
