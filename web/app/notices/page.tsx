import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { CarerTabs } from "@/components/CarerTabs";
import { CARER_ROLES } from "@/lib/carers/data";
import { allNotices, carerChoices, notice } from "@/lib/notices/data";
import { noticeOpAction, saveNoticeAction } from "./actions";

export const dynamic = "force-dynamic";

const dmy = (d: Date) => new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", day: "numeric", month: "short", year: "numeric" }).format(new Date(d));

/** Notices for carers: write one, choose who sees it, and turn it on or off. */
export default async function Notices({ searchParams }: { searchParams: Promise<{ edit?: string; msg?: string; error?: string }> }) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const [list, carers, editing] = await Promise.all([
    allNotices(), carerChoices(),
    sp.edit && sp.edit !== "new" ? notice(sp.edit) : Promise.resolve(null),
  ]);
  const names = new Map(carers.map((c) => [c.id, c.name]));
  const form = sp.edit ? (editing ?? { id: "", title: "", body: "", active: true, roles: [] as string[], carers: [] as string[] }) : null;
  return (
    <div className="shell">
      <TopBar section="/carers" email={staff.email}><CarerTabs on="/notices" /></TopBar>
      <main>
        <h1>Notices</h1>
        <p className="lede">A popup on the carer pages. It shows to the carers you choose while it&apos;s on, until each one taps &quot;Got it&quot;.</p>
        {sp.msg && <p className="banner ok">{sp.msg}</p>}
        {sp.error && <p className="banner error">{sp.error}</p>}
        {!form && <p><Link href="/notices?edit=new" className="button">New notice</Link></p>}

        {form && (
          <form action={saveNoticeAction} className="stack notice-form">
            <input type="hidden" name="id" value={form.id} />
            <label>Title<input name="title" defaultValue={form.title} required /></label>
            <label>Message<textarea name="body" rows={8} defaultValue={form.body} required /></label>
            <fieldset className="chips">
              <legend>Roles (none ticked = every role)</legend>
              {CARER_ROLES.map(([k, l]) => (
                <label key={k} className="check"><input type="checkbox" name="roles" value={k} defaultChecked={form.roles.includes(k)} />{l}</label>
              ))}
            </fieldset>
            <details className="tags">
              <summary><span className="tags-empty">{form.carers.length ? `${form.carers.length} carer${form.carers.length === 1 ? "" : "s"} chosen` : "Only these carers (optional): choose…"}</span></summary>
              <div className="tags-list">
                {carers.map((c) => (
                  <label key={c.id} className="check"><input type="checkbox" name="carers" value={c.id} defaultChecked={form.carers.includes(c.id)} />{c.name}</label>
                ))}
              </div>
            </details>
            <p className="hint">If you choose carers, only they see it (and only those with a ticked role, if you tick roles too).</p>
            <label className="check"><input type="checkbox" name="active" defaultChecked={form.active} />On (showing to carers)</label>
            <div className="row tight"><button type="submit">Save</button><Link href="/notices" className="button secondary">Cancel</Link></div>
          </form>
        )}

        {list.length === 0 ? <p className="empty">No notices yet.</p> : (
          <div className="table-wrap">
            <table className="grid">
              <thead><tr><th>Notice</th><th>Who</th><th className="num">Read</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {list.map((n) => (
                  <tr key={n.id}>
                    <td><b>{n.title}</b><br /><small className="hint">{n.body.slice(0, 90)}{n.body.length > 90 ? "…" : ""}</small><br /><small className="hint">{dmy(n.created_at)}</small></td>
                    <td>
                      {n.roles.length ? n.roles.map((r) => r.toUpperCase()).join(", ") : "All roles"}
                      {n.carers.length > 0 && <><br /><small className="hint">{n.carers.map((c) => names.get(c) ?? "(left)").join(", ")}</small></>}
                    </td>
                    <td className="num">{n.reads} / {n.audience}</td>
                    <td>{n.active ? <span className="tick">ON</span> : <span className="dash">Off</span>}</td>
                    <td><div className="row tight">
                      <form action={noticeOpAction}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="op" value={n.active ? "off" : "on"} /><button className={n.active ? "secondary" : ""}>{n.active ? "Turn off" : "Turn on"}</button></form>
                      <Link href={`/notices?edit=${n.id}`} className="button secondary">Edit</Link>
                      <form action={noticeOpAction}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="op" value="reset" /><button className="secondary" title="Show it again to everyone who already tapped Got it">Show again</button></form>
                      <form action={noticeOpAction}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="op" value="delete" /><button className="secondary">Delete</button></form>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
