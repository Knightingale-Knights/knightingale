"use client";
import { useEffect, useId, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * The phone menu button (top right, across from the logo). It's a checkbox so the menu opens without
 * waiting for scripts; the menu items are its later siblings and only show on small screens when it's ticked.
 * It closes again whenever the page changes.
 */
export function MenuBurger() {
  const id = useId();
  const box = useRef<HTMLInputElement>(null);
  const path = usePathname();
  const sp = useSearchParams();
  useEffect(() => { if (box.current) box.current.checked = false; }, [path, sp]);
  return (
    <>
      <input ref={box} id={id} type="checkbox" className="menu-toggle" aria-label="Menu" />
      <label htmlFor={id} className="menu-burger" aria-hidden="true"><span /><span /><span /></label>
    </>
  );
}
