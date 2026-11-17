"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { receiptAction, type ReceiptResult } from "./actions";

/** An address box with suggestions from Google Places (fetched through our own server). */
export function AddressInput({ name, label, defaultValue, listId, onValue }: { name: string; label: string; defaultValue?: string; listId: string; onValue?: (v: string) => void }) {
  const [q, setQ] = useState(defaultValue ?? "");
  useEffect(() => { onValue?.(q); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    if (q.trim().length < 3 || options.includes(q)) return;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
        if (r.ok) setOptions(((await r.json()) as { suggestions: string[] }).suggestions);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <label>
      {label}
      <input name={name} value={q} onChange={(e) => setQ(e.target.value)} list={listId} autoComplete="off" required minLength={3} maxLength={300} />
      <datalist id={listId}>{options.map((o) => <option key={o} value={o} />)}</datalist>
    </label>
  );
}

/** Shrinks a phone photo to at most 1800px on its longest side (JPEG), so it uploads quickly. PDFs go as they are. */
export async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const img = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.82));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function ReceiptUpload({ shiftId }: { shiftId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const upload = async () => {
    const f = input.current?.files?.[0];
    if (!f) return;
    setBusy(true);
    setResult(null);
    const fd = new FormData();
    fd.set("id", shiftId);
    fd.set("file", await shrink(f));
    const r = await receiptAction(fd).catch(() => ({ ok: false, message: "Upload failed. Please try again." }));
    setResult(r);
    setBusy(false);
    if (input.current) input.current.value = "";
    if (r.ok) router.refresh();
  };
  return (
    <div className="check">
      <label className="upload">
        <input ref={input} type="file" accept="image/*,application/pdf" capture="environment" onChange={upload} disabled={busy} hidden />
        <span className="button big">{busy ? "Reading receipt…" : "Add a receipt"}</span>
      </label>
      {result && <p className={`banner ${result.ok ? "ok" : "error"}`}>{result.message}</p>}
    </div>
  );
}

/** Big drop zone for receipts: drop files or tap to choose. Uploads one by one and reads each total. */
export function ReceiptDrop({ shiftId }: { shiftId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<ReceiptResult[]>([]);
  const send = async (files: File[]) => {
    if (!files.length) return;
    const out: ReceiptResult[] = [];
    for (const [i, f] of files.entries()) {
      setBusy(files.length > 1 ? `Reading receipt ${i + 1} of ${files.length}…` : "Reading receipt…");
      const fd = new FormData();
      fd.set("id", shiftId);
      fd.set("file", await shrink(f));
      out.push(await receiptAction(fd).catch(() => ({ ok: false, message: `${f.name}: upload failed. Please try again.` })));
      setResults([...out]);
    }
    setBusy(null);
    if (input.current) input.current.value = "";
    if (out.some((r) => r.ok)) router.refresh();
  };
  return (
    <div className="receipt-drop-wrap">
      <label
        className={`receipt-drop ${over ? "over" : ""} ${busy ? "busy" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!busy) send(Array.from(e.dataTransfer.files)); }}
      >
        <input ref={input} type="file" accept="image/*,application/pdf" multiple hidden disabled={!!busy} onChange={(e) => send(Array.from(e.target.files ?? []))} />
        <span>{busy ?? "Drop receipts or browse files"}</span>
      </label>
      {results.map((r, i) => <p key={i} className={`banner ${r.ok ? "ok" : "error"}`}>{r.message}</p>)}
    </div>
  );
}
