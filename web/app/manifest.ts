import type { MetadataRoute } from "next";

/** "Add to Home Screen" on phones: the Knightingale k as the app icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Knightingale",
    short_name: "Knightingale",
    id: "/",
    start_url: "/start",
    scope: "/",
    display: "standalone",
    background_color: "#f0e2f7",
    theme_color: "#5f1b35",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
