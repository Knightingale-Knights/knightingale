// Company policies and guides carers can read. The PDFs live in public/docs/policies (no participant data in them).
export type Policy = { slug: string; title: string; blurb: string };

export const POLICIES: Policy[] = [
  { slug: "shift-policy", title: "Shift Policy", blurb: "What we expect before, during and after every shift." },
  { slug: "incident-management-policy", title: "Incident Management Policy", blurb: "How to report, record and respond to incidents." },
  { slug: "progress-note-guide", title: "Progress Note Guide", blurb: "How to write a note that passes review the first time." },
];

export const policyHref = (slug: string) => `/docs/policies/${slug}.pdf`;
