import { sendMagicLink } from "./actions";

export default async function Login({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="login">
      <h1 className="wordmark">knightingale</h1>
      {sp.sent ? (
        <p className="note">Check your email for a sign-in link.</p>
      ) : (
        <form action={sendMagicLink} className="stack">
          <label>
            Work email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <button type="submit">Email me a sign-in link</button>
          {sp.error && <p className="error">{sp.error}</p>}
        </form>
      )}
    </main>
  );
}
