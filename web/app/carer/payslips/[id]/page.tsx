import { notFound } from "next/navigation";
import { requireCarer } from "@/lib/auth";
import { myPayslip } from "@/lib/carer/payslips";
import { SlipView } from "./SlipView";

export const dynamic = "force-dynamic";

/** One payslip, laid out as Bubble's Payslip popup, with a Download PDF (print) button. */
export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireCarer();
  const { id } = await params;
  const p = await myPayslip(me.id, id);
  if (!p) notFound();
  return <SlipView p={p} close="/carer/payslips" />;
}
