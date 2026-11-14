import { sql } from "@/lib/db";
import { env } from "@/lib/env";
import { sendPlainEmail } from "@/lib/postmark";
import { bubbleWritebackEnabled, patchBubble, patchMany } from "@/lib/bubble";
import { wintringhamPending } from "./queries";
import { WINTRINGHAM_HEADERS, isoDate, toCsv, wintringhamRows } from "./rules";

/** Emails every billed, unsent residential shift as one CSV, then marks them sent. */
export async function sendWintringhamCsv(to: string) {
  const recipient = to.trim() || env.wintringhamTo;
  if (!recipient) throw new Error("Enter who the Wintringham CSV goes to.");

  const sent = await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext('app.wintringham'))`;
    const shifts = await wintringhamPending(tx as unknown as typeof sql);
    if (!shifts.length) throw new Error("No billed shifts are waiting to be sent.");

    const csv = toCsv(WINTRINGHAM_HEADERS, wintringhamRows(shifts));
    const date = isoDate(new Date());
    await sendPlainEmail({
      to: recipient,
      subject: `Wintringham CSV ${date}`,
      text: `Wintringham CSV attached (${shifts.length} rows).`,
      attachments: [{ Name: `wintringham-${date}.csv`, Content: Buffer.from(csv, "utf8").toString("base64"), ContentType: "text/csv" }],
    });
    await tx`insert into app.wintringham_csv_sent (shift_id) select unnest(${shifts.map((s) => s.id)}::uuid[]) on conflict do nothing`;
    return shifts;
  });

  // Outside the transaction: Bubble can be slow and the CSV is already sent.
  let bubbleErrors = 0;
  if (bubbleWritebackEnabled()) {
    const errs = await patchMany(sent.filter((s) => s.bubble_id).map((s) => () => patchBubble("shift", s.bubble_id!, { csv: true })));
    bubbleErrors = errs.length;
  }
  return { rows: sent.length, bubbleErrors };
}
