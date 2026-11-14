import { fileHref, STATUS_LABEL } from "@/lib/compliance/docs";
import type { DocState } from "@/lib/compliance/data";
import { auDate } from "@/lib/invoicing/rules";
import { detailsAction } from "./actions";
import { DocUpload } from "./DocUpload";

/** The list of documents with status, files, details and upload. Used by carers and by the office. */
export function DocList({ docs, carer, admin, back }: { docs: DocState[]; carer?: string; admin?: boolean; back?: string }) {
  return (
    <div className="docs">
      {docs.map(({ def, status, files, expiry, number }) => (
        <section key={def.key} id={def.key} className={`block doc ${status}`}>
          <div className="doc-head">
            <h2>{def.label}</h2>
            <span className={`pill ${status}`}>{STATUS_LABEL[status]}</span>
          </div>
          <p className="hint">{def.hint}</p>
          {expiry && <p>Expires {auDate(expiry)}</p>}
          {files.length > 0 && (
            <p className="files">
              {files.slice(-3).map((f, i) => (
                <a key={f} href={fileHref(f)} target="_blank" rel="noreferrer">View{files.length > 1 ? ` ${Math.max(files.length - 3, 0) + i + 1}` : ""}</a>
              ))}
            </p>
          )}
          {(def.numberCol || (def.expiryCol && (!def.uploadCol || admin))) && (
            <form action={detailsAction} className="pair end">
              {carer && <input type="hidden" name="carer" value={carer} />}
              <input type="hidden" name="doc" value={def.key} />
              {back && <input type="hidden" name="back" value={back} />}
              {def.numberCol && <label>{def.numberLabel}<input name="number" defaultValue={number ?? ""} maxLength={60} /></label>}
              {def.expiryCol && (!def.uploadCol || admin) && <label>Expiry<input type="date" name="expiry" defaultValue={expiry ?? ""} /></label>}
              <button className="secondary">Save</button>
            </form>
          )}
          {def.uploadCol && <DocUpload doc={def.key} carer={carer} label={files.length ? "Upload a new one" : "Upload"} />}
        </section>
      ))}
    </div>
  );
}
