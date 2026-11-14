import { currentUser } from "@/lib/auth";
import { receiptFile } from "@/lib/carer/travel";

export const dynamic = "force-dynamic";

// Shows a receipt to the carer who uploaded it, or to staff.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  const { id } = await params;
  if (!me || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const f = await receiptFile(id, me);
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.bytes), {
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": `inline; filename="${f.file_name.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
