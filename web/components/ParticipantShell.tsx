import Link from "next/link";
import { TopBar } from "@/components/TopBar";

/** The frame for an admin participant page: top bar with a link back to the participant, title and banners. */
export function ParticipantShell({ id, name, email, title, lede, msg, error, wide, children }: {
  id: string; name: string; email: string; title: string; lede?: string; msg?: string; error?: string; wide?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <TopBar section="/participants" email={email}>
        <Link href={`/participants/${id}`}>← {name}</Link>
      </TopBar>
      <main className={wide ? "form-page" : "form-page list-doc"}>
        <Link href={`/participants/${id}`} className="sheet-close" aria-label="Close" title="Back to the participant">×</Link>
        <h1>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
        {msg && <p className="banner ok">{msg}</p>}
        {error && <p className="banner error">{error}</p>}
        {children}
      </main>
    </div>
  );
}
