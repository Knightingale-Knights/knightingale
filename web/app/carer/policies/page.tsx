import { requireCarer } from "@/lib/auth";
import { KLARRA_CHAT, POLICIES, hrefOf } from "@/lib/policies/list";
import { CarerNav } from "../CarerNav";

export default async function Policies() {
  const me = await requireCarer();
  return (
    <div className="carer">
      <CarerNav on="policies" name={me.name} />
      <main>
        <h1>Knightingale Policies</h1>
        <p className="hint">Please read each one. Questions? Ask Klarra.</p>
        <div className="policy-btns">
          <a className="policy-btn ask" href={KLARRA_CHAT}>Ask Klarra</a>
          {POLICIES.map((p) =>
            p.ready ? (
              <a key={p.slug} className={`policy-btn${p.featured ? " featured" : ""}`} href={hrefOf(p)} {...(p.href ? {} : { target: "_blank", rel: "noopener" })}>
                {p.title}
              </a>
            ) : (
              <span key={p.slug} className={`policy-btn soon${p.featured ? " featured" : ""}`} aria-disabled="true">
                {p.title}<small>Coming soon</small>
              </span>
            ),
          )}
        </div>
      </main>
    </div>
  );
}
