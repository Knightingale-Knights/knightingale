import { requireCarer } from "@/lib/auth";
import { CarerNav } from "../CarerNav";
import { StatsBody } from "./StatsBody";

export const dynamic = "force-dynamic";

/** The carer's own dashboard: what they've earned, worked and achieved with us. */
export default async function Stats() {
  const me = await requireCarer();
  return (
    <div className="carer with-side">
      <CarerNav on="stats" name={me.name} />
      <main className="carer-main stats">
        <h1>My Stats</h1>
        <p className="hint">Your time with Knightingale, in numbers.</p>
        <StatsBody carer={me.id} />
      </main>
    </div>
  );
}
