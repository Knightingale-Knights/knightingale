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
  participant: string; participant_id: string; carer_first: string | null; carer_photo: string | null; carer_phone: string | null;
  note_id: string | null; appt_id: string | null;
};

/** Shifts between two days (inclusive), optionally for one participant. Cancelled shifts are left out. */
export async function coordShifts(coordinator: string, from: string, to: string, participant: string | null): Promise<CoordShift[]> {
  return sql<CoordShift[]>`
    select s.id, ${melbDay("s.date")} as day, s.start_time, s.end_time,
           trim(concat_ws(' ', p.first_name, p.last_name)) as participant, p.id as participant_id,
           split_part(c.first_name, ' ', 1) as carer_first, c.profile_photo as carer_photo, c.phone_number as carer_phone,
           coalesce(
             (select n.id from app.progress_notes n where n.id = s.progress_note and n.participant = s.participant),
             (select n.id from app.progress_notes n where n.shift = s.id order by n.created_at desc limit 1)
           ) as note_id,
           (select e.id from app.events e
             where e.shift = s.id
                or (e.participant = s.participant
                    and (e.date at time zone 'Australia/Melbourne')::date = (s.date at time zone 'Australia/Melbourne')::date)
             order by (e.shift = s.id) desc nulls last, e.date limit 1) as appt_id
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

export type CoordinatorRow = {
  id: string; name: string; photo: string | null; phone: string | null; email: string | null; participants: number;
};

/** Admin list of support coordinators (Bubble profile "resident"), with how many participants each has. */
export async function coordinators(q: string): Promise<CoordinatorRow[]> {
  const like = q ? `%${q.toLowerCase()}%` : null;
  return sql<CoordinatorRow[]>`
    select c.id, trim(concat_ws(' ', c.first_name, c.last_name)) as name, c.profile_photo as photo,
           c.phone_number as phone, c.email,
           (select count(*)::int from app.users p where p.coordinator_2 = c.id) as participants
      from app.users c
     where c.account_type = 'resident' and c.active is not false
       and (${like}::text is null or lower(concat_ws(' ', c.first_name, c.last_name, c.email, c.phone_number)) like ${like})
     order by c.first_name, c.last_name`;
}

export type DocKey = "notes" | "carers" | "intake" | "risk" | "agreement" | "points" | "support" | "medication" | "emergency" | "consent";

/** Which of the participant's documents exist, as Bubble checked the participant's own fields. */
export async function participantDocs(participant: string): Promise<Record<DocKey, boolean>> {
  const [r] = await sql<Record<DocKey, boolean>[]>`
    select exists (select 1 from app.progress_notes n where n.participant = u.id) as notes,
           exists (select 1 from app.users_carers c where c.owner_id = u.id) as carers,
           exists (select 1 from app.intakes x where x.id = u.intake_form) as intake,
           exists (select 1 from app.risk_assessments x where x.id = u.risk_assessment) as risk,
           exists (select 1 from app.service_agreements x where x.id = u.service_agreement) as agreement,
           exists (select 1 from app.users_shift_duties d where d.users_id = u.id) as points,
           exists (select 1 from app.support_plans x where x.id = u.support_plan) as support,
           exists (select 1 from app.medication_charts x where x.id = u.medication_chart) as medication,
           exists (select 1 from app.emergency_plans x where x.id = u.emergency_plan) as emergency,
           exists (select 1 from app.consents x where x.id = u.consent) as consent
      from app.users u where u.id = ${participant}`;
  return r;
}

export type Appointment = { id: string; day: string; time: string | null; participant: string; details: string | null };
export type DayNote = { id: string; day: string; participant_id: string; participant: string; carer: string | null };

/** Appointments (Bubble events) for the coordinator's participants between two days (inclusive). */
export async function coordAppointments(coordinator: string, from: string, to: string, participant: string | null): Promise<Appointment[]> {
  return sql<Appointment[]>`
    select e.id, ${melbDay("e.date")} as day, nullif(e.time, '') as time,
           trim(concat_ws(' ', p.first_name, p.last_name)) as participant, nullif(trim(e.details), '') as details
      from app.events e join app.users p on p.id = e.participant
     where p.coordinator_2 = ${coordinator}
       and e.date >= ${fromDay(from)} and e.date < ${fromDay(addDays(to, 1))}
       and (${participant}::uuid is null or e.participant = ${participant}::uuid)
     order by e.date, e.time nulls last`;
}

/** Progress notes for the coordinator's participants between two days (inclusive), by the day of the note. */
export async function coordNotes(coordinator: string, from: string, to: string, participant: string | null): Promise<DayNote[]> {
  return sql<DayNote[]>`
    select n.id, ${melbDay("coalesce(n.date, n.created_at)")} as day, p.id as participant_id,
           trim(concat_ws(' ', p.first_name, p.last_name)) as participant,
           nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '') as carer
      from app.progress_notes n join app.users p on p.id = n.participant left join app.users c on c.id = n.carer
     where p.coordinator_2 = ${coordinator}
       and coalesce(n.date, n.created_at) >= ${fromDay(from)} and coalesce(n.date, n.created_at) < ${fromDay(addDays(to, 1))}
       and (${participant}::uuid is null or n.participant = ${participant}::uuid)
     order by coalesce(n.date, n.created_at)`;
}

export type AppointmentDetail = Appointment & { notes: string | null; carer: string | null; address: string | null; done: boolean };

/** One appointment, only if it is for one of this coordinator's participants. */
export async function coordAppointment(coordinator: string, id: string): Promise<AppointmentDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [a] = await sql<AppointmentDetail[]>`
    select e.id, ${melbDay("e.date")} as day, nullif(e.time, '') as time,
           trim(concat_ws(' ', p.first_name, p.last_name)) as participant, nullif(trim(e.details), '') as details,
           nullif(trim(e.notes), '') as notes, nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '') as carer,
           e.address->>'address' as address, coalesce(e.done, false) as done
      from app.events e join app.users p on p.id = e.participant left join app.users c on c.id = e.carer
     where e.id = ${id} and p.coordinator_2 = ${coordinator}`;
  return a ?? null;
}
