import Link from "next/link";
import { MenuBurger } from "@/components/MenuBurger";
import { redirect } from "next/navigation";
import { CONTRACT_GATE, contractState } from "@/lib/contract/data";
import { signOutAction } from "@/app/invoicing/actions";
import { currentUser } from "@/lib/auth";
import { unreadTotal } from "@/lib/chats/data";
import { attentionCount } from "@/lib/compliance/data";
import { isoDate } from "@/lib/invoicing/rules";
import { ViewAsBar } from "@/components/ViewAsBar";
import { AccountNag } from "@/components/AccountNag";
import { accountNag } from "@/lib/account/nag";

type On = "shifts" | "availability" | "chats" | "account" | "policies" | "stats";

/** The carer's menu, down the left side like the admin pages. */
export async function CarerNav({ on, name, shiftsHref = "/carer" }: { on: On; name: string; shiftsHref?: string }) {
  const me = await currentUser();
  // A carer whose application is still being reviewed sees only a popup, with no way to close it.
  const pending = me?.role === "carer" && !me.approved;
  // An unsigned carer signs the employment contract before anything else (an admin viewing as them is not stopped).
  if (CONTRACT_GATE && me?.role === "carer" && !pending && !me.viewAs && !(await contractState(me.id)).signature) redirect("/carer/contract");
  const today = isoDate(new Date());
  const [unread, docs, nag] = me
    ? await Promise.all([unreadTotal(me), attentionCount(me.id, today), me.role === "carer" ? accountNag(me.id, today, !me.viewAs) : null])
    : [0, 0, null];
  // Past the two weeks' grace: the carer can only use their Account and Availability until it's sorted. The office is never stopped.
  const free = on === "account" || on === "availability";
  if (nag?.blocked && !pending && !me!.viewAs && !free) redirect("/carer/account");
  const items: { key: On; label: string; href: string; badge?: number }[] = [
    { key: "shifts", label: "My Shifts", href: shiftsHref },
    { key: "availability", label: "Availability", href: "/carer/availability" },
    { key: "chats", label: "Chats", href: "/carer/chats", badge: unread },
    { key: "policies", label: "Policies", href: "/carer/policies" },
    { key: "stats", label: "My Stats", href: "/carer/stats" },
    { key: "account", label: "Account", href: "/carer/account", badge: docs },
  ];
  return (
    <>
      <ViewAsBar />
      {pending && (
        <div className="locked-back" role="dialog" aria-modal="true" aria-labelledby="pending-title">
          <div className="popup locked-popup">
            <h2 id="pending-title">Thanks for applying!</h2>
            <p>We&apos;re reviewing your application and will be in touch.</p>
            <form action={signOutAction}><button className="big secondary">Sign out</button></form>
          </div>
        </div>
      )}
      {nag && nag.items.length > 0 && (
        <AccountNag nag={nag} closable={!nag.blocked || Boolean(me!.viewAs) || free}
          storeKey={`nag:${today}:${nag.blocked ? "b" : "s"}:${nag.items.map((i) => i.key).join(",")}`} />
      )}
      <aside className="side">
        <span className="wordmark small">knightingale</span>
        <MenuBurger />
        <span className="side-hello">Hi {name.split(" ")[0]}</span>
        <nav>
          {items.map((i) => (
            <Link key={i.key} href={i.href} className={`side-btn ${on === i.key ? "on" : ""}`}>
              {i.label}{i.badge ? <span className={i.key === "chats" ? "badge dot" : "badge"}>{i.badge}</span> : null}
            </Link>
          ))}
        </nav>
        <form action={signOutAction}><button className="side-out">Logout</button></form>
      </aside>
    </>
  );
}
