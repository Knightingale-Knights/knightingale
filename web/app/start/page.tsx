import { redirect } from "next/navigation";
import { currentUser, homePath } from "@/lib/auth";

export const dynamic = "force-dynamic";

// The home screen app opens here: straight to the person's own view, or to sign in.
export default async function Start() {
  const me = await currentUser();
  redirect(me ? homePath(me.role) : "/login");
}
