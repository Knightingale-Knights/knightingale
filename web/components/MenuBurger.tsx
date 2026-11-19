"use client";
import { useEffect, useId, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * The phone menu button (top right, across from the logo). It's a checkbox so the menu opens without
 * waiting for scripts; the menu items are its later siblings and only show on small screens when it's ticked.
 * It closes as soon as any menu item is tapped (even one for the page you're already on), and when the page changes.
 */
export function MenuBurger() {
  const id = useId();
  const box = useRef<HTMLInputElement>(null);
  const path = usePathname();
  const sp = useSearchParams();

  useEffect(() => { if (box.current) box.current.checked = false; }, [path, sp]);

  useEffect(() => {
    const menu = box.current?.parentElement;
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (box.current?.checked && (e.target as HTMLElement).closest("a, button")) box.current.checked = false;
    };
    menu.addEventListener("click", close);
    return () => menu.removeEventListener("click", close);
  }, []);

  return (
    <>
      <input ref={box} id={id} type="checkbox" className="menu-toggle" aria-label="Menu" />
      <label htmlFor={id} className="menu-burger" aria-hidden="true"><span /><span /><span /></label>
    </>
  );
}
