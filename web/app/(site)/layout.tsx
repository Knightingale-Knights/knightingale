import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import "./site.css";

// The public website (knightingale.com.au). Unlike the app, these pages are for search engines.
export const metadata: Metadata = {
  metadataBase: new URL("https://knightingale.com.au"),
  robots: { index: true, follow: true },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
