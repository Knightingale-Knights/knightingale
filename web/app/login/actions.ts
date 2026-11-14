"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

async function send(form: FormData, join: boolean) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const back = join ? "/join" : "/login";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect(`${back}?error=${encodeURIComponent("Enter a valid email address.")}`);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback${join ? "?join=1" : ""}`, shouldCreateUser: true },
  });
  if (error) redirect(`${back}?error=${encodeURIComponent(error.message)}`);
  redirect(`${back}?sent=1`);
}

export async function sendMagicLink(form: FormData) {
  await send(form, false);
}

/** The join page: the same sign-in link, but a new email starts a carer application. */
export async function sendJoinLink(form: FormData) {
  await send(form, true);
}
