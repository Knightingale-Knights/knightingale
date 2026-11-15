import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { copied, fromStorage, isBubbleFile, ownsFile } from "@/lib/files";

export const dynamic = "force-dynamic";

// A document Bubble stored: staff see any; carers and applicants only their own.
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("u") ?? "";
  const me = await currentUser();
  if (!me || !isBubbleFile(url)) return new Response("Not found", { status: 404 });
  if (me.role !== "admin" && !(await ownsFile(me.id, url))) return new Response("Not found", { status: 404 });
  const c = await copied(url);
  const res = c ? await fromStorage(c.path) : null;
  if (!res) return NextResponse.redirect(url); // not copied yet: Bubble still has it
  return new Response(res.body, {
    headers: { "Content-Type": c!.mime ?? "application/octet-stream", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
