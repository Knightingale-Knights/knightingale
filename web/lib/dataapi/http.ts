import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { ApiError } from "./core";
import { typeFor, type TypeDef } from "./map";

/**
 * Same token check as Bubble: "Authorization: Bearer <token>" or ?api_token=. Tokens come from DATA_API_TOKENS
 * (comma separated); once LAUNCHED=yes, the old Bubble API token also works, so Klarra keeps working unchanged.
 */
export function authorised(req: Request) {
  const tokens = [
    ...(process.env.DATA_API_TOKENS ?? "").split(","),
    ...(process.env.LAUNCHED === "yes" ? [process.env.BUBBLE_API_TOKEN ?? ""] : []),
  ].map((t) => t.trim()).filter(Boolean);
  if (!tokens.length) return false;
  const given = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1] ?? new URL(req.url).searchParams.get("api_token") ?? "";
  const g = Buffer.from(given);
  return tokens.some((t) => { const b = Buffer.from(t); return b.length === g.length && timingSafeEqual(b, g); });
}

export const error = (status: number, code: string, message: string) =>
  NextResponse.json({ statusCode: status, body: { status: code, message } }, { status });

export async function handle(req: Request, typeName: string, work: (t: TypeDef) => Promise<Response>) {
  if (!authorised(req)) return error(401, "UNAUTHORIZED", "Invalid or missing API token");
  const t = typeFor(typeName);
  if (!t) return error(404, "NOT_FOUND", `Type ${typeName} not found`);
  try {
    return await work(t);
  } catch (e) {
    if (e instanceof ApiError) return error(e.status, e.code, e.message);
    console.error("data api", e);
    return error(500, "ERROR", "Something went wrong");
  }
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    return Object.fromEntries((await req.formData()).entries()) as Record<string, unknown>;
  }
  const text = await req.text();
  if (!text.trim()) return {};
  try {
    const j = JSON.parse(text);
    if (j && typeof j === "object" && !Array.isArray(j)) return j;
  } catch {}
  throw new ApiError(400, "INVALID_DATA", "Body must be a JSON object");
}
