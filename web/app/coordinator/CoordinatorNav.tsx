import Link from "next/link";
import { MenuBurger } from "@/components/MenuBurger";
import { signOutAction } from "@/app/invoicing/actions";
import { ViewAsBar } from "@/components/ViewAsBar";
import { noteEmailsOn } from "@/lib/coordinator/data";
import { noteEmailsAction } from "./actions";

type On = "calendar" | "participants" | "search";

/** The coordinator's menu down the left, as on Bubble's coordinator page. */
export async function CoordinatorNav({ on, me }: { on: On; me: { id: string; name: string } }) {
  const emails = await noteEmailsOn(me.id);
  const items: { key: On; label: string; href: string }[] = [
    { key: "calendar", label: "Calendar", href: "/coordinator" },
    { key: "participants", label: "Participants", href: "/coordinator/participants" },
  ];
  return (
    <>
      <ViewAsBar />
      <aside className="side">
        <span className="wordmark small">knightingale</span>
        <MenuBurger />
        <span className="side-hello">Hi {me.name.split(" ")[0]}</span>
        <nav>
          {items.map((i) => (
            <Link key={i.key} href={i.href} className={`side-btn ${on === i.key ? "on" : ""}`}>{i.label}</Link>
          ))}
          <span className="side-btn off" title="Coming soon">Search Progress Notes</span>
        </nav>
        <form action={noteEmailsAction} className="coord-emails">
          <input type="hidden" name="on" value={emails ? "0" : "1"} />
          <button className="link">{emails ? "Stop emailing me progress notes" : "Email me progress notes"}</button>
          {!emails && <p className="coord-notice">NOTICE: You have opted out of receiving progress notes</p>}
        </form>
        <form action={signOutAction}><button className="side-out">Logout</button></form>
      </aside>
    </>
  );
}
