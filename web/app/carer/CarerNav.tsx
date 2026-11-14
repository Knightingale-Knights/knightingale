import Link from "next/link";
import { signOutAction } from "@/app/invoicing/actions";

export function CarerNav({ on, name }: { on: "shifts" | "availability"; name: string }) {
  return (
    <header className="carer-top">
      <span className="wordmark small">knightingale</span>
      <span className="hello">Hi {name.split(" ")[0]}</span>
      <nav>
        <Link href="/carer" className={on === "shifts" ? "on" : ""}>My shifts</Link>
        <Link href="/carer/availability" className={on === "availability" ? "on" : ""}>Availability</Link>
        <form action={signOutAction}><button className="link">Sign out</button></form>
      </nav>
    </header>
  );
}
