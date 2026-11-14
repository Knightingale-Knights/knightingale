import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  billableShifts, billableTravel, listLocations, listParticipants, nextInvoiceNumber, recentInvoices, wintringhamPending,
} from "@/lib/invoicing/queries";
import {
  auDate, clock, feeMismatches, isoDate, lineDate, roleLabel, totals, type InvoiceKind,
} from "@/lib/invoicing/rules";
import { createInvoiceAction, sendWintringhamAction, setInvoiceStateAction, signOutAction } from "./actions";

export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;
const TABS = [
  ["residential", "Residential"],
  ["ndis", "NDIS"],
  ["ndia", "NDIA"],
  ["wintringham", "Wintringham CSV"],
  ["sent", "Invoices"],
] as const;

const money = (n: number | null | undefined) =>
  "$" + Number(n ?? 0).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => isoDate(new Date());

export default async function Invoicing({ searchParams }: { searchParams: Promise<SP> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const tab = (TABS.find(([k]) => k === sp.tab)?.[0] ?? "residential") as (typeof TABS)[number][0];

  return (
    <div className="shell">
      <header className="top">
        <span className="wordmark small">knightingale</span>
        <nav className="tabs">
          {TABS.map(([k, label]) => (
            <Link key={k} href={`/invoicing?tab=${k}`} className={k === tab ? "on" : ""}>{label}</Link>
          ))}
        </nav>
        <form action={signOutAction}>
          <button className="link" title={staff.email}>Sign out</button>
        </form>
      </header>

      <main className="page">
        {sp.done && (
          <p className="banner ok">
            Invoice created. <a href={`/invoicing/pdf/${sp.done}`} target="_blank">Open the PDF</a> or see it under{" "}
            <Link href="/invoicing?tab=sent">Invoices</Link>.
          </p>
        )}
        {sp.sent && <p className="banner ok">Sent {sp.sent} rows to Wintringham.</p>}
        {sp.warn && <p className="banner warn">{sp.warn}</p>}
        {sp.error && <p className="banner error">{sp.error}</p>}

        {(tab === "residential" || tab === "ndis" || tab === "ndia") && <InvoiceTab kind={tab} sp={sp} />}
        {tab === "wintringham" && <WintringhamTab />}
        {tab === "sent" && <SentTab />}
      </main>
    </div>
  );
}

async function InvoiceTab({ kind, sp }: { kind: InvoiceKind; sp: SP }) {
  const residential = kind === "residential";
  const options = residential ? await listLocations() : await listParticipants();
  const target = sp.target && options.some((o) => o.id === sp.target) ? sp.target : undefined;
  const through = sp.through || today();

  return (
    <section>
      <h1>{residential ? "Residential invoice" : kind === "ndis" ? "NDIS invoice" : "NDIA invoice"}</h1>
      <p className="lede">
        {residential
          ? "Bills a location for every shift not yet invoiced, up to the date you choose. 10% GST is added."
          : kind === "ndis"
            ? "Bills a participant's plan manager for shifts and travel not yet invoiced, up to the date you choose."
            : "Bills the NDIA for a participant's shifts and travel. The claims CSV is attached to the same email."}
      </p>

      <form className="row" method="get">
        <input type="hidden" name="tab" value={kind} />
        <label className="grow">
          {residential ? "Location" : "Participant"}
          <select name="target" defaultValue={target ?? ""} required>
            <option value="" disabled>Choose…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}{o.billable ? ` (${o.billable} to invoice)` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bill shifts up to
          <input type="date" name="through" defaultValue={through} required />
        </label>
        <button type="submit" className="secondary">Show shifts</button>
      </form>

      {target && <Preview kind={kind} target={target} through={through} options={options} />}
    </section>
  );
}

async function Preview({
  kind, target, through, options,
}: {
  kind: InvoiceKind; target: string; through: string;
  options: Awaited<ReturnType<typeof listLocations>> | Awaited<ReturnType<typeof listParticipants>>;
}) {
  const residential = kind === "residential";
  const [shifts, travel, number] = await Promise.all([
    billableShifts(kind, target, through),
    residential ? Promise.resolve([]) : billableTravel(target, through),
    nextInvoiceNumber(),
  ]);
  const sum = totals(kind, shifts, travel);
  const mismatches = feeMismatches(shifts);
  const late = shifts.filter((s) => s.late).length;
  const opt = options.find((o) => o.id === target)!;
  const defaultTo = residential
    ? env.residentialTo
    : kind === "ndia"
      ? env.ndiaTo
      : ("location_email" in opt ? opt.location_email : null) ?? "";

  if (!shifts.length && !travel.length) {
    return <p className="empty">Nothing to invoice for {opt.name} up to {auDate(through)}.</p>;
  }

  return (
    <>
      <div className="summary">
        <div><span>Shifts</span><strong>{shifts.length}</strong></div>
        {!residential && <div><span>Travel</span><strong>{money(sum.travelTotal)}</strong></div>}
        <div><span>Subtotal</span><strong>{money(sum.subtotal)}</strong></div>
        {residential && <div><span>GST</span><strong>{money(sum.gst)}</strong></div>}
        <div className="total"><span>Total</span><strong>{money(sum.amount)}</strong></div>
      </div>

      {late > 0 && (
        <p className="banner warn">
          {late} shift{late > 1 ? "s were" : " was"} entered after this location was last invoiced. Bubble skipped these; they're included here.
        </p>
      )}
      {mismatches.length > 0 && (
        <p className="banner warn">
          {mismatches.length} shift{mismatches.length > 1 ? "s have" : " has"} a stored fee that doesn&apos;t match hours × rate.
          The invoice uses hours × rate, like the PDF. Check the highlighted rows.
        </p>
      )}

      <table className="lines">
        <thead>
          <tr>
            <th>Date</th><th>Time</th><th>Carer</th><th>{residential ? "Role" : "NDIS item"}</th>
            <th className="num">Hours</th><th className="num">Rate</th><th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {shifts.map((s) => (
            <tr key={s.id} className={mismatches.includes(s) ? "flag" : s.late ? "late" : ""}>
              <td>{lineDate(s.date)}</td>
              <td>{clock(s.start_time)}–{clock(s.end_time)}</td>
              <td>{[s.carer_first, s.carer_last].filter(Boolean).join(" ")}</td>
              <td>{residential ? roleLabel(s.roles) : s.ndis_item_no}</td>
              <td className="num">{Number(s.hours ?? 0).toFixed(2)}</td>
              <td className="num">{money(s.rate)}</td>
              <td className="num">{money((s.hours ?? 0) * (s.rate ?? 0))}</td>
            </tr>
          ))}
          {travel.map((t) => (
            <tr key={t.id} className="travel">
              <td>{lineDate(t.date)}</td><td>Travel</td><td>{t.carer_first}</td><td></td>
              <td className="num">{Number(t.distance ?? 0).toFixed(1)} km</td><td className="num">{money(1)}</td>
              <td className="num">{money(t.distance)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <form action={createInvoiceAction} className="create">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="target" value={target} />
        <input type="hidden" name="through" value={through} />
        {shifts.map((s) => <input key={s.id} type="hidden" name="shift_id" value={s.id} />)}
        <div className="grid">
          <label>Invoice number<input name="invoice_number" defaultValue={number} required /></label>
          <label>Invoice date<input type="date" name="invoice_date" defaultValue={today()} required /></label>
          <label>Payment terms<input name="payment_terms" defaultValue={env.defaultPaymentTerms} required /></label>
          <label>Send to<input type="email" name="send_to" defaultValue={defaultTo} required /></label>
          {!residential && (
            <>
              <label>Travel NDIS item<input name="travel_item_no" defaultValue="" placeholder="Item number" /></label>
              <label>Travel description<input name="travel_item_description" defaultValue="" placeholder="Description" /></label>
            </>
          )}
        </div>
        {kind === "ndis" && (
          <label className="check"><input type="checkbox" name="send_roster" defaultChecked /> Also email the weekly roster to the coordinator</label>
        )}
        <button type="submit">Create and send invoice for {money(sum.amount)}</button>
      </form>
    </>
  );
}

async function WintringhamTab() {
  const rows = await wintringhamPending();
  return (
    <section>
      <h1>Wintringham CSV</h1>
      <p className="lede">Every invoiced residential shift not yet reported to Wintringham. Brotherhood of St Laurence is left out, as in Bubble.</p>
      {rows.length === 0 ? (
        <p className="empty">Nothing waiting to be sent.</p>
      ) : (
        <>
          <table className="lines">
            <thead><tr><th>Site</th><th>Invoice</th><th>Date</th><th>Carer</th><th className="num">Hours</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {rows.slice(0, 200).map((s) => (
                <tr key={s.id}>
                  <td>{s.location_name}</td><td>{s.invoice_number}</td><td>{auDate(s.date)}</td>
                  <td>{s.carer_first}</td><td className="num">{Number(s.hours ?? 0).toFixed(2)}</td><td className="num">{money(s.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 200 && <p className="lede">Showing 200 of {rows.length}. All of them go in the CSV.</p>}
          <form action={sendWintringhamAction} className="create">
            <div className="grid">
              <label>Send to<input type="email" name="send_to" defaultValue={env.wintringhamTo} required /></label>
            </div>
            <button type="submit">Send {rows.length} rows</button>
          </form>
        </>
      )}
    </section>
  );
}

async function SentTab() {
  const rows = await recentInvoices();
  return (
    <section>
      <h1>Invoices</h1>
      <p className="lede">Invoices made here come first, then the most recent from Bubble.</p>
      <table className="lines">
        <thead>
          <tr><th>Number</th><th>Type</th><th>Billed to</th><th>Period end</th><th className="num">Amount</th><th>Status</th><th>Email</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id} className={i.state === "void" ? "void" : ""}>
              <td>{i.has_pdf ? <a href={`/invoicing/pdf/${i.id}`} target="_blank">{i.invoice_number}</a> : i.invoice_number}</td>
              <td>{i.created_in_app ? (i.kind ?? "").toUpperCase() : "Bubble"}</td>
              <td>{i.billed_to}</td>
              <td>{auDate(i.period_ending)}</td>
              <td className="num">{money(i.amount)}</td>
              <td>{i.state}</td>
              <td title={i.email_error ?? i.bubble_writeback_error ?? ""}>
                {i.emailed_at ? `Sent to ${i.emailed_to}` : i.email_error ? "Failed" : i.created_in_app ? "Not sent" : ""}
                {i.bubble_writeback_error ? " · Bubble update incomplete" : ""}
              </td>
              <td className="actions">
                {i.created_in_app && i.state === "issued" && (
                  <>
                    <form action={setInvoiceStateAction}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="state" value="paid" /><button className="link">Mark paid</button></form>
                    <details className="confirm">
                      <summary>Void</summary>
                      <form action={setInvoiceStateAction}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="state" value="void" /><button className="link danger">Confirm void</button></form>
                    </details>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
