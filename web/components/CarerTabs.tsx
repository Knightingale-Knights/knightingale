import Link from "next/link";

const TABS = [["/carers", "Active Carers"], ["/compliance", "Compliance"], ["/carers/availability", "Availability"]] as const;

/** The three Carers views, shown in the top bar. */
export function CarerTabs({ on }: { on: (typeof TABS)[number][0] }) {
  return <>{TABS.map(([href, label]) => <Link key={href} href={href} className={href === on ? "on" : ""}>{label}</Link>)}</>;
}
