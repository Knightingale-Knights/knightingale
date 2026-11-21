import { redirect } from "next/navigation";
import { currentUser, homePath } from "@/lib/auth";
import { confirmSignIn } from "./actions";

// The link in the sign-in email lands here. Email apps and link scanners open links
// before the person does, which used up the one-time token. Now the token is only
// used when the person taps the button.
export default async function Confirm({ searchParams }: { searchParams: Promise<{ token_hash?: string; type?: string; join?: string }> }) {
  const sp = await searchParams;
  const me = await currentUser();
  if (me) redirect(homePath(me.role));
  if (!sp.token_hash) redirect("/login");
  return (
    <main className="login">
      <h1 className="wordmark">knightingale</h1>
      <form action={confirmSignIn} className="stack">
        <input type="hidden" name="token_hash" value={sp.token_hash} />
        <input type="hidden" name="type" value={sp.type ?? "magiclink"} />
        {sp.join === "1" && <input type="hidden" name="join" value="1" />}
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
