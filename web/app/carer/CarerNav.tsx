import Link from "next/link";
import { MenuBurger } from "@/components/MenuBurger";
import { redirect } from "next/navigation";
import { CONTRACT_GATE, contractState } from "@/lib/contract/data";
import { signOutAction } from "@/app/invoicing/actions";
import { currentUser } from "@/lib/auth";
import { unreadTotal } from "@/lib/chats/data";
import { isoDate } from "@/lib/invoicing/rules";
import { ViewAsBar } from "@/components/ViewAsBar";
import { noticesFor } from "@/lib/notices/data";
import { NoticePopup } from "./NoticePopup";
import { FeedbackButton } from "./FeedbackButton";
import { noticeReadAction } from "./actions";
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
  const [unread, nag, notices] = me
    ? await Promise.all([
        unreadTotal(me),
        // Not approved yet: only the "wrong page" popup, never the account checklist.
        me.role === "carer" && !pending ? accountNag(me.id, today, !me.viewAs) : null,
        me.role === "carer" && !pending ? noticesFor(me.id) : [],
      ])
    : [0, null, []];
  // Past the two weeks' grace: the carer can only use their Account and Availability until it's sorted. The office is never stopped.
  const free = on === "account" || on === "availability";
  if (nag?.blocked && !pending && !me!.viewAs && !free) redirect("/carer/account");
  const items: { key: On; label: string; href: string; badge?: number }[] = [
    { key: "shifts", label: "My Shifts", href: shiftsHref },
    { key: "availability", label: "Availability", href: "/carer/availability" },
    { key: "chats", label: "Chats", href: "/carer/chats", badge: unread },
    { key: "policies", label: "Policies", href: "/carer/policies" },
    { key: "stats", label: "My Stats", href: "/carer/stats" },
    { key: "account", label: "Account", href: "/carer/account" },
  ];
  return (
    <>
      <ViewAsBar />
      {notices.length > 0 && <NoticePopup key={notices[0].id} id={notices[0].id} title={notices[0].title} body={notices[0].body} action={noticeReadAction} />}
      {pending && (
        <div className="locked-back" role="dialog" aria-modal="true" aria-labelledby="pending-title">
          <div className="popup locked-popup">
            <p id="pending-title">Oh dear, looks like you&apos;ve landed on the wrong page. When you have a moment, please:</p>
            <ul>
              <li>Navigate to <a href="https://knightingale.com.au/join">https://knightingale.com.au/join</a></li>
              <li>Enter your email and tap &quot;Start my application&quot;</li>
              <li>Open the sign-in link we email you</li>
              <li>Work through each step: About you, Your role, NDIS screening, Certificates, and Photo and ID</li>
              <li>Tap &quot;Submit my application&quot; on the last step</li>
              <li>Once you submit, you&apos;ll receive an email with application video instructions. We look forward to seeing your application video</li>
            </ul>
            <p>Please email the team, <a href="mailto:care@knightingale.com.au">care@knightingale.com.au</a>, if you run into any issues or if you have already completed all these steps.</p>
            <p>I&apos;m sure you&apos;ll do great.</p>
            <p>Paul</p>
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
          {!pending && <FeedbackButton />}
        </nav>
        <form action={signOutAction}><button className="side-out">Logout</button></form>
      </aside>
    </>
  );
}
