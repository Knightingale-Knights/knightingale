"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Goes to `href` (closing a popup) after `ms`. */
export function AutoClose({ href, ms = 3000 }: { href: string; ms?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace(href, { scroll: false }), ms);
    return () => clearTimeout(t);
  }, [router, href, ms]);
  return null;
}
