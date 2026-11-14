import Link from "next/link";
import { signOutAction } from "@/app/invoicing/actions";
import { currentUser } from "@/lib/auth";
import { unreadTotal } from "@/lib/chats/data";

const SECTIONS = [
  ["/roster", "Roster"],
  ["/invoicing", "Invoicing"],
  ["/chats", "Chats"],
] as const;

export async function TopBar({ section, email, children }: { section: string; email: string; children?: React.ReactNode }) {
  const me = await currentUser();
  const unread = me ? await unreadTotal(me) : 0;
  return (
    <header className="top">
      <span className="wordmark small">knightingale</span>
      <nav className="sections">
        {SECTIONS.map(([href, label]) => (
          <Link key={href} href={href} className={href === section ? "on" : ""}>
            {label}{href === "/chats" && unread > 0 && <span className="badge">{unread}</span>}
          </Link>
        ))}
      </nav>
      <nav className="tabs">{children}</nav>
      <form action={signOutAction}>
        <button className="link" title={email}>Sign out</button>
      </form>
    </header>
  );
}
