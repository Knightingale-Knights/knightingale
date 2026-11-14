// Facility bookings. A facility user's facility is the first location in their locations field.
import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import type { AppUser } from "@/lib/auth";
import { addDays, hoursBetween } from "@/lib/roster/rules";
import { fromDay, melbDay } from "@/lib/roster/queries";
import { normalizePhone } from "@/lib/texts/rules";
import { sendSms, type Sender } from "@/lib/texts/sms";
import { BookingError, bookingTexts, validateBooking, type BookingInput } from "./rules";

type Tx = typeof sql;
export type Facility = { id: string; name: string; address: unknown };

/** First location in the user's locations field: Bubble's list order (kept in the synced record), else by name. */
export async function facilityFor(userId: string, tx: Tx = sql): Promise<Facility | null> {
  const [f] = await tx<Facility[]>`
    select l.id, l.name, l.address
      from app.users u
      left join sync.bubble_raw r on r.type = 'user' and r.bubble_id = u.bubble_id
      join app.locations l on l.id = coalesce(
        (select md5(r.data->'locations'->>0)::uuid where exists (select 1 from app.users_locations x where x.users_id = u.id and x.locations_id = md5(r.data->'locations'->>0)::uuid)),
        (select x.locations_id from app.users_locations x join app.locations y on y.id = x.locations_id where x.users_id = u.id order by y.name limit 1))
     where u.id = ${userId}`;
  return f ?? null;
}

export type Booking = {
  id: string; day: string; start_time: number | null; end_time: number | null; roles: string[] | null;
  notes: string | null; cancelled: boolean; carer_first: string | null; booked_by: string | null;
};

/** The facility's shifts from 2 weeks ago to 3 months ahead, soonest first. */
export async function facilityShifts(facility: string, today: string): Promise<Booking[]> {
  return sql<Booking[]>`
    select s.id, ${melbDay("s.date")} as day, s.start_time, s.end_time, s.roles, s.notes,
           coalesce(s.cancelled, false) as cancelled, split_part(c.first_name, ' ', 1) as carer_first, s.booked_by
      from app.shifts s left join app.users c on c.id = s.carer
     where s.location = ${facility} and s.participant is null
       and s.date >= ${fromDay(addDays(today, -14))} and s.date < ${fromDay(addDays(today, 92))}
     order by s.date, s.start_time nulls last`;
}

async function logAndSend(shift: string, kind: "booking_ack" | "booking_alert", user: string | null, rawPhone: string | null, body: string, send: Sender) {
  const phone = normalizePhone(rawPhone);
  const [row] = await sql<{ id: number }[]>`
    insert into app.text_log (shift, kind, carer, phone, body, status)
    values (${shift}, ${kind}, ${user}, ${phone}, ${body}, ${phone ? "claimed" : "no_phone"})
    on conflict (shift, kind) do nothing returning id`;
  if (!row || !phone) return;
  try {
    const r = await send(phone, body);
    await sql`update app.text_log set status = ${r.dryRun ? "dry_run" : "sent"}, twilio_sid = ${r.sid}, sent_at = now() where id = ${row.id}`;
  } catch (e) {
    await sql`update app.text_log set status = 'failed', error = ${String((e as Error).message ?? e)} where id = ${row.id}`;
  }
}

/** Books a shift for the user's facility, then texts the facility and the office (from the Klarra number). */
export async function bookShift(u: Pick<AppUser, "id" | "name" | "phone">, input: BookingInput, today: string, send: Sender = sendSms) {
  const v = validateBooking(input, today);
  const facility = await facilityFor(u.id);
  if (!facility) throw new BookingError("Your account isn't linked to a facility yet. Please call Knightingale.");
  const bookedBy = u.name.trim() || facility.name;
  const id = await sql.begin(async (txx) => {
    const tx = txx as unknown as Tx;
    const [row] = await tx<{ id: string }[]>`
      insert into app.shifts (date, start_time, end_time, hours, roles, location, address, notes, booked_by,
                              accepted, cancelled, attended, invoiced, csv, created_by, abn, gst_code)
      values (${fromDay(input.day)}, ${v.start}, ${v.end}, ${hoursBetween(v.start, v.end)}, ${[v.role]}::text[],
              ${facility.id}, ${facility.address ? sql.json(facility.address as never) : null}, ${v.notes || null}, ${bookedBy},
              false, false, false, false, false, ${u.id}, '50405424095', 'P2')
      returning id`;
    await tx`insert into app.users_shifts_requested (users_id, shifts_id) values (${u.id}, ${row.id})`;
    return row.id;
  });
  const t = bookingTexts({ day: input.day, start: v.start, end: v.end, role: v.role, facility: facility.name, bookedBy });
  await logAndSend(id, "booking_ack", u.id, u.phone, t.ack, send);
  await logAndSend(id, "booking_alert", null, env.bookingAlertTo, t.alert, send);
  return id;
}
