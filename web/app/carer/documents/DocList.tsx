import { fileHref, STATUS_LABEL } from "@/lib/compliance/docs";
import type { DocState } from "@/lib/compliance/data";
import { auDate } from "@/lib/invoicing/rules";
import { detailsAction, removeDocAction } from "./actions";
import { DocUpload } from "./DocUpload";

/** The list of documents with status, files, details and upload. Used by carers and by the office. */
export function DocList({ docs, carer, admin, back }: { docs: DocState[]; carer?: string; admin?: boolean; back?: string }) {
  return (
    <div className="docs">
      {[...docs].sort((x, y) => x.def.label.localeCompare(y.def.label)).map(({ def, status, files, expiry, number }) => (
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
          {(def.numberCol || (def.expiryCol && admin)) && (
            <form action={detailsAction} className="pair end">
              {carer && <input type="hidden" name="carer" value={carer} />}
              <input type="hidden" name="doc" value={def.key} />
              {back && <input type="hidden" name="back" value={back} />}
              {def.numberCol && <label>{def.numberLabel}<input name="number" defaultValue={number ?? ""} maxLength={60} /></label>}
              {def.expiryCol && admin && <label>Expiry<input type="date" name="expiry" defaultValue={expiry ?? ""} /></label>}
              <button className="secondary">Save</button>
            </form>
          )}
          {def.uploadCol && <DocUpload doc={def.key} carer={carer} label={files.length ? "Upload a new one" : "Upload"} />}
          {admin && carer && def.uploadCol && files.length > 0 && (
            <details className="confirm">
              <summary>Remove</summary>
              <form action={removeDocAction}>
                <input type="hidden" name="carer" value={carer} />
                <input type="hidden" name="doc" value={def.key} />
                <p className="hint">The file is deleted for good. This shows as Missing and they&apos;ll be asked to upload it again.</p>
                <button className="link danger">Confirm remove {def.label}</button>
              </form>
            </details>
          )}
        </section>
      ))}
    </div>
  );
}
