import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Paper design system: Helvetica Neue (system) for UI text, Newsreader for titles.
const serif = localFont({
  src: [
    { path: "./fonts/newsreader-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./fonts/newsreader-latin-300-italic.woff2", weight: "300", style: "italic" },
    { path: "./fonts/newsreader-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/newsreader-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-display",
});

export const metadata: Metadata = { title: "Knightingale", robots: { index: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={serif.variable}>
      <body>{children}</body>
    </html>
  );
}
