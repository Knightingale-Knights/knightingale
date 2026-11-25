// Signing the employment contract. The signature PNG is kept as a compliance file and
// its link saved in users.contract_signature (as Bubble did), with the date in contract_date.
import { sql } from "@/lib/db";

/** Carers must sign before using the app. Set to false to stop asking. */
export const CONTRACT_GATE = true;

/** Signatures before this moment are for an older version of the contract, so carers sign again. */
export const CONTRACT_VERSION_FROM = new Date("2026-11-26T00:00:00+11:00");

export type ContractState = { signature: string | null; date: Date | null; outdated: boolean };

const current = (date: Date | null) => Boolean(date && new Date(date) >= CONTRACT_VERSION_FROM);

export async function contractState(userId: string): Promise<ContractState> {
  const [r] = await sql<{ signature: string | null; date: Date | null }[]>`
    select contract_signature as signature, contract_date as date from app.users where id = ${userId}`;
  if (!r) return { signature: null, date: null, outdated: false };
  if (r.signature && !current(r.date)) return { signature: null, date: null, outdated: true };
  return { signature: r.signature, date: r.date, outdated: false };
}

const MAX_SIG_BYTES = 400 * 1024;

export async function signContract(userId: string, dataUrl: string) {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new Error("Please sign in the box first.");
  const bytes = Buffer.from(m[1], "base64");
  if (bytes.length < 200) throw new Error("Please sign in the box first.");
  if (bytes.length > MAX_SIG_BYTES) throw new Error("That signature is too large. Please clear it and sign again.");
  await sql.begin(async (txx) => {
    const tx = txx as unknown as typeof sql;
    const [u] = await tx<{ signature: string | null; date: Date | null }[]>`
      select contract_signature as signature, contract_date as date from app.users where id = ${userId} for update`;
    if (!u) throw new Error("We couldn't find your account.");
    if (u.signature && current(u.date)) return; // already signed this version (double tap)
    const [f] = await tx<{ id: string }[]>`
      insert into app.compliance_files (carer, doc, file_name, mime, bytes, uploaded_by)
      values (${userId}, 'contract_signature', 'contract-signature.png', 'image/png', ${bytes}, ${userId}) returning id`;
    await tx`update app.users set contract_signature = ${`/files/${f.id}`}, contract_date = now() where id = ${userId}`;
  });
}
