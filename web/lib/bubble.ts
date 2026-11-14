// Writes invoicing results back to Bubble while Bubble is still live, so its
// own pages (and the funding dashboard) agree with the new app and nobody can
// invoice the same shift twice from Bubble. Fields use Bubble's display names.
import { env } from "@/lib/env";

export const bubbleWritebackEnabled = () => Boolean(env.bubbleToken);

export async function patchBubble(type: string, id: string, fields: Record<string, unknown>) {
  const res = await fetch(`${env.bubbleBase}/${type}/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${env.bubbleToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`Bubble ${type}/${id} ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/** Runs patches a few at a time; returns the error messages, if any. */
export async function patchMany(jobs: Array<() => Promise<void>>, concurrency = 4) {
  const errors: string[] = [];
  let i = 0;
  const worker = async () => {
    while (i < jobs.length) {
      const job = jobs[i++];
      try { await job(); } catch (e) { errors.push(String((e as Error).message ?? e)); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  return errors;
}
