import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/roster", "/invoicing", "/chats", "/compliance", "/applicants", "/carer", "/facility", "/api", "/c/", "/files", "/receipts", "/vmch"] },
    sitemap: "https://knightingale.com.au/sitemap.xml",
  };
}
