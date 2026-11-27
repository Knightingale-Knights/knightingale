import { sql } from "@/lib/db";
import { sendPlainEmail, sendTemplateEmail, templateVariables } from "@/lib/postmark";

/** The Postmark template for the sign-in email. */
export const LOGIN_TEMPLATE = 48693442;

const base = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = () => {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return k;
};

async function admin(path: string, body: unknown) {
  const res = await fetch(`${base()}/auth/v1/admin/${path}`, {
    method: "POST",
    headers: { apikey: key(), Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return { ok: res.ok, status: res.status, body: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

/**
 * A one-time sign-in token for this email, as a link token and as a short code. The sign-in account
 * is created already confirmed first: for a new or unconfirmed account, generate_link hands back a
 * sign-up token that the magic-link check rejects as expired.
 */
async function signInToken(email: string): Promise<{ hash: string; code: string }> {
  await admin("users", { email, email_confirm: true }); // fails harmlessly when the account exists
  const r = await admin("generate_link", { type: "magiclink", email });
  const props = (r.body.properties ?? r.body) as { hashed_token?: string; email_otp?: string };
  if (!r.ok || !props.hashed_token) throw new Error("Couldn't create a sign-in link. Please try again.");
  return { hash: props.hashed_token, code: props.email_otp ?? "" };
}

/** Whether the Postmark sign-in template prints the code yet ({{code}}). Checked once per server. */
let templateHasCode: Promise<boolean> | null = null;
const hasCode = () =>
  (templateHasCode ??= templateVariables(LOGIN_TEMPLATE).then((v) => v.includes("code")).catch(() => false));

/**
 * Emails a sign-in code and link. The code is for the home screen app: on an iPhone a link opens in
 * Safari, which signs in Safari and not the app. Uses the Knightingale Postmark template once it
 * shows {{code}}, otherwise a plain email so the code always arrives.
 */
export async function sendLoginLink(email: string, origin: string, join: boolean) {
  const { hash, code } = await signInToken(email);
  const link = `${origin}/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=magiclink${join ? "&join=1" : ""}`;
  const [u] = await sql<{ first_name: string | null }[]>`select first_name from app.users where lower(email) = ${email} limit 1`;
  const name = u?.first_name?.trim() || "there";
  const from = process.env.LOGIN_FROM_EMAIL ?? "Knightingale <care@knightingale.com.au>";
  if (!code || (await hasCode())) {
    await sendTemplateEmail(LOGIN_TEMPLATE, email, {
      action_url: link, login_url: link, link, url: link, code,
      name, first_name: name, email,
      support_url: "https://knightingale.com.au", company_name: "Knightingale", company_address: "Melbourne, Victoria",
    }, from);
    return;
  }
  await sendPlainEmail({
    to: email,
    from,
    subject: `Your Knightingale sign-in code is ${code}`,
    text: `Hi ${name},\n\nYour Knightingale sign-in code is:\n\n${code}\n\nType this code into the Knightingale app.\n\nOr tap this link to sign in on this device:\n${link}\n\nIf you didn't ask to sign in, you can ignore this email.\n\nKnightingale`,
    attachments: [],
  });
}
