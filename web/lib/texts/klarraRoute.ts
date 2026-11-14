import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { bearerOk } from "./auth";
import { linkReply } from "./data";

/** Same requests and replies as CarerTexts, so Klarra only needs its base URL changed at switch-over. */
export function klarraHandler(fixed?: "checkin" | "checkout") {
  return async (req: Request) => {
    if (!bearerOk(req, env.klarraSecret)) return NextResponse.json({ ok: false, message: "Unauthorised" }, { status: 401 });
    try {
      const body = (await req.json().catch(() => ({}))) as { phone?: string; intent?: string };
      const intent = fixed ?? (body.intent === "checkin" || body.intent === "checkout" ? body.intent : "auto");
      const reply = await linkReply(String(body.phone ?? ""), intent);
      return NextResponse.json({ ok: true, ...reply }, { headers: { "Cache-Control": "no-store" } });
    } catch (e) {
      console.error("klarra link failed", e);
      return NextResponse.json({ ok: false, message: "Something went wrong" }, { status: 500 });
    }
  };
}
