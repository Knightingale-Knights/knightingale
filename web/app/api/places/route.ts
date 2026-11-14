import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { addressSuggestions } from "@/lib/carer/maps";

export const dynamic = "force-dynamic";

// Address suggestions for the travel From and To boxes. Signed-in carers and staff only.
export async function GET(req: Request) {
  const me = await currentUser();
  if (!me || me.role === "facility") return NextResponse.json({ suggestions: [] }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return NextResponse.json({ suggestions: await addressSuggestions(q) }, { headers: { "Cache-Control": "no-store" } });
}
