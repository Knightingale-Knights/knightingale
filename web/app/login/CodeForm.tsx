import { verifyCode } from "./actions";

/** After the sign-in email is sent: type the code here, so the home screen app signs itself in. */
export function CodeForm({ email, join, error }: { email: string; join?: boolean; error?: string }) {
  const back = join ? "/join" : "/login";
  return (
    <form action={verifyCode} className="stack">
      <p className="note">We emailed a sign-in code to {email}. Type it in below, or tap the link in the email.</p>
      <input type="hidden" name="email" value={email} />
      {join && <input type="hidden" name="join" value="1" />}
      <label>
        Sign-in code
        <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={12} required autoFocus />
      </label>
      <button type="submit">Sign in</button>
      {error && <p className="error">{error}</p>}
      <p className="hint"><a href={back}>Send a new code</a></p>
    </form>
  );
}
