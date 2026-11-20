import Link from "next/link";

const TABS = [["/availability", "Availability"], ["/active-carers", "Active Carers"], ["/compliance", "Compliance"], ["/notices", "Notices"]] as const;

/** The Carers views, shown in the top bar. */
export function CarerTabs({ on }: { on: (typeof TABS)[number][0] }) {
  return <>{TABS.map(([href, label]) => <Link key={href} href={href} className={href === on ? "on" : ""}>{label}</Link>)}</>;
}
