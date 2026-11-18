// The carer Account page: one row per section, like Bubble's account page.
import type { DocKey } from "@/lib/compliance/docs";

export type Section =
  | { key: string; label: string; kind: "docs"; docs: DocKey[] }
  | { key: string; label: string; kind: "link"; href: string; external?: boolean }
  | { key: string; label: string; kind: "soon" };

export const SECTIONS: Section[] = [
  { key: "personal", label: "Personal Details", kind: "link", href: "/carer/account/personal" },
  { key: "availability", label: "Availability", kind: "link", href: "/carer/availability" },
  { key: "bank", label: "Bank Details", kind: "soon" },
  { key: "certifications", label: "Certifications", kind: "docs", docs: ["cpr", "first_aid"] },
  { key: "contract", label: "Employment Contract", kind: "link", href: "/carer/contract" },
  { key: "handbook", label: "Handbook", kind: "link", href: "/docs/policies/handbook.pdf", external: true },
  { key: "id", label: "I.D", kind: "docs", docs: ["id"] },
  { key: "insurance", label: "Insurance", kind: "soon" },
  { key: "checks", label: "NDIS, Police, WWCC", kind: "docs", docs: ["ndis_screening", "police", "wwcc"] },
  { key: "qualifications", label: "Qualifications", kind: "docs", docs: ["qualification"] },
  { key: "super", label: "Superannuation", kind: "soon" },
  { key: "tfn", label: "Tax File Number", kind: "soon" },
  { key: "vaccinations", label: "Vaccinations", kind: "docs", docs: ["flu"] },
];

export const sectionOf = (k: string) => SECTIONS.find((s) => s.key === k) ?? null;
