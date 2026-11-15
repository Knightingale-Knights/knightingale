// The public website's page content. Text may use Bubble's formatting tags ([b], [i], [u], [color=..], [size=..], [url=..]).
export type Cta = { text: string; href: string }[] | null;
export type Item = { kicker?: string | null; title: string; body: string[]; image?: string | null };

export type Section =
  | { kind: "hero"; eyebrow: string | null; title: string | null; body: string[]; image: string | null; cta: Cta }
  | { kind: "text"; eyebrow: string | null; title: string | null; body: string[]; cta: Cta }
  | { kind: "split"; eyebrow: string | null; title: string | null; body: string[]; image: string; side: "left" | "right"; cta: Cta }
  | { kind: "cards"; eyebrow: string | null; title: string | null; intro: string[]; numbered: boolean; items: Item[]; cta: Cta }
  | { kind: "steps"; eyebrow: string | null; title: string | null; steps: string[]; cta: Cta }
  | { kind: "logos"; title: string | null; images: string[] }
  | { kind: "statement"; eyebrow: string | null; title: string | null; body: string[]; stat: string }
  | { kind: "weare"; eyebrow: string | null; title: string | null; yes: string[]; noTitle: string | null; no: string[] }
  | { kind: "faq"; title: string | null; items: { q: string; a: string }[] }
  | { kind: "cta"; eyebrow: string | null; title: string | null; cta: Cta }
  | { kind: "stats"; eyebrow: string | null; title: string | null; body: string[]; stats: { value: string; label: string }[]; image: string | null; cta: Cta }
  | { kind: "pricing"; eyebrow: string | null; title: string | null; intro: string[]; rows: { label: string; logo: string | null; price: string; note: string | null; ours?: boolean }[]; footnote: string | null }
  | { kind: "contact"; title: string | null; body: string[]; lines: { label: string; value: string; href?: string }[]; image: string | null }
  | { kind: "legal"; title: string; text: string };

export type Page = { title: string | null; description: string | null; sections: Section[] };
