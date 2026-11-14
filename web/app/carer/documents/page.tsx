import { requireCarer } from "@/lib/auth";
import { carerDocs } from "@/lib/compliance/data";
import { isoDate } from "@/lib/invoicing/rules";
import { CarerNav } from "../CarerNav";
import { DocList } from "./DocList";

export const dynamic = "force-dynamic";

export default async function Documents({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const me = await requireCarer();
  const sp = await searchParams;
  const docs = await carerDocs(me.id, isoDate(new Date()));
  const due = docs.filter((d) => d.status === "expired" || d.status === "soon" || d.status === "missing").length;
  return (
    <div className="carer">
      <CarerNav on="documents" name={me.name} />
      <main>
        <h1>My documents</h1>
        <p className="hint">{due ? `${due} ${due === 1 ? "document needs" : "documents need"} your attention.` : "Everything is up to date. Thank you!"}</p>
        {sp.error && <p className="banner error">{sp.error}</p>}
        {sp.saved && <p className="banner ok">Saved.</p>}
        <DocList docs={docs} />
      </main>
    </div>
  );
}
