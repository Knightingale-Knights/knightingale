import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { currentUser } from "@/lib/auth";
import { clockLabel } from "@/lib/roster/rules";
import { linkExpired, verifyLink } from "@/lib/texts/rules";
import { shiftForLink } from "@/lib/texts/data";
import { CheckPopup } from "@/app/carer/check";

export const dynamic = "force-dynamic";

const time = (d: Date) => new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" }).format(d);
const dayLabel = (day: string) =>
  new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="carer">
      <header className="carer-top"><span className="wordmark small">knightingale</span></header>
      <main>{children}</main>
    </div>
  );
}

// Opened from a carer text. A signed-in carer goes straight to the shift in the app, with the popup open.
// Otherwise the signed link checks them in or out of this one shift without signing in.
export default async function LinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = verifyLink(env.linkSecret, token);
  const s = t ? await shiftForLink(t.shiftId) : null;
  if (!t || !s) return <Shell><h1>Link not valid</h1><p>Please text Klarra for a new link.</p></Shell>;

  const me = await currentUser();
  if (me?.role === "carer" && me.id === s.carer) redirect(`/carer/shift/${s.id}?check=${t.kind}`);

  const title = `${(s.track === "ndis" ? s.participant?.split(" ")[0] : s.place) ?? "Your shift"}, ${clockLabel(s.start_time)}–${clockLabel(s.end_time)}`;
  const done = t.kind === "in" ? s.attend_start : s.attend_end;
  const expired = linkExpired(t.kind, s.start_at.getTime(), s.end_at.getTime(), Date.now());
  const blocked = s.cancelled
    ? "This shift has been cancelled."
    : done ? (t.kind === "in" ? `You checked in at ${time(s.attend_start!)}.` : `You checked out at ${time(s.attend_end!)}.`)
    : t.kind === "out" && !s.attend_start ? "You haven't checked in to this shift. Please call Paul."
    : expired ? "This link has expired. Text Klarra for a new one." : null;

  return (
    <Shell>
      <h1>{title.split(",")[0]}</h1>
      <p className="when">{dayLabel(s.day)} · {clockLabel(s.start_time)}–{clockLabel(s.end_time)}</p>
      {s.address_text && <p>{s.address_text}</p>}
      {blocked ? <p className={`banner ${done ? "ok" : "warn"}`}>{blocked}</p> : <CheckPopup kind={t.kind} shiftId={s.id} token={token} force title={title} detail={s.address_text ?? ""} />}
    </Shell>
  );
}
