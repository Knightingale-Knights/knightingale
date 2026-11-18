import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { copied, fromStorage, isBubbleFile, ownsFile } from "@/lib/files";
import { PHOTO_MIME, isProfilePhoto, shrinkBubblePhoto } from "@/lib/photo";

export const dynamic = "force-dynamic";

const PHOTO_HEADERS = { "Content-Type": PHOTO_MIME, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" };

// A document Bubble stored: staff see any; carers and applicants only their own.
// Profile photos are shrunk to a small WebP the first time they are shown, replacing the stored original.
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("u") ?? "";
  const me = await currentUser();
  if (!me || !isBubbleFile(url)) return new Response("Not found", { status: 404 });
  if (me.role !== "admin" && !(await ownsFile(me.id, url))) return new Response("Not found", { status: 404 });
  const c = await copied(url);
  if (!c?.path.startsWith("photos/") && (await isProfilePhoto(url))) {
    const small = await shrinkBubblePhoto(url, c);
    if (small) return new Response(new Uint8Array(small), { headers: PHOTO_HEADERS });
  }
  const res = c ? await fromStorage(c.path) : null;
  if (!res) return NextResponse.redirect(url); // not copied yet: Bubble still has it
  return new Response(res.body, {
    headers: c!.path.startsWith("photos/") ? PHOTO_HEADERS : { "Content-Type": c!.mime ?? "application/octet-stream", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
