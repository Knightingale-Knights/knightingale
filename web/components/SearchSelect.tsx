"use client";
import { useId, useMemo, useRef, useState } from "react";

export type SearchOption = { id: string; name: string; note?: string };

/** A type-to-search picker (like an address search): matches show in a list under the box; choosing one fills it.
 *  Posts the chosen id under `name`. */
export function SearchSelect({
  name, options, defaultId, defaultLabel, placeholder, required, emptyLabel,
}: {
  name: string; options: SearchOption[]; defaultId?: string | null; defaultLabel?: string | null;
  placeholder?: string; required?: boolean; emptyLabel?: string;
}) {
  const start = options.find((o) => o.id === defaultId);
  const [id, setId] = useState(defaultId ?? "");
  const [text, setText] = useState(start?.name ?? (defaultId ? defaultLabel ?? "" : ""));
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const found = words.length && !options.some((o) => o.id === id && o.name.toLowerCase() === q)
      ? options.filter((o) => words.every((w) => o.name.toLowerCase().includes(w)))
      : options;
    return found.slice(0, 60); // the list scrolls; 12 hid sites like Ron Conn further down the alphabet
  }, [text, options, id]);

  const choose = (o: SearchOption | null) => {
    setId(o?.id ?? "");
    setText(o?.name ?? "");
    setOpen(false);
    input.current?.setCustomValidity("");
  };

  return (
    <div className="search-select">
      <input type="hidden" name={name} value={id} />
      <input
        ref={input}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        placeholder={placeholder ?? "Search…"}
        value={text}
        required={required}
        onChange={(e) => {
          setText(e.target.value);
          setId("");
          setOpen(true);
          setHi(0);
          if (required) e.target.setCustomValidity("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => {
          setOpen(false);
          // Typed text that wasn't chosen from the list doesn't count.
          if (!id && text) setText("");
        }, 150)}
        onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Choose one from the list.")}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, matches.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          else if (e.key === "Enter" && open && matches[hi]) { e.preventDefault(); choose(matches[hi]); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (
        <ul id={listId} role="listbox" className="search-select-list">
          {emptyLabel && (
            <li role="option" aria-selected={!id} onMouseDown={(e) => { e.preventDefault(); choose(null); }} className="muted">{emptyLabel}</li>
          )}
          {matches.map((o, i) => (
            <li
              key={o.id}
              role="option"
              aria-selected={o.id === id}
              className={i === hi ? "hi" : ""}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(o); }}
            >
              {o.name}{o.note && <span>{o.note}</span>}
            </li>
          ))}
          {!matches.length && <li className="none">No matches</li>}
        </ul>
      )}
    </div>
  );
}
