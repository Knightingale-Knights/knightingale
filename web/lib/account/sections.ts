// The carer Account page: one row per item, like Bubble's account page. Each document has its own row,
// so it's clear which one is missing.
import type { AccountDocKey, DocKey } from "@/lib/compliance/docs";

type Key = DocKey | AccountDocKey;
export type Section =
  | { key: string; label: string; kind: "docs"; docs: Key[]; tick?: Key[]; nurses?: true }
  | { key: string; label: string; kind: "link"; href: string; external?: boolean }
  | { key: string; label: string; kind: "soon" };

const doc = (key: string, label: string, k: Key, extra: { nurses?: true } = {}): Section => ({ key, label, kind: "docs", docs: [k], ...extra });

export const SECTIONS: Section[] = ([] as Section[]).concat([
  { key: "personal", label: "Personal Details", kind: "link", href: "/carer/account/personal" },
  { key: "availability", label: "Availability", kind: "link", href: "/carer/availability" },
  { key: "bank", label: "Bank Details", kind: "link", href: "/carer/account/bank" },
  doc("cpr", "CPR", "cpr"),
  doc("first-aid", "First Aid", "first_aid"),
  { key: "contract", label: "Employment Contract", kind: "link", href: "/carer/contract" },
  { key: "handbook", label: "Handbook", kind: "link", href: "/docs/policies/handbook.pdf", external: true },
  doc("right-to-work", "Right to Work", "passport"),
  doc("licence", "Licence", "licence"),
  doc("insurance", "Insurance", "insurance"),
  doc("ndis", "NDIS Worker Screening", "ndis_screening"),
  doc("police", "Police Check", "police"),
  doc("wwcc", "WWCC", "wwcc"),
  doc("resume", "Resume", "resume"),
  doc("certificate", "Qualification Certificate", "certificate"),
  doc("ahpra", "AHPRA", "ahpra", { nurses: true }),
  { key: "super", label: "Superannuation", kind: "link", href: "/carer/account/super" },
  { key: "tfn", label: "Tax File Number", kind: "link", href: "/carer/account/tfn" },
  doc("influenza", "Influenza", "flu"),
  doc("covid", "COVID-19", "covid"),
] as Section[]).sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));

/** EN and RN carers see AHPRA. */
export const isNurse = (roles: string[] | null) => (roles ?? []).some((r) => r === "en" || r === "rn");

export const sectionsFor = (roles: string[] | null) => SECTIONS.filter((s) => !(s.kind === "docs" && s.nurses) || isNurse(roles));
export const sectionOf = (k: string) => SECTIONS.find((s) => s.key === k) ?? null;
