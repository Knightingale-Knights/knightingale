// Tells Klarra about NDIS shifts, as Bubble's "Shift Sync" calls did (Push Shift on create, Delete Shift on delete).
// Off until KLARRA_SYNC_URL is set (switch-over day), so Klarra keeps hearing only from Bubble before then.
import { sql } from "@/lib/db";
import { melbDay } from "@/lib/roster/queries";

const base = () => (process.env.KLARRA_SYNC_URL ?? "").replace(/\/$/, "");

/** The id Klarra knows a record by: its Bubble id if it came from Bubble, otherwise the app id (as the Data API returns it). */
const ext = (bubbleId: string | null, id: string | null) => bubbleId ?? id ?? "";

async function post(path: string, fields: Record<string, string>) {
  try {
    const res = await fetch(`${base()}${path}`, { method: "POST", body: new URLSearchParams(fields), cache: "no-store" });
    if (!res.ok) console.error("klarra push", path, res.status);
  } catch (e) {
    console.error("klarra push failed", path, e);
  }
}

/** Sends each NDIS shift (new, edited, copied or cancelled). Never throws: the roster change has already been saved. */
export async function pushShifts(ids: string[]) {
  if (!base() || !ids.length) return;
  const rows = await sql<{
    id: string; bubble_id: string | null; day: string; start_time: number | null; end_time: number | null; cancelled: boolean; attended: boolean;
    recurring: string | null; carer: string | null; carer_b: string | null; participant: string | null; participant_b: string | null;
    coordinator: string | null; coordinator_b: string | null; address: string | null; item: string | null; item_b: string | null; item_name: string | null;
    hours: number | null; rate: number | null; wage: number | null; revenue: number | null;
  }[]>`
    select s.id, s.bubble_id, ${melbDay("s.date")} as day, s.start_time, s.end_time, coalesce(s.cancelled, false) as cancelled,
           coalesce(s.attended, false) as attended, s.recurring,
           s.carer, c.bubble_id as carer_b, s.participant, p.bubble_id as participant_b, s.coordinator, co.bubble_id as coordinator_b,
           s.address->>'address' as address, s.ndis_pricing as item, n.bubble_id as item_b, n.item_name,
           s.hours, s.rate, s.wage, s.revenue
      from app.shifts s
      left join app.users c on c.id = s.carer
      left join app.users p on p.id = s.participant
      left join app.users co on co.id = s.coordinator
      left join app.ndis_price_items n on n.id = s.ndis_pricing
     where s.id = any(${ids}::uuid[]) and s.participant is not null`;
  for (const s of rows) {
    await post("/shift-sync", {
      shift_bubble_id: ext(s.bubble_id, s.id),
      nurse_bubble_id: s.carer ? ext(s.carer_b, s.carer) : "",
      date: s.day,
      start_time: String(s.start_time ?? ""),
      end_time: String(s.end_time ?? ""),
      status: s.cancelled ? "cancelled" : s.attended ? "completed" : "confirmed",
      recurring: s.recurring ? "yes" : "no",
      participant_bubble_id: ext(s.participant_b, s.participant),
      coordinator_bubble_id: s.coordinator ? ext(s.coordinator_b, s.coordinator) : "",
      participant_address: s.address ?? "",
      ndis_code_bubble_id: s.item ? ext(s.item_b, s.item) : "",
      ndis_code_text: s.item_name ?? "",
      hours: s.hours == null ? "" : String(s.hours),
      rate: s.rate == null ? "" : String(s.rate),
      wage: s.wage == null ? "" : String(s.wage),
      revenue: s.revenue == null ? "" : String(s.revenue),
    });
  }
}

/** Call before deleting: returns a function that tells Klarra once the delete has happened. */
export async function prepareDelete(id: string) {
  if (!base()) return async () => {};
  const [s] = await sql<{ bubble_id: string | null; ndis: boolean }[]>`select bubble_id, participant is not null as ndis from app.shifts where id = ${id}`;
  if (!s?.ndis) return async () => {};
  return () => post("/shift-delete", { shift_bubble_id: ext(s.bubble_id, id) });
}

/** Upcoming NDIS shifts Klarra hasn't heard about (e.g. a push that failed). Sent again by the hourly catch-up. */
export async function unsentShifts(limit = 50) {
  const rows = await sql<{ id: string }[]>`
    select s.id from app.shifts s
     where s.participant is not null and s.carer is not null and not coalesce(s.cancelled, false)
       and s.date >= now() - interval '1 day'
       and not exists (select 1 from public.shifts ps where ps.bubble_shift_id = coalesce(s.bubble_id, s.id::text))
     order by s.date limit ${limit}`;
  return rows.map((r) => r.id);
}
