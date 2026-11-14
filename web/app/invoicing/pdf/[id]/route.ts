import { NextResponse } from "next/server";
import { currentStaff } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentStaff())) return new NextResponse("Sign in first", { status: 401 });
  const { id } = await params;
  const [f] = await sql<{ filename: string; pdf: Buffer }[]>`select filename, pdf from app.invoice_files where invoice_id = ${id}`;
  if (!f) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(f.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${f.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
