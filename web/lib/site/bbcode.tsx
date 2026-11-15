// Renders Bubble's text formatting tags as React (no raw HTML, so nothing can be injected).
import { Fragment, type ReactNode } from "react";

type Node = { tag: string | null; arg: string | null; children: (Node | string)[] };
const TAGS = new Set(["b", "i", "u", "s", "color", "size", "url", "font", "highlight"]);

function parse(src: string): Node {
  const root: Node = { tag: null, arg: null, children: [] };
  const stack: Node[] = [root];
  const re = /\[(\/?)([a-z]+)(?:=([^\]]*))?\]/gi;
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    const [whole, close, name, arg] = m;
    const tag = name.toLowerCase();
    if (!TAGS.has(tag)) continue;
    if (m.index > last) stack[stack.length - 1].children.push(src.slice(last, m.index));
    last = m.index + whole.length;
    if (close) {
      const i = stack.map((n) => n.tag).lastIndexOf(tag);
      if (i > 0) stack.length = i;
    } else {
      const n: Node = { tag, arg: arg?.trim() ?? null, children: [] };
      stack[stack.length - 1].children.push(n);
      stack.push(n);
    }
  }
  if (last < src.length) stack[stack.length - 1].children.push(src.slice(last));
  return root;
}

const safeColor = (c: string | null) => (c && /^#[0-9a-f]{3,8}$|^rgba?\([\d\s.,]+\)$/i.test(c.replace(/\s+/g, "")) ? c.replace(/\s+/g, "") : undefined);
const safeUrl = (u: string | null) => (u && /^(https?:|mailto:|tel:|\/)/i.test(u) ? u : undefined);

function lines(text: string, key: string): ReactNode[] {
  return text.split("\n").flatMap((l, i) => (i ? [<br key={`${key}-${i}`} />, l] : [l]));
}

function render(n: Node | string, key: string): ReactNode {
  if (typeof n === "string") return <Fragment key={key}>{lines(n, key)}</Fragment>;
  const kids = n.children.map((c, i) => render(c, `${key}.${i}`));
  switch (n.tag) {
    case "b": return <strong key={key}>{kids}</strong>;
    case "i": return <em key={key}>{kids}</em>;
    case "u": return <u key={key}>{kids}</u>;
    case "s": return <s key={key}>{kids}</s>;
    case "color": return <span key={key} className="tint" style={{ color: safeColor(n.arg) }}>{kids}</span>;
    case "size": return <span key={key} className="big-number">{kids}</span>;
    case "url": {
      const href = safeUrl(n.arg) ?? safeUrl(typeof n.children[0] === "string" ? n.children[0] : null);
      return href ? <a key={key} href={href}>{kids}</a> : <Fragment key={key}>{kids}</Fragment>;
    }
    default: return <Fragment key={key}>{kids}</Fragment>;
  }
}

/** Inline text (headings, labels). */
export function Rich({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  return <>{render(parse(text.trim()), "r")}</>;
}

/** Body text: blank lines become paragraphs, lines starting with • become lists. */
export function Prose({ text }: { text: string }) {
  // Bubble often wrote lists on one line ("• A • B • C"): put each item on its own line.
  const blocks = text.trim().replace(/\s*•\s*$/gm, "").replace(/([^\n])\s+•\s+/g, "$1\n• ").split(/\n\s*\n/);
  return (
    <>
      {blocks.map((b, i) => {
        const ls = b.split("\n").map((l) => l.trim()).filter(Boolean);
        if (ls.length && ls.every((l) => l.startsWith("•"))) {
          return <ul key={i}>{ls.map((l, j) => <li key={j}><Rich text={l.replace(/^•\s*/, "")} /></li>)}</ul>;
        }
        const bullets = ls.findIndex((l) => l.startsWith("•"));
        if (bullets > 0 && ls.slice(bullets).every((l) => l.startsWith("•"))) {
          return (
            <Fragment key={i}>
              <p><Rich text={ls.slice(0, bullets).join("\n")} /></p>
              <ul>{ls.slice(bullets).map((l, j) => <li key={j}><Rich text={l.replace(/^•\s*/, "")} /></li>)}</ul>
            </Fragment>
          );
        }
        return <p key={i}><Rich text={b} /></p>;
      })}
    </>
  );
}
