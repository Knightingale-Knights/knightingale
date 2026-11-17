import { currentUser } from "@/lib/auth";
import { stopViewAsAction } from "@/app/view-as/actions";

/** Shown at the top of every non-admin page while an admin is viewing as someone. */
export async function ViewAsBar() {
  const me = await currentUser();
  if (!me?.viewAs) return null;
  return (
    <div className="view-as-bar">
      <span>Viewing as <strong>{me.name || me.email}</strong>. Anything you do is recorded as {me.viewAs.admin.name || "admin"} acting as them.</span>
      <form action={stopViewAsAction}><button>Back to admin</button></form>
    </div>
  );
}
