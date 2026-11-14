import Link from "next/link";
import { signOutAction } from "@/app/invoicing/actions";

const SECTIONS = [
  ["/roster", "Roster"],
  ["/invoicing", "Invoicing"],
] as const;

export function TopBar({ section, email, children }: { section: string; email: string; children?: React.ReactNode }) {
  return (
    <header className="top">
      <span className="wordmark small">knightingale</span>
      <nav className="sections">
        {SECTIONS.map(([href, label]) => (
          <Link key={href} href={href} className={href === section ? "on" : ""}>{label}</Link>
        ))}
      </nav>
      <nav className="tabs">{children}</nav>
      <form action={signOutAction}>
        <button className="link" title={email}>Sign out</button>
      </form>
    </header>
  );
}
