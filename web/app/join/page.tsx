import { redirect } from "next/navigation";
import { currentUser, homePath } from "@/lib/auth";
import { sendJoinLink } from "@/app/login/actions";

export const dynamic = "force-dynamic";

const DOCS = [
  "Qualification Certificate",
  "CPR & First Aid Certificate",
  "3 Covid Vaccinations",
  "Current Influenza Immunisation",
  "NDIS Worker Screening Clearance",
  "Valid Police Check",
  "Valid Working With Children Check",
  "2 Photo ID's",
  "A Friendly Profile Pic",
];

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
          <div className="join-intro">
            <p>Thank you for considering us as a potential employer!</p>
            <p>Our number one priority is finding you work, wherever and whenever you choose.</p>
            <p>When you join Knightingale, you&rsquo;re not applying for one job. In fact, we may have multiple jobs to suit you. Determining the best job for you, comes next.</p>
            <p>Before you begin. Here are the documents you&rsquo;ll need on hand. If you have these ready before you start, the sign up process should take less than six minutes.</p>
            <p>Please don&rsquo;t start the application if you don&rsquo;t currently have all the documents at hand.</p>
            <p>We will also ask you to record answers to four questions as part of a preliminary interview. Please reach out to <a href="mailto:care@knightingale.com.au">care@knightingale.com.au</a> if you require any assistance along the way.</p>
          </div>
          <ul className="join-docs">
            {DOCS.map((d) => (
              <li key={d}>
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1">
                  <circle cx="12" cy="12" r="11" />
                  <path d="M7.5 12.3l3 3 6-6.3" />
                </svg>
                {d}
              </li>
            ))}
          </ul>
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
