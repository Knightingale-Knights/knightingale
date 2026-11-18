"use server";
import { redirect } from "next/navigation";
import { requireCarer } from "@/lib/auth";
import { signContract } from "@/lib/contract/data";

export async function signContractAction(f: FormData) {
  const me = await requireCarer();
  if (me.viewAs) redirect("/carer/contract?error=" + encodeURIComponent("Only the carer can sign their own contract."));
  try {
    await signContract(me.id, String(f.get("signature") ?? ""));
  } catch (e) {
    redirect("/carer/contract?error=" + encodeURIComponent(String((e as Error).message ?? e)));
  }
  redirect("/carer");
}
