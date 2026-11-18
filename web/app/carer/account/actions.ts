"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCarer } from "@/lib/auth";
import { DetailsError, savePersonal, type Personal } from "@/lib/account/personal";
import { ABOUT_FIELDS, saveAbout, type About } from "@/lib/account/about";
import { isoDate } from "@/lib/invoicing/rules";

const s = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function personalAction(f: FormData) {
  const me = await requireCarer();
  let dest = "/carer/account/personal?saved=1";
  try {
    const v: Personal = {
      first: s(f, "first"), middle: s(f, "middle"), last: s(f, "last"), phone: s(f, "phone"), dob: s(f, "dob"),
      address: s(f, "address"), email: s(f, "email"),
      can_drive: f.get("can_drive") === "yes" ? true : f.get("can_drive") === "no" ? false : null,
      about: "", em_name: s(f, "em_name"), em_relationship: s(f, "em_relationship"), em_phone: s(f, "em_phone"),
    };
    const r = await savePersonal(me.id, v, isoDate(new Date()));
    if (r.emailChanged) dest += "&email=1";
  } catch (e) {
    if (!(e instanceof DetailsError)) console.error(e);
    dest = `/carer/account/personal?error=${encodeURIComponent(e instanceof DetailsError ? e.message : "Something went wrong. Please try again.")}`;
  }
  revalidatePath("/carer/account", "layout");
  redirect(dest);
}

export async function aboutAction(f: FormData) {
  const me = await requireCarer();
  const v: Partial<About> = {};
  for (const k of ABOUT_FIELDS) v[k] = s(f, k);
  try {
    await saveAbout(me.id, v);
  } catch (e) {
    redirect(`/carer/account/about?error=${encodeURIComponent(String((e as Error).message ?? e))}`);
  }
  redirect("/carer/account/personal?about=1");
}
