import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Same faces as the invoice PDFs: Geist for text, Antic Didone for the wordmark.
const ui = localFont({
  src: [
    { path: "./fonts/Geist-Regular.ttf", weight: "400" },
    { path: "./fonts/Geist-Medium.ttf", weight: "500" },
    { path: "./fonts/Geist-Bold.ttf", weight: "600" },
  ],
  variable: "--font-ui",
});
const display = localFont({ src: "./fonts/AnticDidone-Regular.ttf", variable: "--font-display" });

export const metadata: Metadata = { title: "Knightingale", robots: { index: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${ui.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
