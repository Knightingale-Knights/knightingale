import { redirect } from "next/navigation";
import { currentUser, homePath } from "@/lib/auth";
import { sendJoinLink } from "@/app/login/actions";

export const dynamic = "force-dynamic";

// Carer sign-up starts here: an email sign-in link, then the steps.
export default async function Join({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const me = await currentUser();
  if (me) redirect(homePath(me.role));
  const sp = await searchParams;
  return (
    <main className="login">
      <h1 className="wordmark">knightingale</h1>
      <h2>Join our team of carers</h2>
      {sp.sent ? (
        <p className="note">Check your email for a link to start your application.</p>
      ) : (
        <form action={sendJoinLink} className="stack">
          <p className="hint">It takes about 10 minutes. Have your CPR certificate, NDIS worker screening ID and photo ID ready.</p>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <button type="submit">Start my application</button>
          {sp.error && <p className="error">{sp.error}</p>}
          <p className="hint">Already applied? <a href="/login">Sign in</a></p>
        </form>
      )}
    </main>
  );
}
