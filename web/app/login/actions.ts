"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendLoginLink } from "@/lib/magicLink";
import { supabaseServer } from "@/lib/supabase/server";
import { currentUser, homeFor } from "@/lib/auth";
import { ensureApplicant } from "@/lib/onboarding/data";

const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

async function send(form: FormData, join: boolean) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const back = join ? "/join" : "/login";
  if (!validEmail(email)) redirect(`${back}?error=${encodeURIComponent("Enter a valid email address.")}`);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  let error = "";
  try {
    await sendLoginLink(email, origin, join);
  } catch (e) {
    console.error("login link failed", e);
    error = "Couldn't send the sign-in email. Please try again.";
  }
  if (error) redirect(`${back}?error=${encodeURIComponent(error)}`);
  redirect(`${back}?sent=1&email=${encodeURIComponent(email)}`);
}

export async function sendMagicLink(form: FormData) {
  await send(form, false);
}

/** The join page: the same sign-in email, but a new email starts a carer application. */
export async function sendJoinLink(form: FormData) {
  await send(form, true);
}

/** Signs in with the code from the sign-in email, typed into this app (the home screen app included). */
export async function verifyCode(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  const join = form.get("join") === "1";
  const back = join ? "/join" : "/login";
  if (!validEmail(email)) redirect(back);
  const retry = (msg: string) => redirect(`${back}?sent=1&email=${encodeURIComponent(email)}&error=${encodeURIComponent(msg)}`);
  if (code.length < 6) retry("Enter the code from your email.");
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) {
    if (await currentUser()) redirect(await homeFor());
    retry("That code is wrong or has expired. Use the newest email, or send a new code.");
  }
  if (join && !(await currentUser())) {
    const { data } = await supabase.auth.getUser();
    if (data.user?.email) await ensureApplicant(data.user.email, data.user.id);
  }
  redirect(await homeFor());
}
