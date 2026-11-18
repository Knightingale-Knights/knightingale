"use server";
import { revalidatePath } from "next/cache";
import { requireCarer } from "@/lib/auth";
import { markWatched } from "@/lib/culture/data";
import { isCultureKey } from "@/lib/culture/videos";

/** Called when a video has stayed open for its full length. Viewing as a carer never records it. */
export async function watchedAction(key: string) {
  const me = await requireCarer();
  if (me.viewAs || !isCultureKey(key)) return false;
  await markWatched(me.id, key);
  revalidatePath("/carer/culture");
  return true;
}
