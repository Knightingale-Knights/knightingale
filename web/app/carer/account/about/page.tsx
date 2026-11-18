import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { aboutOf } from "@/lib/account/about";
import { CarerNav } from "../../CarerNav";
import { AboutSteps } from "./AboutSteps";

export const dynamic = "force-dynamic";

export default async function AboutYou({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requireCarer();
  const sp = await searchParams;
  const about = await aboutOf(me.id);
  return (
    <div className="carer">
      <CarerNav on="account" name={me.name} />
      <main>
        <Link className="back" href="/carer/account/personal">&larr; Your Details</Link>
        <h1>About You</h1>
        <AboutSteps initial={about} error={sp.error} />
      </main>
    </div>
  );
}
