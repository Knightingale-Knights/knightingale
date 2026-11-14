import Link from "next/link";
import { signOutAction } from "@/app/invoicing/actions";
import { currentUser } from "@/lib/auth";
import { unreadTotal } from "@/lib/chats/data";

export async function CarerNav({ on, name }: { on: "shifts" | "availability" | "chats"; name: string }) {
  const me = await currentUser();
  const unread = me ? await unreadTotal(me) : 0;
  return (
    <header className="carer-top">
      <span className="wordmark small">knightingale</span>
      <span className="hello">Hi {name.split(" ")[0]}</span>
      <nav>
        <Link href="/carer" className={on === "shifts" ? "on" : ""}>My shifts</Link>
        <Link href="/carer/availability" className={on === "availability" ? "on" : ""}>Availability</Link>
        <Link href="/carer/chats" className={on === "chats" ? "on" : ""}>Chats{unread > 0 && <span className="badge">{unread}</span>}</Link>
        <form action={signOutAction}><button className="link">Sign out</button></form>
      </nav>
    </header>
  );
}
