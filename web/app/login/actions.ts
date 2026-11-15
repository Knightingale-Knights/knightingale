"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendLoginLink } from "@/lib/magicLink";

async function send(form: FormData, join: boolean) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const back = join ? "/join" : "/login";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect(`${back}?error=${encodeURIComponent("Enter a valid email address.")}`);
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
  redirect(`${back}?sent=1`);
}

export async function sendMagicLink(form: FormData) {
  await send(form, false);
}

/** The join page: the same sign-in link, but a new email starts a carer application. */
export async function sendJoinLink(form: FormData) {
  await send(form, true);
}
