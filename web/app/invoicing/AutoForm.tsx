"use client";
import type { ReactNode } from "react";

/** A GET form that reloads as soon as any field changes, so picking a location or participant shows its invoice. */
export function AutoForm({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <form className={className} method="get" onChange={(e) => e.currentTarget.requestSubmit()}>
      {children}
    </form>
  );
}
