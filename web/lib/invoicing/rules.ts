// Pure invoicing rules: line items, totals and CSV rows. No database access,
// so everything here is unit tested in rules.test.ts.

export type InvoiceKind = "residential" | "ndis" | "ndia";

export type ShiftRow = {
  id: string;
  bubble_id: string | null;
  date: Date | null;
  start_time: number | null;
  end_time: number | null;
  hours: number | null;
  rate: number | null;
  fee: number | null;
  roles: string[] | null;
  carer_first: string | null;
  carer_last: string | null;
  ndis_item_no: string | null;
  ndis_item_name: string | null;
  ndis_item_price: number | null;
  registration: string | null;
  gst_code: string | null;
  abn: string | null;
  participant_ndis_number: string | null;
  location_name: string | null;
  late: boolean;
};

export type TravelRow = {
  id: string;
  bubble_id: string | null;
  date: Date | null;
  carer_first: string | null;
  distance: number | null;
  shift_item_no?: string | null; // NDIS item of the shift this travel was logged against
};

export const GST_RATE = 0.1;
export const TRAVEL_RATE = 1; // dollars per km, as in Bubble
const TZ = "Australia/Melbourne";

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (v: unknown) => (v == null || v === "" ? 0 : Number(v));

// ---- dates -----------------------------------------------------------------

function parts(d: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: TZ, weekday: "short", day: "numeric", month: "long", year: "numeric",
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  return { weekday: p.weekday as string, day: Number(p.day), month: p.month as string, year: p.year as string };
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** "Thu, Sep 17th" (short month) or "Thu, September 17th" (long month), in Melbourne time. */
export function lineDate(d: Date | null, longMonth = false) {
  if (!d) return "";
  const p = parts(d);
  return `${p.weekday}, ${longMonth ? p.month : p.month.slice(0, 3)} ${ordinal(p.day)}`;
}

/** dd/mm/yyyy in Melbourne time. Accepts a Date or a yyyy-mm-dd string. */
export function auDate(d: Date | string | null) {
  if (!d) return "";
  if (typeof d === "string") {
    const [y, m, day] = d.slice(0, 10).split("-");
    return `${day}/${m}/${y}`;
  }
  return new Intl.DateTimeFormat("en-AU", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

/** yyyy-mm-dd in Melbourne time. */
export function isoDate(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Bubble stores shift times as numbers like 930 or 1430. */
export function clock(n: number | null) {
  if (n == null) return "";
  const h = Math.floor(n / 100);
  const m = n % 100;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const ROLE_LABELS: Record<string, string> = {
  en: "EN", rn: "RN", pca: "PCA", dsw: "DSW", cleaner: "CL", student_nurse: "STUDENT NURSE",
};
export const roleLabel = (roles: string[] | null) => (roles?.[0] ? ROLE_LABELS[roles[0]] ?? roles[0].toUpperCase() : "");

const carerName = (s: { carer_first: string | null; carer_last?: string | null }, full = false) =>
  [s.carer_first, full ? s.carer_last : null].filter(Boolean).join(" ");

// ---- line items (shapes the PDF templates expect) --------------------------

export function residentialLineItems(shifts: ShiftRow[]) {
  return shifts.map((s) => ({
    date: lineDate(s.date),
    shift: `${clock(s.start_time)} - ${clock(s.end_time)}`,
    carer: carerName(s, true),
    role: roleLabel(s.roles),
    hours: num(s.hours),
    rate: num(s.rate),
  }));
}

export function ndisShiftItems(shifts: ShiftRow[]) {
  return shifts.map((s) => ({
    date: lineDate(s.date, true),
    carer: carerName(s),
    ndis_item: s.ndis_item_no ?? "",
    ndis_description: s.ndis_item_name ?? "",
    hours: num(s.hours),
    rate: num(s.rate),
  }));
}

/** The two NDIS items travel can be billed under. */
export const TRAVEL_ITEMS = [
  { no: "01_799_0107_1_1", description: "Provider travel - non-labour costs" },
  { no: "04_590_0125_6_1", description: "Activity Based Transport" },
] as const;

const category = (itemNo: string | null | undefined) => (itemNo ?? "").trim().slice(0, 2);

type TravelItem = (typeof TRAVEL_ITEMS)[number];
const itemForCategory = (cat: string) => TRAVEL_ITEMS.find((t) => category(t.no) === cat);

/** Travel items whose category (01 or 04) matches a shift item on the invoice. Both if no shift says. */
export function travelItemOptions(shifts: Pick<ShiftRow, "ndis_item_no">[]) {
  const cats = new Set(shifts.map((s) => category(s.ndis_item_no)));
  const matching = TRAVEL_ITEMS.filter((t) => cats.has(category(t.no)));
  return matching.length ? matching : [...TRAVEL_ITEMS];
}

/**
 * The travel item for one travel log, matched to the shifts' 01/04 category:
 * the shift it was logged against, else the shifts on the same day, else the
 * whole invoice. Null when that is still ambiguous (the person then chooses).
 */
export function travelItemFor(log: TravelRow, shifts: Pick<ShiftRow, "ndis_item_no" | "date">[]): TravelItem | null {
  const own = itemForCategory(category(log.shift_item_no));
  if (own) return own;
  const day = isoDate(log.date);
  const sameDay = travelItemOptions(shifts.filter((s) => day && isoDate(s.date) === day));
  if (sameDay.length === 1 && shifts.some((s) => day && isoDate(s.date) === day)) return sameDay[0];
  const all = travelItemOptions(shifts);
  return all.length === 1 ? all[0] : null;
}

export function travelItems(logs: TravelRow[], shifts: Pick<ShiftRow, "ndis_item_no" | "date">[], fallbackNo: string) {
  const fallback = TRAVEL_ITEMS.find((t) => t.no === fallbackNo);
  return logs.map((l) => {
    const item = travelItemFor(l, shifts) ?? fallback;
    return {
      date: lineDate(l.date, true),
      carer: l.carer_first ?? "",
      ndis_item: item?.no ?? "",
      ndis_description: item?.description ?? "",
      distance: num(l.distance),
      rate: TRAVEL_RATE,
    };
  });
}

// ---- totals ----------------------------------------------------------------

/** Same arithmetic as the PDF templates: each line is hours x rate. */
export function totals(kind: InvoiceKind, shifts: ShiftRow[], travel: TravelRow[] = []) {
  const shiftTotal = round2(shifts.reduce((a, s) => a + num(s.hours) * num(s.rate), 0));
  const travelTotal = kind === "residential" ? 0 : round2(travel.reduce((a, l) => a + num(l.distance) * TRAVEL_RATE, 0));
  const subtotal = round2(shiftTotal + travelTotal);
  const gst = kind === "residential" ? round2(subtotal * GST_RATE) : 0;
  return { shiftTotal, travelTotal, subtotal, gst, amount: round2(subtotal + gst) };
}

/** Shifts where Bubble's stored fee disagrees with hours x rate, so staff can check before sending. */
export function feeMismatches(shifts: ShiftRow[]) {
  return shifts.filter((s) => s.fee != null && Math.abs(num(s.fee) - num(s.hours) * num(s.rate)) >= 0.01);
}

// ---- CSV rows --------------------------------------------------------------

export function ndiaCsvRows(shifts: ShiftRow[], invoiceNumber: string) {
  return shifts.map((s) => ({
    RegistrationNumber: s.registration ?? "",
    NDISNumber: s.participant_ndis_number ?? "",
    SupportsDeliveredFrom: isoDate(s.date),
    SupportsDeliveredTo: isoDate(s.date),
    SupportNumber: s.ndis_item_no ?? "",
    ClaimReference: invoiceNumber,
    Quantity: "",
    Hours: num(s.hours),
    UnitPrice: num(s.ndis_item_price),
    GSTCode: s.gst_code ?? "",
    AuthorisedBy: "",
    ParticipantApproved: "",
    InKindFundingProgram: "",
    ClaimType: "",
    CancellationReason: "",
    "ABN of Support Provider": s.abn ?? "",
  }));
}

export const NDIA_HEADERS = [
  "RegistrationNumber", "NDISNumber", "SupportsDeliveredFrom", "SupportsDeliveredTo", "SupportNumber",
  "ClaimReference", "Quantity", "Hours", "UnitPrice", "GSTCode", "AuthorisedBy", "ParticipantApproved",
  "InKindFundingProgram", "ClaimType", "CancellationReason", "ABN of Support Provider",
] as const;

export type WintringhamShift = ShiftRow & {
  invoice_number: string | null;
  invoice_period_ending: Date | null;
  invoice_amount: number | null;
};

export function wintringhamRows(shifts: WintringhamShift[]) {
  const n2 = (v: unknown) => num(v).toFixed(2);
  return shifts.map((s) => ({
    "Wintringham Sites": s.location_name ?? "",
    "Invoice Number": s.invoice_number ?? "",
    "Invoice date": auDate(s.invoice_period_ending),
    "Name (agencies)": s.carer_first ?? "",
    Qualification: roleLabel(s.roles),
    "Shift Date": auDate(s.date),
    "Rate Per Hour": n2(s.rate),
    "Start Time": clock(s.start_time),
    "End Time": clock(s.end_time),
    "Shift Hours": n2(s.hours),
    "Shift Amount": n2(s.fee),
    "Invoice Amount": n2(s.invoice_amount),
  }));
}

export const WINTRINGHAM_HEADERS = [
  "Wintringham Sites", "Invoice Number", "Invoice date", "Name (agencies)", "Qualification", "Shift Date",
  "Rate Per Hour", "Start Time", "End Time", "Shift Hours", "Shift Amount", "Invoice Amount",
] as const;

export function toCsv(headers: readonly string[], rows: Record<string, unknown>[]) {
  const esc = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** Due date = invoice date + payment terms in days (terms like "14 days" or "14"). */
export function dueDate(invoiceDate: string, terms: string) {
  const days = Number((terms.match(/\d+/) ?? ["0"])[0]);
  const d = new Date(`${invoiceDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
