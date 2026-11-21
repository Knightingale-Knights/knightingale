import type { Metadata } from "next";
import { SiteSection } from "@/components/site/Sections";
import { HOME } from "@/lib/site/pages";

export const metadata: Metadata = {
  title: HOME.title ?? "Knightingale",
  description: HOME.description ?? undefined,
  alternates: { canonical: "/" },
};

export default function Home() {
  return <div className="home">{HOME.sections.map((s, i) => <SiteSection key={i} s={s} i={i} />)}</div>;
}
