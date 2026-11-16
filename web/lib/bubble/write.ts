// Writes admin changes back to Bubble through its Data API, so Bubble stays the live system
// until switch-over. On by default when BUBBLE_API_TOKEN is set; BUBBLE_WRITE=off turns it off.
// Field names are Bubble's display names, the same keys the sync reads.
import { sql } from "@/lib/db";

const BASE = (process.env.BUBBLE_API_BASE ?? "https://knightingale.com.au/api/1.1/obj").replace(/\/$/, "");

export const bubbleOn = () => Boolean(process.env.BUBBLE_API_TOKEN) && process.env.BUBBLE_WRITE !== "off";

async function api<T = unknown>(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.BUBBLE_API_TOKEN}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    let why = text.slice(0, 200);
    try { why = JSON.parse(text)?.body?.message ?? why; } catch { /* keep text */ }
    throw new Error(`Bubble ${method} ${path.split("/")[0]} failed (${res.status}): ${why}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

/** Drops undefined keys; keeps null so PATCH can clear a field. */
const clean = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

type ShiftRow = {
  id: string; bubble_id: string | null; date: Date; start_time: number | null; end_time: number | null; hours: number | null;
  rate: number | null; fee: number | null; revenue: number | null; wage: number | null; roles: string[] | null;
  carer_b: string | null; participant_b: string | null; coordinator_b: string | null; location_b: string | null;
  ndis_b: string | null; res_b: string | null; address: { address?: string } | null; notes: string | null; supervisor: string | null;
  accepted: boolean | null; cancelled: boolean | null; attended: boolean | null; invoiced: boolean | null; csv: boolean | null;
  abn: string | null; gst_code: string | null; registration: string | null;
  check_in_time: Date | null; check_out_time: Date | null; attend_start: Date | null; attend_end: Date | null;
};

const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);

function shiftBody(s: ShiftRow, roleLabels: Map<string, string>, creating: boolean) {
  const link = (v: string | null) => (creating ? v ?? undefined : v);
  return clean({
    date: iso(s.date),
    "start time": s.start_time ?? undefined,
    "end time": s.end_time ?? undefined,
    hours: s.hours ?? undefined,
    rate: s.rate ?? undefined,
    fee: s.fee ?? undefined,
    revenue: s.revenue ?? undefined,
    wage: s.wage ?? undefined,
    roles: (s.roles ?? []).map((r) => roleLabels.get(r) ?? r.toUpperCase()),
    carer: link(s.carer_b),
    participant: s.participant_b ?? undefined,
    coordinator: s.coordinator_b ?? undefined,
    location: s.location_b ?? undefined,
    "ndis pricing": s.ndis_b ?? undefined,
    "res pricing ": s.res_b ?? undefined,
    address: s.address?.address ?? undefined,
    notes: creating ? s.notes ?? undefined : s.notes ?? "",
    supervisor: s.supervisor ?? undefined,
    accepted: s.accepted ?? undefined,
    cancelled: Boolean(s.cancelled),
    attended: Boolean(s.attended),
    invoiced: Boolean(s.invoiced),
    csv: s.csv ?? undefined,
    abn: s.abn ?? undefined,
    "gst code": s.gst_code ?? undefined,
    registration: s.registration ?? undefined,
    "attend start": iso(s.attend_start) ?? undefined,
    "attend end": iso(s.attend_end) ?? undefined,
    "check in time": iso(s.check_in_time) ?? undefined,
    "check out time": iso(s.check_out_time) ?? undefined,
  });
}

async function roleLabels() {
  const rows = await sql<{ value: string; display: string }[]>`select value, display from app.option_values where set_key = 'roles'`;
  return new Map(rows.map((r) => [r.value, r.display]));
}

/**
 * Sends each shift's current state to Bubble: creates it there if new, otherwise updates it.
 * A shift new to Bubble takes the id the sync will give it (md5 of the Bubble id), so the two never double up.
 * Returns the shift ids as they are after the push.
 */
export async function mirrorShifts(ids: string[]): Promise<string[]> {
  if (!bubbleOn() || !ids.length) return ids;
  const labels = await roleLabels();
  const rows = await sql<ShiftRow[]>`
    select s.id, s.bubble_id, s.date, s.start_time, s.end_time, s.hours, s.rate, s.fee, s.revenue, s.wage, s.roles,
           c.bubble_id as carer_b, p.bubble_id as participant_b, co.bubble_id as coordinator_b, l.bubble_id as location_b,
           n.bubble_id as ndis_b, r.bubble_id as res_b, s.address, s.notes, s.supervisor,
           s.accepted, s.cancelled, s.attended, s.invoiced, s.csv, s.abn, s.gst_code, s.registration,
           s.check_in_time, s.check_out_time, s.attend_start, s.attend_end
      from app.shifts s
      left join app.users c on c.id = s.carer
      left join app.users p on p.id = s.participant
      left join app.users co on co.id = s.coordinator
      left join app.locations l on l.id = s.location
      left join app.ndis_price_items n on n.id = s.ndis_pricing
      left join app.residential_prices r on r.id = s.res_pricing
     where s.id = any(${ids}::uuid[])`;
  const out = new Map(ids.map((i) => [i, i]));
  for (const s of rows) {
    if (s.bubble_id) {
      await api("PATCH", `shift/${s.bubble_id}`, shiftBody(s, labels, false));
    } else {
      const r = await api<{ id: string }>("POST", "shift", shiftBody(s, labels, true));
      const [row] = await sql<{ id: string }[]>`
        update app.shifts set bubble_id = ${r.id}, id = md5(${r.id})::uuid where id = ${s.id} returning id`;
      out.set(s.id, row.id);
    }
  }
  return ids.map((i) => out.get(i) ?? i);
}

export async function deleteShiftInBubble(bubbleId: string | null) {
  if (!bubbleOn() || !bubbleId) return;
  await api("DELETE", `shift/${bubbleId}`);
}

/** Availability slots changed here since `since` (taken or freed by a roster change). */
export async function mirrorAvailability(since: Date) {
  if (!bubbleOn()) return;
  const rows = await sql<{ bubble_id: string; accepted: string | null; available: boolean | null }[]>`
    select bubble_id, accepted, available from app.availability
     where bubble_id is not null and updated_at >= ${since}`;
  for (const a of rows) await api("PATCH", `availability/${a.bubble_id}`, clean({ accepted: a.accepted ?? undefined, available: a.available ?? undefined }));
}

/** Creates events in Bubble and adds them to the participant's events list, as Bubble's own form does. */
export async function mirrorEvents(ids: string[]): Promise<void> {
  if (!bubbleOn() || !ids.length) return;
  const rows = await sql<{
    id: string; date: Date; time: string | null; details: string | null; address: { address?: string } | null;
    participant_b: string | null; coordinator_b: string | null;
  }[]>`
    select e.id, e.date, e.time, e.details, e.address, p.bubble_id as participant_b, c.bubble_id as coordinator_b
      from app.events e left join app.users p on p.id = e.participant left join app.users c on c.id = e.coordinator
     where e.id = any(${ids}::uuid[]) and e.bubble_id is null
     order by e.date`;
  const added: string[] = [];
  for (const e of rows) {
    const r = await api<{ id: string }>("POST", "event", clean({
      date: iso(e.date), time: e.time ?? undefined, details: e.details ?? undefined,
      address: e.address?.address ?? undefined, participant: e.participant_b ?? undefined, coordinator: e.coordinator_b ?? undefined,
    }));
    // Re-key to the id the sync will use; the participant link points at the old id, so move it too.
    await sql.begin(async (tx) => {
      const links = await tx<{ users_id: string }[]>`delete from app.users_events where events_id = ${e.id} returning users_id`;
      const [row] = await tx<{ id: string }[]>`update app.events set bubble_id = ${r.id}, id = md5(${r.id})::uuid where id = ${e.id} returning id`;
      for (const l of links) await tx`insert into app.users_events (users_id, events_id) values (${l.users_id}, ${row.id}) on conflict do nothing`;
    });
    added.push(r.id);
  }
  const participant = rows[0]?.participant_b;
  if (participant && added.length) {
    const u = await api<{ response?: { events?: string[] } }>("GET", `user/${participant}`);
    const list = [...new Set([...(u.response?.events ?? []), ...added])];
    await api("PATCH", `user/${participant}`, { events: list });
  }
}
