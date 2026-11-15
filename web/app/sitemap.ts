import type { MetadataRoute } from "next";
import { SITE_PAGES, SITE_URL } from "@/lib/site/pages";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/` }, ...Object.keys(SITE_PAGES).filter((k) => k !== "vmch").map((k) => ({ url: `${SITE_URL}/${k}` })), { url: `${SITE_URL}/join` }];
}
