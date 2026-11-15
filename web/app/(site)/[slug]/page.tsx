import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteSection } from "@/components/site/Sections";
import { SITE_PAGES } from "@/lib/site/pages";

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(SITE_PAGES).map((slug) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = SITE_PAGES[slug];
  if (!p) return {};
  return {
    title: p.title ?? "Knightingale",
    description: p.description ?? undefined,
    alternates: { canonical: `/${slug}` },
    ...(slug === "vmch" ? { robots: { index: false } } : {}),
  };
}

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = SITE_PAGES[slug];
  if (!p) notFound();
  return <>{p.sections.map((s, i) => <SiteSection key={i} s={s} i={i} />)}</>;
}
