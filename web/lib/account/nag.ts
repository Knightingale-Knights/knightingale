// Account reminders. Anything missing or expired gets two weeks' grace from when the carer first sees it;
// a document about to expire is flagged two weeks ahead and is due on its expiry date.
// After the due date the carer can only use their Account (and Availability) until it's sorted.
import { sql } from "@/lib/db";
import { addDays } from "@/lib/roster/rules";
import { accountOverview } from "./data";

export const GRACE_DAYS = 14;
const SKIP = new Set(["contract", "handbook"]); // the contract has its own gate; the handbook has nothing to complete

export type NagItem = { key: string; label: string; href: string; why: "missing" | "expired" | "expiring"; expiry: string | null; due: string; overdue: boolean };
export type Nag = { items: NagItem[]; blocked: boolean; firstName: string };

/** `record`: note today as the first time the carer saw new items (only when the carer themselves is looking). */
export async function accountNag(carer: string, today: string, record: boolean): Promise<Nag> {
  const a = await accountOverview(carer, today);
  const byKey = new Map(a.docs.map((d) => [d.def.key as string, d]));
  const found: Omit<NagItem, "due" | "overdue">[] = [];
  for (const s of a.sections) {
    if (SKIP.has(s.key) || a.done[s.key] === null) continue;
    const href = s.kind === "link" ? s.href : `/carer/account/${s.key}`;
    const docs = s.kind === "docs" ? (s.tick ?? s.docs).map((k) => byKey.get(k)).filter(Boolean) : [];
    if (s.key === "insurance" && a.noInsurance) continue;
    if (a.done[s.key] === false) {
      const exp = docs.find((d) => d!.status === "expired");
      found.push({ key: s.key, label: s.label, href, why: exp ? "expired" : "missing", expiry: exp?.expiry ?? null });
      continue;
    }
    const soon = docs.find((d) => d!.expiry && d!.expiry >= today && d!.expiry <= addDays(today, GRACE_DAYS));
    if (soon) found.push({ key: s.key, label: s.label, href, why: "expiring", expiry: soon.expiry });
  }

  const seen = new Map((await sql<{ item: string; first_seen: string }[]>`
    select item, to_char(first_seen, 'YYYY-MM-DD') as first_seen from app.account_nags where carer = ${carer}`).map((r) => [r.item, r.first_seen]));
  if (record) {
    const keys = found.map((f) => f.key);
    await sql`delete from app.account_nags where carer = ${carer} and not (item = any(${keys}))`;
    const fresh = keys.filter((k) => !seen.has(k));
    if (fresh.length) {
      await sql`insert into app.account_nags (carer, item, first_seen) select ${carer}, unnest(${fresh}::text[]), ${today}::date on conflict do nothing`;
      fresh.forEach((k) => seen.set(k, today));
    }
  }
  const items = found.map((f) => {
    const due = f.why === "expiring" ? f.expiry! : addDays(seen.get(f.key) ?? today, GRACE_DAYS);
    return { ...f, due, overdue: today > due };
  });
  return { items, blocked: items.some((i) => i.overdue), firstName: a.name.split(" ")[0] || "there" };
}
