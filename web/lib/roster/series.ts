// Weekly series: Klarra's recurring shift generator (Railway, Saturdays) creates next week's shift for every active
// series (public.recurring_shift_templates). A shift joins a series when it is sent to Klarra marked recurring;
// unticking "Repeats weekly" stops the series, and shifts already created stay.
import { sql } from "@/lib/db";

type Link = { template: number | null; active: boolean | null };

async function linkOf(shiftId: string): Promise<Link> {
  const [r] = await sql<Link[]>`
    select ps.recurring_template_id as template, t.active
      from app.shifts s
      left join public.shifts ps on ps.bubble_shift_id = coalesce(s.bubble_id, s.id::text)
      left join public.recurring_shift_templates t on t.id = ps.recurring_template_id
     where s.id = ${shiftId}
     order by ps.recurring_template_id nulls last limit 1`;
  return r ?? { template: null, active: null };
}

/** Starts or stops the weekly series for this shift. Call before telling Klarra about the shift. */
export async function setWeekly(shiftId: string, on: boolean) {
  const link = await linkOf(shiftId);
  if (on) {
    await sql`update app.shifts set recurring = coalesce(recurring, 'yes') where id = ${shiftId}`;
    // Restarting a series that was stopped; a shift with no series gets one when Klarra hears it's recurring.
    if (link.template && !link.active) await sql`update public.recurring_shift_templates set active = true where id = ${link.template}`;
  } else {
    if (link.template && link.active) await sql`update public.recurring_shift_templates set active = false where id = ${link.template}`;
    await sql`update app.shifts set recurring = null where id = ${shiftId}`;
  }
}
