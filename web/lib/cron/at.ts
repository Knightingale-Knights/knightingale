// Vercel Cron runs on UTC, so each daily email is scheduled at both 19:55 and 20:55 UTC and only the run that lands
// at 6am Melbourne (6:55am, daylight saving or not) goes ahead.
export function isMelbourneHour(hour: number, now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", hour: "numeric", hourCycle: "h23" }).format(now));
  return h === hour;
}
