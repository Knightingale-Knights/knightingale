// Klarra's weekly shift check: carers booked on two shifts that overlap, and shifts with no carer yet.
// Reads Bubble directly (it is the live roster until switch-over), so it sees the shifts the
// recurring shift generator has just created.

// Bubble's placeholder "no carer yet" user counts as no carer.
export const PLACEHOLDER_CARER = "1714187809198x208818558676652900";

export type BubbleShift = {
  _id: string; date?: string; "start time"?: number; "end time"?: number;
  carer?: string; participant?: string; location?: string; cancelled?: boolean;
};

export type Slot = { id: string; day: string; start: number; end: number; carer: string | null; who: string | null };

const MELB = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne", year: "numeric", month: "2-digit", day: "2-digit" });
export const melbDay = (iso: string) => MELB.format(new Date(iso));

/** Bubble's clock number (900, 1430, 2400 = midnight, 2430 = 00:30 next day) in minutes. */
export const minutes = (n: number) => Math.floor(n / 100) * 60 + (n % 100);
export const clock = (n: number) => `${String(Math.floor(n / 100) % 24).padStart(2, "0")}:${String(n % 100).padStart(2, "0")}`;

const dayIndex = (day: string) => Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)) / 86_400_000;

/** A shift's start and end in minutes from a fixed point; an end at or before the start runs past midnight. */
export function span(s: Pick<Slot, "day" | "start" | "end">) {
  const start = dayIndex(s.day) * 1440 + minutes(s.start);
  let end = dayIndex(s.day) * 1440 + minutes(s.end);
  if (end <= start) end += 1440;
  return [start, end] as const;
}

export function toSlots(rows: BubbleShift[]): Slot[] {
  return rows
    .filter((r) => !r.cancelled && r.date && r["start time"] != null && r["end time"] != null)
    .map((r) => ({
      id: r._id, day: melbDay(r.date!), start: r["start time"]!, end: r["end time"]!,
      carer: r.carer && r.carer !== PLACEHOLDER_CARER ? r.carer : null,
      who: r.participant ?? r.location ?? null,
    }));
}

/** Pairs of shifts for the same carer whose times overlap (back to back is fine). */
export function conflicts(slots: Slot[]): [Slot, Slot][] {
  const byCarer = new Map<string, Slot[]>();
  for (const s of slots) if (s.carer) byCarer.set(s.carer, [...(byCarer.get(s.carer) ?? []), s]);
  const out: [Slot, Slot][] = [];
  for (const list of byCarer.values()) {
    const sorted = [...list].sort((a, b) => span(a)[0] - span(b)[0]);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const [as, ae] = span(sorted[i]);
        const [bs] = span(sorted[j]);
        if (bs >= ae) break;
        if (as < ae && bs < ae) out.push([sorted[i], sorted[j]]);
      }
    }
  }
  return out;
}

/** Shifts with no carer yet. */
export const gaps = (slots: Slot[]) => slots.filter((s) => !s.carer).sort((a, b) => span(a)[0] - span(b)[0]);
