import { requireCarer } from "@/lib/auth";
import { POLICIES, policyHref } from "@/lib/policies/list";
import { CarerNav } from "../CarerNav";

export default async function Policies() {
  const me = await requireCarer();
  return (
    <div className="carer">
      <CarerNav on="policies" name={me.name} />
      <main>
        <h1>Policies</h1>
        <p className="hint">Please read each one. Tap to open.</p>
        <ul className="policy-list">
          {POLICIES.map((p) => (
            <li key={p.slug}>
              <a href={policyHref(p.slug)} target="_blank" rel="noopener">
                <span className="policy-title">{p.title}</span>
                <span className="policy-blurb">{p.blurb}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
