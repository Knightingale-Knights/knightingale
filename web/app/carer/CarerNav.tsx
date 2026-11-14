import Link from "next/link";
import { signOutAction } from "@/app/invoicing/actions";
import { currentUser } from "@/lib/auth";
import { unreadTotal } from "@/lib/chats/data";
import { attentionCount } from "@/lib/compliance/data";
import { isoDate } from "@/lib/invoicing/rules";

export async function CarerNav({ on, name }: { on: "shifts" | "availability" | "chats" | "documents"; name: string }) {
  const me = await currentUser();
  const [unread, docs] = me ? await Promise.all([unreadTotal(me), attentionCount(me.id, isoDate(new Date()))]) : [0, 0];
  return (
    <header className="carer-top">
      <span className="wordmark small">knightingale</span>
      <span className="hello">Hi {name.split(" ")[0]}</span>
      <nav>
        <Link href="/carer" className={on === "shifts" ? "on" : ""}>My shifts</Link>
        <Link href="/carer/availability" className={on === "availability" ? "on" : ""}>Availability</Link>
        <Link href="/carer/chats" className={on === "chats" ? "on" : ""}>Chats{unread > 0 && <span className="badge">{unread}</span>}</Link>
        <Link href="/carer/documents" className={on === "documents" ? "on" : ""}>Documents{docs > 0 && <span className="badge">{docs}</span>}</Link>
        <form action={signOutAction}><button className="link">Sign out</button></form>
      </nav>
    </header>
  );
}
