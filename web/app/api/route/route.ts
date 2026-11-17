import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { drivingRoute, MapsError } from "@/lib/carer/maps";

export const dynamic = "force-dynamic";

// Driving route preview for the Add trip view. Signed-in carers and staff only.
export async function GET(req: Request) {
  const me = await currentUser();
  if (!me || me.role === "facility") return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const p = new URL(req.url).searchParams;
  const from = (p.get("from") ?? "").trim().slice(0, 300);
  const to = (p.get("to") ?? "").trim().slice(0, 300);
  if (from.length < 3 || to.length < 3) return NextResponse.json({ error: "Enter both addresses." }, { status: 400 });
  try {
    return NextResponse.json(await drivingRoute(from, to), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof MapsError ? e.message : "We couldn't work out the distance." }, { status: 422 });
  }
}
