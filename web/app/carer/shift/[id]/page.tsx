import { notFound, redirect } from "next/navigation";
import { requireCarer } from "@/lib/auth";
import { myShift } from "@/lib/carer/data";

export const dynamic = "force-dynamic";

/** Old shift links: everything now lives on the day view (check in/out) and in the Details popup. */
export default async function Shift({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ check?: string }> }) {
  const me = await requireCarer();
  const { id } = await params;
  const sp = await searchParams;
  const s = await myShift(me.id, id);
  if (!s) notFound();
  if (sp.check === "in" || sp.check === "out" || s.kind !== "ndis") redirect(`/carer?date=${s.day}`);
  redirect(`/carer?date=${s.day}&details=${s.id}`);
}
