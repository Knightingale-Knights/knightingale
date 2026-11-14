// Week helpers for the weekly roster email (no database).
import { addDays } from "./rules";
import { isoDate } from "@/lib/invoicing/rules";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const parts = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return { y, m, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
};

/** The coming Monday in Melbourne; on a Monday, the Monday after (as the Roster repo did). */
export function nextMonday(today = isoDate(new Date())) {
  const { dow } = parts(today);
  return addDays(today, ((8 - dow) % 7) || 7);
}

/** "Monday 5 Oct to Sunday 11 Oct" */
export function weekRangeText(start: string) {
  const a = parts(start);
  const b = parts(addDays(start, 6));
  return `${WEEKDAYS[a.dow]} ${a.d} ${MONTHS[a.m - 1]} to ${WEEKDAYS[b.dow]} ${b.d} ${MONTHS[b.m - 1]}`;
}

