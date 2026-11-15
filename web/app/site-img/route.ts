import { NextResponse } from "next/server";
import { copied, fromStorage, isBubbleFile } from "@/lib/files";

// Public website images (only those marked as website images in app.file_copies).
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("u") ?? "";
  if (!isBubbleFile(url)) return new Response("Not found", { status: 404 });
  const c = await copied(url);
  const res = c?.site ? await fromStorage(c.path) : null;
  if (!res) return NextResponse.redirect(url);
  return new Response(res.body, {
    headers: { "Content-Type": c!.mime ?? "image/png", "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" },
  });
}
