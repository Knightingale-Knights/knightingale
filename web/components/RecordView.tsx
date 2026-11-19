import { fileHref } from "@/lib/files";
import { melbDate, type Options, type Section } from "@/lib/forms/fields";

const dmy = (v: unknown) => { const d = melbDate(v); return d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : ""; };

/** A filled-in form shown read-only (for support coordinators). Empty answers are left out. */
export function RecordView({ sections, values, options }: { sections: Section[]; values: Record<string, unknown>; options?: Options }) {
  return (
    <>
      {sections.map((s) => (
        <section key={s.title} className="doc-view">
          <h2>{s.title}</h2>
          {s.note && <p className="hint">{s.note}</p>}
          <dl>
            {s.fields.map((f) => {
              const v = values[f.col];
              if (f.kind === "check") return <div key={f.col} className="doc-check"><span aria-hidden>{v ? "☑" : "☐"}</span><span>{f.label}</span></div>;
              if (v == null || v === "" || (Array.isArray(v) && !v.length)) return null;
              let shown: React.ReactNode;
              switch (f.kind) {
                case "signature": shown = <img className="doc-sig" src={fileHref(String(v))} alt={f.label} />; break;
                case "date": shown = dmy(v); break;
                case "address": shown = (v as { address?: string }).address ?? ""; break;
                case "choice": shown = options?.[f.set]?.find((o) => o.value === v)?.display ?? String(v); break;
                case "multi": shown = (v as string[]).map((x) => options?.[f.set]?.find((o) => o.value === x)?.display ?? x).join(", "); break;
                default: shown = String(v);
              }
              return <div key={f.col}><dt>{f.label}</dt><dd>{shown}</dd></div>;
            })}
          </dl>
        </section>
      ))}
    </>
  );
}
