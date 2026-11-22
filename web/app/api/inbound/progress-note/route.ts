import { NextResponse } from "next/server";
import { handleEmailedNote, htmlToText } from "@/lib/carer/emailedNote";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type PostmarkInbound = {
  From?: string; FromName?: string; FromFull?: { Email?: string; Name?: string };
  Subject?: string; TextBody?: string; HtmlBody?: string; Date?: string;
  Attachments?: { Name?: string; Content?: string; ContentType?: string }[];
};

/** Postmark's inbound webhook: progress notes carers emailed to care@ (forwarded there by a Gmail rule). */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.INBOUND_TOKEN || token !== process.env.INBOUND_TOKEN) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const m = (await req.json().catch(() => null)) as PostmarkInbound | null;
  if (!m) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const text = (m.TextBody ?? "").trim() || htmlToText(m.HtmlBody ?? "");
  try {
    const r = await handleEmailedNote({
      from: m.FromFull?.Email ?? m.From ?? "",
      fromName: m.FromFull?.Name ?? m.FromName ?? "",
      subject: m.Subject ?? "",
      text,
      date: m.Date ?? new Date().toISOString(),
      attachments: (m.Attachments ?? []).map((a) => ({ name: a.Name ?? "", contentType: (a.ContentType ?? "").toLowerCase(), content: a.Content ?? "" })),
    });
    console.log("emailed note", r.status, r.detail);
    return NextResponse.json(r);
  } catch (e) {
    console.error("emailed note failed", e);
    return NextResponse.json({ error: "failed" }, { status: 500 }); // Postmark retries later
  }
}
