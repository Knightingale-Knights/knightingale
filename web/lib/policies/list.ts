// Knightingale Policies: the documents carers read. PDFs live in public/docs/policies (no participant data in them).
// A policy without `ready` shows as "Coming soon" until its PDF is added.
export type Policy = { slug: string; title: string; ready?: boolean; featured?: boolean; href?: string };

export const POLICIES: Policy[] = [
  { slug: "culture-of-care", title: "Culture of Care", featured: true },
  { slug: "emergency-policy", title: "Emergency Policy", ready: true },
  { slug: "employment-contract", title: "Employment Contract", ready: true, href: "/carer/contract" },
  { slug: "first-shift", title: "Your First Shift", ready: true },
  { slug: "handbook", title: "Handbook", ready: true },
  { slug: "hr-policy", title: "HR Policy", ready: true },
  { slug: "incident-management-policy", title: "Incident Report Policy", ready: true },
  { slug: "progress-note-guide", title: "Progress Notes Guide", ready: true },
  { slug: "shift-policy", title: "Shift Policy", ready: true },
  { slug: "casual-employment-information-statement", title: "Casual Employment Information Statement", ready: true },
];

export const policyHref = (slug: string) => `/docs/policies/${slug}.pdf`;
export const hrefOf = (p: Policy) => p.href ?? policyHref(p.slug);

/** Klarra, the carer help desk, answers by text. */
export const KLARRA_SMS = "sms:+61483931556";
