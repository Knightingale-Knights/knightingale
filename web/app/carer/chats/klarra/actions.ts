"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCarer } from "@/lib/auth";
import { askKlarra, KlarraError } from "@/lib/klarra/chat";

export async function askKlarraAction(f: FormData) {
  const me = await requireCarer();
  let dest = "/carer/chats/klarra#end";
  try {
    if (me.viewAs) throw new KlarraError("You're viewing as this carer, so you can't message Klarra for them.");
    await askKlarra(me.id, String(f.get("content") ?? ""));
  } catch (e) {
    if (!(e instanceof KlarraError)) console.error(e);
    dest = `/carer/chats/klarra?error=${encodeURIComponent(e instanceof KlarraError ? e.message : "Something went wrong. Please try again.")}`;
  }
  revalidatePath("/carer", "layout");
  redirect(dest);
}
