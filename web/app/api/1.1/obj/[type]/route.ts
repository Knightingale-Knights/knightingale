import { NextResponse } from "next/server";
import { ApiError, create, list, type Constraint } from "@/lib/dataapi/core";
import { body, handle } from "@/lib/dataapi/http";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ type: string }> };

// GET /api/1.1/obj/<type>?constraints=[...]&sort_field=&descending=&cursor=&limit=  (Bubble Data API search)
export async function GET(req: Request, { params }: P) {
  const { type } = await params;
  return handle(req, type, async (t) => {
    const q = new URL(req.url).searchParams;
    let constraints: Constraint[] = [];
    if (q.get("constraints")) {
      try { constraints = JSON.parse(q.get("constraints")!); } catch { throw new ApiError(400, "INVALID_DATA", "constraints must be JSON"); }
      if (!Array.isArray(constraints)) throw new ApiError(400, "INVALID_DATA", "constraints must be a list");
    }
    const response = await list(t, {
      constraints,
      sort_field: q.get("sort_field") ?? undefined,
      descending: q.get("descending") === "true",
      cursor: Number(q.get("cursor") ?? 0) || 0,
      limit: Number(q.get("limit") ?? 100) || 100,
    });
    return NextResponse.json({ response });
  });
}

// POST /api/1.1/obj/<type>  (create)
export async function POST(req: Request, { params }: P) {
  const { type } = await params;
  return handle(req, type, async (t) => {
    const id = await create(t, await body(req));
    return NextResponse.json({ status: "success", id }, { status: 201 });
  });
}
