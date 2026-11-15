import { sql } from "@/lib/db";
import { sendTemplateEmail } from "@/lib/postmark";

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

/** A one-time sign-in token for this email, creating the sign-in account if it's new. */
async function hashedToken(email: string): Promise<string> {
  let r = await admin("generate_link", { type: "magiclink", email });
  if (!r.ok) {
    await admin("users", { email, email_confirm: true });
    r = await admin("generate_link", { type: "magiclink", email });
  }
  const props = (r.body.properties ?? r.body) as { hashed_token?: string };
  if (!r.ok || !props.hashed_token) throw new Error("Couldn't create a sign-in link. Please try again.");
  return props.hashed_token;
}

/** Emails a sign-in link using the Knightingale Postmark template. */
export async function sendLoginLink(email: string, origin: string, join: boolean) {
  const token = await hashedToken(email);
  const link = `${origin}/auth/confirm?token_hash=${encodeURIComponent(token)}&type=magiclink${join ? "&join=1" : ""}`;
  const [u] = await sql<{ first_name: string | null }[]>`select first_name from app.users where lower(email) = ${email} limit 1`;
  const name = u?.first_name?.trim() || "there";
  await sendTemplateEmail(LOGIN_TEMPLATE, email, {
    action_url: link, login_url: link, link, url: link,
    name, first_name: name, email,
    support_url: "https://knightingale.com.au", company_name: "Knightingale", company_address: "Melbourne, Victoria",
  }, process.env.LOGIN_FROM_EMAIL ?? "Knightingale <care@knightingale.com.au>");
}
