"use client";
import { useRef, useState } from "react";
import { shrink } from "@/app/carer/extras";
import { uploadDocAction, type DocResult } from "./actions";

export function DocUpload({ doc, carer, label }: { doc: string; carer?: string; label: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DocResult | null>(null);
  const upload = async () => {
    const f = input.current?.files?.[0];
    if (!f) return;
    setBusy(true);
    setResult(null);
    const fd = new FormData();
    fd.set("doc", doc);
    if (carer) fd.set("carer", carer);
    fd.set("file", await shrink(f));
    const r = await uploadDocAction(fd).catch(() => ({ ok: false, message: "Upload failed. Please try again." }));
    setResult(r);
    setBusy(false);
    if (input.current) input.current.value = "";
  };
  return (
    <div className="check">
      <label className="upload">
        <input ref={input} type="file" accept="image/*,application/pdf" onChange={upload} disabled={busy} hidden />
        <span className="button">{busy ? "Checking…" : label}</span>
      </label>
      {result && <p className={`banner ${result.ok ? "ok" : "warn"}`}>{result.message}</p>}
    </div>
  );
}
