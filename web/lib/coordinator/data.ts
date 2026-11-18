// NDIS support coordinators (Bubble profile "resident"): view-only access to their own participants.
// As in Bubble: participants are the users whose Coordinator field is them (users.coordinator_2),
// and the calendar shows shifts whose Coordinator is them (shifts.coordinator).
import { sql } from "@/lib/db";
import { fromDay, melbDay } from "@/lib/roster/queries";
import { addDays } from "@/lib/roster/rules";
import { NOTE_FIELDS } from "@/lib/carer/rules";

// Bubble's placeholder "no carer yet" user: its shifts are left off the calendar, as in Bubble.
const PLACEHOLDER_CARER = "1714187809198x208818558676652900";

export type MyParticipant = { id: string; name: string };

export async function myParticipants(coordinator: string): Promise<MyParticipant[]> {
  return sql<MyParticipant[]>`
    select id, trim(concat_ws(' ', first_name, last_name)) as name
      from app.users where coordinator_2 = ${coordinator}
     order by first_name, last_name`;
}

/** The participant, only if this coordinator is theirs. */
export async function myParticipant(coordinator: string, id: string): Promise<MyParticipant | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [p] = await sql<MyParticipant[]>`
    select id, trim(concat_ws(' ', first_name, last_name)) as name
      from app.users where id = ${id} and coordinator_2 = ${coordinator}`;
  return p ?? null;
}

export type CoordShift = {
  id: string; day: string; start_time: number | null; end_time: number | null;
  participant: string; carer_first: string | null; carer_photo: string | null; carer_phone: string | null;
};

/** Shifts between two days (inclusive), optionally for one participant. Cancelled shifts are left out. */
export async function coordShifts(coordinator: string, from: string, to: string, participant: string | null): Promise<CoordShift[]> {
  return sql<CoordShift[]>`
    select s.id, ${melbDay("s.date")} as day, s.start_time, s.end_time,
           trim(concat_ws(' ', p.first_name, p.last_name)) as participant,
           split_part(c.first_name, ' ', 1) as carer_first, c.profile_photo as carer_photo, c.phone_number as carer_phone
      from app.shifts s
      join app.users p on p.id = s.participant
      left join app.users c on c.id = s.carer
     where s.coordinator = ${coordinator}
       and s.date >= ${fromDay(from)} and s.date < ${fromDay(addDays(to, 1))}
       and coalesce(s.cancelled, false) = false
       and (c.bubble_id is distinct from ${PLACEHOLDER_CARER})
       and (${participant}::uuid is null or s.participant = ${participant}::uuid)
     order by s.date, s.start_time nulls last`;
}

export type NoteRow = { id: string; day: string | null; carer: string | null; summary: string | null };

/** A participant's progress notes, newest first (Bubble sorted by created date). */
export async function participantNotes(participant: string): Promise<NoteRow[]> {
  return sql<NoteRow[]>`
    select n.id, ${melbDay("coalesce(n.date, n.created_at)")} as day,
           trim(concat_ws(' ', c.first_name, c.last_name)) as carer, coalesce(nullif(n.summary, ''), n.progress_note) as summary
      from app.progress_notes n left join app.users c on c.id = n.carer
     where n.participant = ${participant}
     order by n.created_at desc`;
}

export type NoteDetail = NoteRow & Record<(typeof NOTE_FIELDS)[number], string | null>;

export async function participantNote(participant: string, id: string): Promise<NoteDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [n] = await sql<NoteDetail[]>`
    select n.id, ${melbDay("coalesce(n.date, n.created_at)")} as day,
           trim(concat_ws(' ', c.first_name, c.last_name)) as carer, coalesce(nullif(n.summary, ''), n.progress_note) as summary,
           ${sql.unsafe(NOTE_FIELDS.map((f) => `n.${f}`).join(", "))}
      from app.progress_notes n left join app.users c on c.id = n.carer
     where n.participant = ${participant} and n.id = ${id}`;
  return n ?? null;
}

/** Whether the coordinator gets progress notes emailed (Bubble's "progress note" switch on the user). */
export async function noteEmailsOn(coordinator: string) {
  const [u] = await sql<{ on: boolean }[]>`select coalesce(progress_note, false) as on from app.users where id = ${coordinator}`;
  return Boolean(u?.on);
}

export async function setNoteEmails(coordinator: string, on: boolean) {
  await sql`update app.users set progress_note = ${on}, updated_at = now() where id = ${coordinator}`;
}
