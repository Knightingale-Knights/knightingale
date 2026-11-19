import { SignaturePad } from "@/components/SignaturePad";
import { TagsField } from "@/components/TagsField";
import { fileHref } from "@/lib/files";
import { melbDate, type Options, type Section } from "@/lib/forms/fields";

/** Renders form sections with the record's current values. */
export function RecordFields({ sections, values, options, planManagers }: {
  sections: Section[]; values: Record<string, unknown>; options: Options; planManagers?: { id: string; name: string }[];
}) {
  return (
    <>
      {sections.map((s) => (
        <fieldset key={s.title} className="form-section">
          <legend>{s.title}</legend>
          {s.note && <p className="hint">{s.note}</p>}
          <div className="form-grid">
            {s.fields.map((f) => {
              const v = values[f.col];
              const str = v == null ? "" : String(v);
              switch (f.kind) {
                case "area":
                  return <label key={f.col} className="wide">{f.label}<textarea name={f.col} rows={2} defaultValue={str} /></label>;
                case "text":
                  return <label key={f.col}>{f.label}<input name={f.col} defaultValue={str} /></label>;
                case "yesno":
                case "fixed": {
                  const opts: string[] = "options" in f ? f.options : ["Yes", "No"];
                  return (
                    <label key={f.col}>{f.label}
                      <select name={f.col} defaultValue={str}>
                        <option value="">Choose…</option>
                        {str && !opts.includes(str) && <option value={str}>{str}</option>}
                        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </label>
                  );
                }
                case "choice":
                  return (
                    <label key={f.col}>{f.label}
                      <select name={f.col} defaultValue={str}>
                        <option value="">Choose…</option>
                        {(options[f.set] ?? []).map((o) => <option key={o.value} value={o.value}>{o.display}</option>)}
                      </select>
                    </label>
                  );
                case "show":
                  return (
                    <div key={f.col} className={f.wide === false ? "half show-field" : "wide show-field"}>
                      <span className="label">{f.label}</span>
                      {!str ? <span className="show-empty">Not given</span>
                        : f.img ? <img className="doc-sig" src={fileHref(str)} alt={f.label} />
                        : <span className="show-value">{str}</span>}
                    </div>
                  );
                case "multi": {
                  const on = new Set((v as string[] | null) ?? []);
                  if (f.compact) return <TagsField key={f.col} name={f.col} label={f.label} options={options[f.set] ?? []} initial={[...on]} />;
                  return (
                    <fieldset key={f.col} className="chips wide">
                      <legend>{f.label}</legend>
                      {(options[f.set] ?? []).map((o) => (
                        <label key={o.value} className="chip">
                          <input type="checkbox" name={f.col} value={o.value} defaultChecked={on.has(o.value)} />{o.display}
                        </label>
                      ))}
                    </fieldset>
                  );
                }
                case "check":
                  return <label key={f.col} className="check"><input type="checkbox" name={f.col} defaultChecked={Boolean(v)} />{f.label}</label>;
                case "address":
                  return <label key={f.col} className="wide">{f.label}<input name={f.col} defaultValue={(v as { address?: string } | null)?.address ?? ""} /></label>;
                case "date":
                  return <label key={f.col}>{f.label}<input type="date" name={f.col} defaultValue={melbDate(v)} /></label>;
                case "planManager":
                  return (
                    <label key={f.col}>{f.label}
                      <select name={f.col} defaultValue={str}>
                        <option value="">Choose…</option>
                        {(planManagers ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </label>
                  );
                case "signature":
                  return (
                    <div key={f.col} className="wide sig-field">
                      <span className="label">{f.label}</span>
                      <SignaturePad name={f.col} current={str ? fileHref(str) : null} />
                    </div>
                  );
              }
            })}
          </div>
        </fieldset>
      ))}
    </>
  );
}
