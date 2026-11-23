"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Search box: after 2 letters a dropdown lists the matching carers; picking one opens their compliance page. */
export function CarerSearch({ carers, q, show }: { carers: { id: string; name: string; roles: string | null }[]; q: string; show: string }) {
  const router = useRouter();
  const [v, setV] = useState(q);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const t = v.trim().toLowerCase();
  const hits = t.length >= 2 ? carers.filter((c) => c.name.toLowerCase().includes(t)).slice(0, 10) : [];
  const go = (id: string) => { setOpen(false); router.push(`/compliance/${id}`); };
  return (
    <form className="search">
      <input type="hidden" name="show" value={show} />
      <div className="search-select">
        <input
          type="text" name="q" value={v} placeholder="Search carers" autoComplete="off"
          onChange={(e) => { setV(e.target.value); setOpen(true); setHi(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open || !hits.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, hits.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); go(hits[hi].id); }
          }}
        />
        {open && t.length >= 2 && (
          <ul className="search-select-list">
            {hits.length ? hits.map((c, i) => (
              <li key={c.id} className={i === hi ? "hi" : ""} onMouseDown={(e) => { e.preventDefault(); go(c.id); }}>
                {c.name}{c.roles && <span>{c.roles}</span>}
              </li>
            )) : <li className="none">No carers match</li>}
          </ul>
        )}
      </div>
      <button className="secondary">Search</button>
    </form>
  );
}
