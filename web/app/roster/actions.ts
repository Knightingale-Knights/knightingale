"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { copyShift, createShifts, deleteShift, markAttended, setCancelled, updateShift, type ShiftInput } from "@/lib/roster/mutate";
import { weekStart } from "@/lib/roster/rules";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

/** Keeps the week and filter the person was looking at. */
function back(f: FormData, extra: Record<string, string>) {
  const p = new URLSearchParams();
  for (const k of ["week", "view", "who"]) if (str(f, k)) p.set(k, str(f, k));
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

async function run(f: FormData, work: () => Promise<{ msg: string; warnings?: string[]; week?: string }>, onError: Record<string, string>) {
  await requireStaff();
  let dest: string;
  try {
    const r = await work();
    dest = back(f, { msg: r.msg, warn: (r.warnings ?? []).join(" "), ...(r.week ? { week: r.week } : {}) });
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
    const r = id ? await updateShift(id, i) : await createShifts(i, staff.id);
    return {
      msg: id ? "Shift saved." : r.ids.length > 1 ? `${r.ids.length} shifts created.` : "Shift created.",
      warnings: r.warnings,
      week: weekStart(i.day),
    };
  }, id ? { edit: id } : { new: i.kind, day: i.day });
}

export async function cancelShiftAction(f: FormData) {
  const id = str(f, "id");
  const cancel = str(f, "cancel") === "1";
  await run(f, async () => {
    await setCancelled(id, cancel);
    return { msg: cancel ? "Shift cancelled." : "Shift restored." };
  }, { edit: id });
}

export async function deleteShiftAction(f: FormData) {
  const id = str(f, "id");
  await run(f, async () => {
    await deleteShift(id);
    return { msg: "Shift deleted." };
  }, { edit: id });
}

export async function copyShiftAction(f: FormData) {
  const id = str(f, "id");
  const days = f.getAll("copy_day").map(String).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  const staff = await requireStaff();
  await run(f, async () => {
    const r = await copyShift(id, days, staff.id);
    return { msg: `Copied to ${r.ids.length} day${r.ids.length > 1 ? "s" : ""}.`, warnings: r.warnings };
  }, { edit: id });
}

export async function attendedAction(f: FormData) {
  const id = str(f, "id");
  await run(f, async () => {
    await markAttended(id, str(f, "attend_start"), str(f, "attend_end"));
    return { msg: "Attendance recorded." };
  }, { edit: id });
}
