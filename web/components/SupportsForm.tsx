"use client";
import { useState } from "react";

type Item = { id: string; item_no: string | null; item_name: string | null; item_price: number | null };
type Support = { id: string; ndis_pricing: string | null; hours: number | null };

const money = (n: number) => n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
const WORDS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

function Row({ k, n, items, s }: { k: string; n: number; items: Item[]; s?: Support }) {
  const [item, setItem] = useState(s?.ndis_pricing ?? "");
  const [hours, setHours] = useState(s?.hours != null ? String(s.hours) : "");
  const p = items.find((x) => x.id === item);
  const total = (p?.item_price ?? 0) * (Number(hours) || 0);
  return (
    <div className="form-grid support-row">
      <label className="wide">{s ? `Support ${WORDS[n - 1] ?? n}` : "Add Support"}
        <select name={`sup_${k}_item`} value={item} onChange={(e) => setItem(e.target.value)}>
          <option value="">Please choose a support...</option>
          {items.map((x) => <option key={x.id} value={x.id}>{(x.item_name ?? "").replace(/\s+/g, " ")}</option>)}
        </select>
      </label>
      <div className="half show-field"><span className="label">Support Item No#:</span><span className="show-value">{p?.item_no ?? ""}</span></div>
      <div className="half show-field"><span className="label">Hourly Rate:</span><span className="show-value">{p?.item_price != null ? money(p.item_price) : ""}</span></div>
      <div className="wide show-field"><span className="label">Support Item Name:</span><span className="show-value">{(p?.item_name ?? "").replace(/\s+/g, " ")}</span></div>
      <label className="half">Hours:<input name={`sup_${k}_hours`} inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} /></label>
      <div className="half show-field"><span className="label">Annual Total:</span><span className="show-value">{money(total)}</span></div>
      {s && <label className="wide check"><input type="checkbox" name={`sup_${k}_delete`} />Delete this support</label>}
    </div>
  );
}

/** The Schedule of Supports on the Service Agreement: each support with its live annual total, then a blank one to add. */
export function SupportsForm({ items, supports }: { items: Item[]; supports: Support[] }) {
  return (
    <fieldset className="form-section">
      <legend>Schedule of Supports</legend>
      {supports.map((s, i) => <Row key={s.id} k={s.id} n={i + 1} items={items} s={s} />)}
      <Row k="new" n={supports.length + 1} items={items} />
    </fieldset>
  );
}
