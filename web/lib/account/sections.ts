// The carer Account page: one row per section, like Bubble's account page.
import type { AccountDocKey, DocKey } from "@/lib/compliance/docs";

export type Section =
  | { key: string; label: string; kind: "docs"; docs: (DocKey | AccountDocKey)[]; tick: DocKey[]; nursesOnly?: AccountDocKey[] }
  | { key: string; label: string; kind: "link"; href: string; external?: boolean }
  | { key: string; label: string; kind: "soon" };

export const SECTIONS: Section[] = [
  { key: "personal", label: "Personal Details", kind: "link", href: "/carer/account/personal" },
  { key: "availability", label: "Availability", kind: "link", href: "/carer/availability" },
  { key: "bank", label: "Bank Details", kind: "link", href: "/carer/account/bank" },
  { key: "certifications", label: "Certifications", kind: "docs", docs: ["cpr", "first_aid"], tick: ["cpr", "first_aid"] },
  { key: "contract", label: "Employment Contract", kind: "link", href: "/carer/contract" },
  { key: "handbook", label: "Handbook", kind: "link", href: "/docs/policies/handbook.pdf", external: true },
  { key: "id", label: "I.D", kind: "docs", docs: ["passport", "licence"], tick: ["id"] },
  { key: "insurance", label: "Insurance", kind: "docs", docs: ["insurance"], tick: [] },
  { key: "ndis", label: "NDIS Worker Screening", kind: "docs", docs: ["ndis_screening"], tick: ["ndis_screening"] },
  { key: "police", label: "Police Check", kind: "docs", docs: ["police"], tick: ["police"] },
  { key: "wwcc", label: "WWCC", kind: "docs", docs: ["wwcc"], tick: ["wwcc"] },
  { key: "qualifications", label: "Qualifications", kind: "docs", docs: ["resume", "certificate", "ahpra"], tick: ["qualification"], nursesOnly: ["ahpra"] },
  { key: "super", label: "Superannuation", kind: "link", href: "/carer/account/super" },
  { key: "tfn", label: "Tax File Number", kind: "link", href: "/carer/account/tfn" },
  { key: "vaccinations", label: "Vaccinations", kind: "docs", docs: ["flu", "covid"], tick: ["flu"] },
];

export const sectionOf = (k: string) => SECTIONS.find((s) => s.key === k) ?? null;

/** EN and RN carers see the AHPRA tab. */
export const isNurse = (roles: string[] | null) => (roles ?? []).some((r) => r === "en" || r === "rn");
