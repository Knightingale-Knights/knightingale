import Link from "next/link";
import { signOutAction } from "@/app/invoicing/actions";
import { currentUser } from "@/lib/auth";
import { unreadTotal } from "@/lib/chats/data";

// Admin sidebar. Items with no href are not built yet and show greyed out.
const MENU: { label: string; href?: string; section?: string }[] = [
  { label: "Shifts", href: "/roster", section: "/roster" },
  { label: "Carers", href: "/availability", section: "/carers" },
  { label: "Applicants", href: "/applicants", section: "/applicants" },
  { label: "Create Shift", href: "/roster?new=ndis" },
  { label: "Create Event", href: "/roster?event=new" },
  { label: "Ask Klarra" },
  { label: "Participants", href: "/participants", section: "/participants" },
  { label: "Invoicing", href: "/invoicing", section: "/invoicing" },
  { label: "Map" },
  { label: "Timesheets" },
  { label: "Group Chats", href: "/chats", section: "/chats" },
  { label: "Metrics" },
  { label: "Guru Email" },
  { label: "Delete" },
];

export async function TopBar({ section, email, children }: { section: string; email: string; children?: React.ReactNode }) {
  const me = await currentUser();
  const unread = me ? await unreadTotal(me) : 0;
  return (
    <>
      <aside className="side">
        <span className="wordmark small">knightingale</span>
        <nav>
          {MENU.map((m) =>
            m.href ? (
              <Link key={m.label} href={m.href} className={`side-btn ${m.section === section ? "on" : ""}`}>
                {m.label}
                {m.section === "/chats" && unread > 0 && <span className="badge">{unread}</span>}
              </Link>
            ) : (
              <span key={m.label} className="side-btn off" title="Not built yet">{m.label}</span>
            ),
          )}
        </nav>
        <form action={signOutAction}>
          <button className="side-out" title={email}>Logout</button>
        </form>
      </aside>
      {children && (
        <header className="top">
          <nav className="tabs">{children}</nav>
        </header>
      )}
    </>
  );
}
