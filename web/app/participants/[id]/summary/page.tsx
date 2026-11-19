import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ParticipantShell } from "@/components/ParticipantShell";
import { PendingButton } from "@/components/PendingButton";
import { participant } from "@/lib/participants/data";
import { summaryAction } from "../../actions";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // the summary takes a while to draft

/** Admin: email yourself the participant's support summary (Bubble's Summary button). */
export default async function Summary({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; error?: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const p = await participant(id);
  if (!p) notFound();
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "(no name)";
  return (
    <ParticipantShell id={id} name={name} email={staff.email} title={`${p.first_name ?? name}'s Support Summary`}
      lede={`A summary of the last month's progress notes, emailed to ${staff.email} as a PDF.`} msg={sp.msg} error={sp.error}>
      <form action={summaryAction} className="stack">
        <input type="hidden" name="participant" value={id} />
        <PendingButton className="big" pending="Drafting the summary…">Email me the summary</PendingButton>
      </form>
    </ParticipantShell>
  );
}
