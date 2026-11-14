"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { ChatError, postMessage } from "@/lib/chats/data";

export async function postMessageAction(f: FormData) {
  const me = await currentUser();
  if (!me) redirect("/login");
  const participant = String(f.get("participant") ?? "");
  const base = me.role === "admin" ? `/chats/${participant}` : `/carer/chats/${participant}`;
  let dest = `${base}#end`;
  try {
    await postMessage(me, participant, String(f.get("content") ?? ""));
  } catch (e) {
    if (!(e instanceof ChatError)) console.error(e);
    dest = `${base}?error=${encodeURIComponent(e instanceof ChatError ? e.message : "Something went wrong. Please try again.")}`;
  }
  revalidatePath(base);
  redirect(dest);
}
