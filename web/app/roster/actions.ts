"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { copyShift, createShifts, deleteShift, markAttended, setCancelled, updateShift, type ShiftInput } from "@/lib/roster/mutate";
import { weekStart } from "@/lib/roster/rules";
import { sendWeeklyRoster } from "@/lib/roster/weekly";
import { prepareDelete, pushShifts } from "@/lib/klarra/push";
import { createEvents, deleteEvent, updateEvent } from "@/lib/roster/events";
import { deleteShiftInBubble, mirrorAvailability, mirrorEvents, mirrorShifts } from "@/lib/bubble/write";
import { sql } from "@/lib/db";
import { setWeekly } from "@/lib/roster/series";

/** Copies a change to Bubble. The change is already saved here, so a Bubble failure becomes a warning. */
async function toBubble<T>(work: () => Promise<T>, fallback: T): Promise<{ value: T; warn: string[] }> {
  try {
    return { value: await work(), warn: [] };
  } catch (e) {
    console.error("bubble write failed", e);
    return { value: fallback, warn: [`Saved here, but Bubble was not updated: ${(e as Error).message}`] };
  }
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Keeps the calendar view and filter the person was looking at. */
function back(f: FormData, extra: Record<string, string>) {
  const p = new URLSearchParams();
  for (const k of ["mode", "date", "view", "who"]) if (str(f, k)) p.set(k, str(f, k));
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
  return `/roster?${p}`;
}

function input(f: FormData): ShiftInput {
  return {
    kind: str(f, "kind") === "residential" ? "residential" : "ndis",
    day: str(f, "day"),
    start: str(f, "start"),
    end: str(f, "end"),
    hours: str(f, "hours"),
    carer: str(f, "carer") || null,
    participant: str(f, "participant") || null,
    location: str(f, "location") || null,
    priceItem: str(f, "price_item"),
    role: str(f, "role"),
    notes: str(f, "notes"),
    supervisor: str(f, "supervisor"),
    repeatUntil: str(f, "repeat_until") || null,
  };
}

async function run(f: FormData, work: () => Promise<{ msg: string; warnings?: string[]; date?: string }>, onError: Record<string, string>) {
  await requireStaff();
  let dest: string;
  try {
    const r = await work();
    dest = back(f, { msg: r.msg, warn: (r.warnings ?? []).join(" "), ...(r.date ? { date: r.date } : {}) });
  } catch (e) {
    dest = back(f, { ...onError, error: String((e as Error).message ?? e) });
  }
  revalidatePath("/roster");
  redirect(dest);
}

export async function saveShiftAction(f: FormData) {
  const id = str(f, "id");
  const i = input(f);
  const staff = await requireStaff();
  await run(f, async () => {
    const since = new Date();
    const r = id ? await updateShift(id, i) : await createShifts(i, staff.id);
    const weekly = id && f.has("weekly_shown") ? f.get("weekly") === "on" : null;
    if (id && weekly !== null) await setWeekly(id, weekly);
    const b = await toBubble(async () => {
      const ids = await mirrorShifts(id ? [id] : r.ids);
      await mirrorAvailability(since);
      return ids;
    }, id ? [id] : r.ids);
    await pushShifts(b.value);
    return {
      msg: id ? (weekly === null ? "Shift saved." : weekly ? "Shift saved. It repeats weekly." : "Shift saved. It no longer repeats.") : r.ids.length > 1 ? `${r.ids.length} shifts created.` : "Shift created.",
      warnings: [...r.warnings, ...b.warn],
      date: i.day,
    };
  }, id ? { edit: id } : { new: i.kind, day: i.day });
}

export async function saveEventAction(f: FormData) {
  const staff = await requireStaff();
  const day = str(f, "day");
  const id = str(f, "id");
  await run(f, async () => {
    const i = {
      participant: str(f, "participant"), details: str(f, "details"), day,
      time: str(f, "time"), where: str(f, "where"), repeatUntil: str(f, "repeat_until") || null,
    };
    if (id) {
      await updateEvent(id, i);
      const b = await toBubble(() => mirrorEvents([id]), undefined);
      return { msg: "Event saved.", warnings: b.warn, date: day };
    }
    const ids = await createEvents(i, staff.id);
    const b = await toBubble(() => mirrorEvents(ids), undefined);
    return { msg: ids.length > 1 ? `${ids.length} events created.` : "Event created.", warnings: b.warn, date: day };
  }, { event: id || "new" });
}

export async function deleteEventAction(f: FormData) {
  const id = str(f, "id");
  await run(f, async () => {
    await deleteEvent(id);
    return { msg: "Event deleted." };
  }, { event: id });
}

export async function cancelShiftAction(f: FormData) {
  const id = str(f, "id");
  const cancel = str(f, "cancel") === "1";
  await run(f, async () => {
    const since = new Date();
    await setCancelled(id, cancel);
    const b = await toBubble(async () => { await mirrorShifts([id]); await mirrorAvailability(since); }, undefined);
    await pushShifts([id]);
    return { msg: cancel ? "Shift cancelled." : "Shift restored.", warnings: b.warn };
  }, { edit: id });
}

export async function deleteShiftAction(f: FormData) {
  const id = str(f, "id");
  await run(f, async () => {
    const since = new Date();
    const [row] = await sql<{ bubble_id: string | null }[]>`select bubble_id from app.shifts where id = ${id}`;
    const told = await prepareDelete(id);
    await deleteShift(id);
    await told();
    const b = await toBubble(async () => { await deleteShiftInBubble(row?.bubble_id ?? null); await mirrorAvailability(since); }, undefined);
    return { msg: "Shift deleted.", warnings: b.warn };
  }, { edit: id });
}

export async function copyShiftAction(f: FormData) {
  const id = str(f, "id");
  const days = f.getAll("copy_day").map(String).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  const staff = await requireStaff();
  await run(f, async () => {
    const since = new Date();
    const r = await copyShift(id, days, staff.id);
    const b = await toBubble(async () => { const ids = await mirrorShifts(r.ids); await mirrorAvailability(since); return ids; }, r.ids);
    await pushShifts(b.value);
    return { msg: `Copied to ${r.ids.length} day${r.ids.length > 1 ? "s" : ""}.`, warnings: [...r.warnings, ...b.warn] };
  }, { edit: id });
}

export async function attendedAction(f: FormData) {
  const id = str(f, "id");
  await run(f, async () => {
    await markAttended(id, str(f, "attend_start"), str(f, "attend_end"));
    const b = await toBubble(() => mirrorShifts([id]), [id]);
    return { msg: "Attendance recorded.", warnings: b.warn };
  }, { edit: id });
}

/** Emails the shown week's roster to the participant's coordinator. */
export async function sendRosterAction(f: FormData) {
  await run(f, async () => {
    const r = await sendWeeklyRoster(str(f, "who"), weekStart(str(f, "week")));
    return { msg: `Roster emailed to ${r.to} (${r.shifts} shift${r.shifts === 1 ? "" : "s"}).` };
  }, {});
}
