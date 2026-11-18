import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { accountOverview } from "@/lib/account/data";
import { SECTIONS } from "@/lib/account/sections";
import { positionOf } from "@/lib/contract/text";
import { isoDate } from "@/lib/invoicing/rules";
import { Portrait } from "@/components/CarerCells";
import { signOutAction } from "@/app/invoicing/actions";
import { CarerNav } from "../CarerNav";

export const dynamic = "force-dynamic";

const Tick = ({ done }: { done: boolean | null }) =>
  done === null ? <span className="acct-mark" /> : (
    <svg className={`acct-mark ${done ? "done" : "todo"}`} viewBox="0 0 24 24" aria-label={done ? "Done" : "To do"}>
      <circle cx="12" cy="12" r="10" />
      {done && <path d="M7.5 12.5l3 3 6-6.5" />}
    </svg>
  );

export default async function Account() {
  const me = await requireCarer();
  const a = await accountOverview(me.id, isoDate(new Date()));
  const name = a.name || me.name;
  return (
    <div className="carer">
      <CarerNav on="account" name={me.name} />
      <main>
        <div className="acct-head">
          <Portrait photo={a.photo} name={name} />
          <h1>{name}</h1>
          <p className="acct-role">{positionOf(a.roles)}</p>
        </div>
        <ul className="acct-list">
          {SECTIONS.map((s) => {
            const href = s.kind === "link" ? s.href : `/carer/account/${s.key}`;
            const ext = s.kind === "link" && s.external;
            return (
              <li key={s.key}>
                <Link href={href} {...(ext ? { target: "_blank", rel: "noopener" } : {})}>
                  <Tick done={a.done[s.key]} />
                  <span className="acct-label">{s.label}</span>
                  <svg className="acct-go" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="10" /><path d="M10.5 8l4 4-4 4" /></svg>
                </Link>
              </li>
            );
          })}
        </ul>
        <form action={signOutAction} className="acct-out"><button className="link">Logout</button></form>
      </main>
    </div>
  );
}
