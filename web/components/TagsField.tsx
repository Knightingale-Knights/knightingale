"use client";
import { useState } from "react";

/** A multi-choice shown as tags (like Bubble's multi dropdown); tap to open the list and tick. */
export function TagsField({ name, label, options, initial }: {
  name: string; label: string; options: { value: string; display: string }[]; initial: string[];
}) {
  const [on, setOn] = useState(() => new Set(initial));
  const toggle = (v: string, yes: boolean) => setOn((s) => { const n = new Set(s); if (yes) n.add(v); else n.delete(v); return n; });
  const picked = options.filter((o) => on.has(o.value));
  return (
    <div className="wide tags-field">
      <span className="label">{label}</span>
      <details className="tags">
        <summary>{picked.length ? picked.map((o) => <span key={o.value} className="tag">{o.display}</span>) : <span className="tags-empty">Choose some options…</span>}</summary>
        <div className="tags-list">
          {options.map((o) => (
            <label key={o.value} className="check">
              <input type="checkbox" name={name} value={o.value} checked={on.has(o.value)} onChange={(e) => toggle(o.value, e.target.checked)} />{o.display}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
