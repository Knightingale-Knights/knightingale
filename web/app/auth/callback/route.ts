import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { currentUser, homeFor } from "@/lib/auth";
import { ensureApplicant } from "@/lib/onboarding/data";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
    // Came from the join page with an email we don't know yet: start a carer application.
    if (request.nextUrl.searchParams.get("join") === "1" && !(await currentUser())) {
      const { data } = await supabase.auth.getUser();
      if (data.user?.email) await ensureApplicant(data.user.email, data.user.id);
    }
  }
  return NextResponse.redirect(new URL(await homeFor(), request.url));
}
