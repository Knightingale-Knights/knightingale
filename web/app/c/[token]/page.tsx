import { env } from "@/lib/env";
import { clockLabel } from "@/lib/roster/rules";
import { linkExpired, verifyLink } from "@/lib/texts/rules";
import { shiftForLink } from "@/lib/texts/data";
import { CheckButton } from "@/app/carer/shift/[id]/CheckButton";

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

// Opened from a carer text. No sign-in needed: the signed link is for this one shift.
export default async function LinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = verifyLink(env.linkSecret, token);
  const s = t ? await shiftForLink(t.shiftId) : null;
  if (!t || !s) return <Shell><h1>Link not valid</h1><p>Please text Klarra for a new link.</p></Shell>;

  const done = t.kind === "in" ? s.attend_start : s.attend_end;
  const expired = linkExpired(t.kind, s.start_at.getTime(), s.end_at.getTime(), Date.now());
  return (
    <Shell>
      <h1>{(s.track === "ndis" ? s.participant?.split(" ")[0] : s.place) ?? "Your shift"}</h1>
      <p className="when">{dayLabel(s.day)} · {clockLabel(s.start_time)}–{clockLabel(s.end_time)}</p>
      {s.address_text && <p>{s.address_text}</p>}
      <section className="block">
        {s.cancelled ? (
          <p className="banner warn">This shift has been cancelled.</p>
        ) : done ? (
          <p className="banner ok">{t.kind === "in" ? `You checked in at ${time(s.attend_start!)}.` : `You checked out at ${time(s.attend_end!)}.`}</p>
        ) : t.kind === "out" && !s.attend_start ? (
          <p className="banner warn">You haven&apos;t checked in to this shift. Please call Paul.</p>
        ) : expired ? (
          <p className="banner warn">This link has expired. Text Klarra for a new one.</p>
        ) : (
          <>
            <CheckButton kind={t.kind} shiftId={s.id} token={token} />
            <p className="hint">You need to be within 500 m of the address, with location turned on.</p>
          </>
        )}
      </section>
    </Shell>
  );
}
