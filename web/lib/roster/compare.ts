// Sunday 5am: last week's and next week's shifts side by side in a spreadsheet, matched by client, weekday and start
// time, so Paul can see at a glance which shifts repeated, which changed carer and which are new or missing.
import ExcelJS from "exceljs";
import { rangeShifts, type RosterShift } from "./queries";
import { addDays, clockLabel } from "./rules";

type Side = { time: string; carer: string; weekly: boolean } | null;
export type CompareRow = { weekday: number; day: string; client: string; start: number; last: Side; next: Side; check: Check };
type Check = "Same" | "Carer changed" | "Time changed" | "New next week" | "Not on next week" | "No carer yet";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const weekdayOf = (day: string) => (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
const label = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const clientOf = (s: RosterShift) => (s.kind === "ndis" ? s.participant_name : s.location_name) || "?";
const side = (s: RosterShift): Side => ({
  time: `${clockLabel(s.start_time)} - ${clockLabel(s.end_time)}`,
  carer: s.carer ? s.carer_name || "Carer" : "No carer yet",
  weekly: s.weekly,
});

/** Last week = the 7 days ending today (Sunday); next week = the 7 days from tomorrow (Monday). */
export async function compareWeeks(nextMonday: string) {
  const lastMonday = addDays(nextMonday, -7);
  const [last, next] = await Promise.all([
    rangeShifts(lastMonday, nextMonday, {}),
    rangeShifts(nextMonday, addDays(nextMonday, 7), {}),
  ]);
  const live = (l: RosterShift[]) => l.filter((s) => !s.cancelled);
  const key = (s: RosterShift) => `${weekdayOf(s.day)}|${clientOf(s)}|${s.kind}`;

  // Pair shifts of the same client on the same weekday, closest start time first.
  const pool = new Map<string, RosterShift[]>();
  for (const s of live(next)) pool.set(key(s), [...(pool.get(key(s)) ?? []), s]);
  const rows: CompareRow[] = [];
  for (const a of live(last)) {
    const options = pool.get(key(a)) ?? [];
    let best = -1;
    options.forEach((b, i) => {
      if (best < 0 || Math.abs((b.start_time ?? 0) - (a.start_time ?? 0)) < Math.abs((options[best].start_time ?? 0) - (a.start_time ?? 0))) best = i;
    });
    const b = best >= 0 ? options.splice(best, 1)[0] : null;
    const l = side(a);
    const n = b ? side(b) : null;
    const check: Check = !b ? "Not on next week"
      : !b.carer ? "No carer yet"
      : l!.time !== n!.time ? "Time changed"
      : a.carer !== b.carer ? "Carer changed"
      : "Same";
    rows.push({ weekday: weekdayOf(a.day), day: b?.day ?? addDays(a.day, 7), client: clientOf(a), start: b?.start_time ?? a.start_time ?? 0, last: l, next: n, check });
  }
  for (const list of pool.values()) {
    for (const b of list) {
      rows.push({ weekday: weekdayOf(b.day), day: b.day, client: clientOf(b), start: b.start_time ?? 0, last: null, next: side(b), check: b.carer ? "New next week" : "No carer yet" });
    }
  }
  rows.sort((x, y) => x.weekday - y.weekday || x.start - y.start || x.client.localeCompare(y.client));
  return { rows, lastMonday, nextMonday };
}

const FILL: Partial<Record<Check, string>> = {
  "Carer changed": "FFF6E3B5",
  "Time changed": "FFF6E3B5",
  "New next week": "FFDCEBDD",
  "Not on next week": "FFF3D1CF",
  "No carer yet": "FFF3D1CF",
};

/** One sheet: a header band per day, then each shift with last week on the left and next week on the right. */
export async function compareWorkbook(c: Awaited<ReturnType<typeof compareWeeks>>) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Knightingale";
  const ws = wb.addWorksheet("Last vs next week", {
    views: [{ state: "frozen", ySplit: 2 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:2" },
  });
  const lastEnd = addDays(c.nextMonday, -1);
  const nextEnd = addDays(c.nextMonday, 6);
  ws.columns = [
    { key: "client", width: 30 },
    { key: "lt", width: 15 }, { key: "lc", width: 24 },
    { key: "gap", width: 2 },
    { key: "nt", width: 15 }, { key: "nc", width: 24 },
    { key: "check", width: 18 },
  ];
  const top = ws.addRow(["", `Last week (${label(c.lastMonday)} - ${label(lastEnd)})`, "", "", `Next week (${label(c.nextMonday)} - ${label(nextEnd)})`, "", ""]);
  ws.mergeCells(top.number, 2, top.number, 3);
  ws.mergeCells(top.number, 5, top.number, 6);
  const head = ws.addRow(["Client", "Time", "Carer", "", "Time", "Carer", "Check"]);
  for (const r of [top, head]) {
    r.font = { bold: true, color: { argb: "FFFFFFFF" } };
    r.eachCell((cell, col) => { if (col !== 4) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF213530" } }; });
    r.alignment = { vertical: "middle" };
    r.height = 20;
  }

  let day = -1;
  for (const r of c.rows) {
    if (r.weekday !== day) {
      day = r.weekday;
      const band = ws.addRow([`${WEEKDAYS[day]}  (${label(addDays(c.lastMonday, day))} / ${label(addDays(c.nextMonday, day))})`]);
      ws.mergeCells(band.number, 1, band.number, 7);
      band.font = { bold: true, color: { argb: "FF213530" } };
      band.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E4DE" } };
      band.height = 18;
    }
    const row = ws.addRow([
      r.client,
      r.last?.time ?? "", r.last?.carer ?? "",
      "",
      r.next?.time ?? "", r.next?.carer ?? "",
      r.check,
    ]);
    const fill = FILL[r.check];
    if (fill) row.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    if (r.check === "Carer changed") row.getCell(6).font = { bold: true };
    if (r.check === "Time changed") row.getCell(5).font = { bold: true };
    row.eachCell((cell, col) => { if (col !== 4) cell.border = { bottom: { style: "thin", color: { argb: "FFE3E1DB" } } }; });
  }
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 7 } };
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export function summary(rows: CompareRow[]) {
  const n = (k: Check) => rows.filter((r) => r.check === k).length;
  return { same: n("Same"), carer: n("Carer changed"), time: n("Time changed"), added: n("New next week"), gone: n("Not on next week"), open: n("No carer yet") };
}
