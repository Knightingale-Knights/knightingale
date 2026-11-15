import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { currentUser, homeFor } from "@/lib/auth";
import { ensureApplicant } from "@/lib/onboarding/data";

/** The link in the sign-in email: checks the one-time token, signs in, then sends the person to their home page. */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  if (!tokenHash) return NextResponse.redirect(new URL("/login", request.url));
  const supabase = await supabaseServer();
  const type = (request.nextUrl.searchParams.get("type") ?? "magiclink") as EmailOtpType;
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error) {
    const msg = "That sign-in link has expired or was already used. Please request a new one.";
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, request.url));
  }
  // Came from the join page with an email we don't know yet: start a carer application.
  if (request.nextUrl.searchParams.get("join") === "1" && !(await currentUser())) {
    const { data } = await supabase.auth.getUser();
    if (data.user?.email) await ensureApplicant(data.user.email, data.user.id);
  }
  return NextResponse.redirect(new URL(await homeFor(), request.url));
}
