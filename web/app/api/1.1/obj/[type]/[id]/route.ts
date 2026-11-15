import { NextResponse } from "next/server";
import { getOne, remove, update } from "@/lib/dataapi/core";
import { body, handle } from "@/lib/dataapi/http";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ type: string; id: string }> };

export async function GET(req: Request, { params }: P) {
  const { type, id } = await params;
  return handle(req, type, async (t) => NextResponse.json({ response: await getOne(t, decodeURIComponent(id)) }));
}

async function change(req: Request, { params }: P) {
  const { type, id } = await params;
  return handle(req, type, async (t) => {
    await update(t, decodeURIComponent(id), await body(req));
    return new Response(null, { status: 204 });
  });
}
export const PATCH = change;
export const PUT = change;

export async function DELETE(req: Request, { params }: P) {
  const { type, id } = await params;
  return handle(req, type, async (t) => {
    await remove(t, decodeURIComponent(id));
    return new Response(null, { status: 204 });
  });
}
