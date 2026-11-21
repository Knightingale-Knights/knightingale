"use server";
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { currentUser, homeFor } from "@/lib/auth";
import { ensureApplicant } from "@/lib/onboarding/data";

/** Checks the one-time token from the sign-in email, signs in, then sends the person to their home page. */
export async function confirmSignIn(form: FormData) {
  const tokenHash = String(form.get("token_hash") ?? "");
  if (!tokenHash) redirect("/login");
  const supabase = await supabaseServer();
  const type = String(form.get("type") || "magiclink") as EmailOtpType;
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) {
    // Tapped twice, or already signed in on this device: carry on.
    if (await currentUser()) redirect(await homeFor());
    const msg = "That sign-in link has expired or a newer one was sent. Use the newest email, or request a new link.";
    redirect(`/login?error=${encodeURIComponent(msg)}`);
  }
  // Came from the join page with an email we don't know yet: start a carer application.
  if (form.get("join") === "1" && !(await currentUser())) {
    const { data } = await supabase.auth.getUser();
    if (data.user?.email) await ensureApplicant(data.user.email, data.user.id);
  }
  redirect(await homeFor());
}
