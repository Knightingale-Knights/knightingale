import Link from "next/link";
import { redirect } from "next/navigation";
import { CONTRACT_GATE, contractState } from "@/lib/contract/data";
import { signOutAction } from "@/app/invoicing/actions";
import { currentUser } from "@/lib/auth";
import { unreadTotal } from "@/lib/chats/data";
import { attentionCount } from "@/lib/compliance/data";
import { isoDate } from "@/lib/invoicing/rules";
import { ViewAsBar } from "@/components/ViewAsBar";

type On = "shifts" | "availability" | "chats" | "documents" | "policies";

/** The carer's menu, down the left side like the admin pages. */
export async function CarerNav({ on, name, shiftsHref = "/carer" }: { on: On; name: string; shiftsHref?: string }) {
  const me = await currentUser();
  // An unsigned carer signs the employment contract before anything else (an admin viewing as them is not stopped).
  if (CONTRACT_GATE && me?.role === "carer" && !me.viewAs && !(await contractState(me.id)).signature) redirect("/carer/contract");
  const [unread, docs] = me ? await Promise.all([unreadTotal(me), attentionCount(me.id, isoDate(new Date()))]) : [0, 0];
  const items: { key: On; label: string; href: string; badge?: number }[] = [
    { key: "shifts", label: "My Shifts", href: shiftsHref },
    { key: "availability", label: "Availability", href: "/carer/availability" },
    { key: "chats", label: "Chats", href: "/carer/chats", badge: unread },
    { key: "documents", label: "Documents", href: "/carer/documents", badge: docs },
    { key: "policies", label: "Policies", href: "/carer/policies" },
  ];
  return (
    <>
      <ViewAsBar />
      <aside className="side">
        <span className="wordmark small">knightingale</span>
        <span className="side-hello">Hi {name.split(" ")[0]}</span>
        <nav>
          {items.map((i) => (
            <Link key={i.key} href={i.href} className={`side-btn ${on === i.key ? "on" : ""}`}>
              {i.label}{i.badge ? <span className="badge">{i.badge}</span> : null}
            </Link>
          ))}
        </nav>
        <form action={signOutAction}><button className="side-out">Logout</button></form>
      </aside>
    </>
  );
}
