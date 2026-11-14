import { timingSafeEqual } from "node:crypto";

/** True when the request carries "Authorization: Bearer <secret>". */
export function bearerOk(req: Request, secret: string) {
  const m = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "");
  if (!m || !secret) return false;
  const a = Buffer.from(m[1]);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
