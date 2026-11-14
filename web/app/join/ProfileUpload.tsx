"use client";
import { useRef, useState } from "react";
import { shrink } from "@/app/carer/extras";
import { profileUploadAction, type UploadResult } from "./actions";

export function ProfileUpload({ kind, label, accept, current }: { kind: "photo" | "resume" | "ndis_induction"; label: string; accept: string; current: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const upload = async () => {
    const f = input.current?.files?.[0];
    if (!f) return;
    setBusy(true);
    setResult(null);
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("file", await shrink(f));
    const r = await profileUploadAction(fd).catch(() => ({ ok: false, message: "Upload failed. Please try again." }));
    setResult(r);
    setBusy(false);
    if (r.ok) window.location.reload();
  };
  return (
    <div className="check">
      {kind === "photo" && current && <img src={current} alt="Your profile photo" className="avatar" />}
      {kind !== "photo" && current && <p><a href={current} target="_blank" rel="noreferrer">View your upload</a></p>}
      <label className="upload">
        <input ref={input} type="file" accept={accept} capture={kind === "photo" ? "user" : undefined} onChange={upload} disabled={busy} hidden />
        <span className="button">{busy ? "Uploading…" : current ? `Replace ${label.toLowerCase()}` : label}</span>
      </label>
      {result && <p className={`banner ${result.ok ? "ok" : "error"}`}>{result.message}</p>}
    </div>
  );
}
