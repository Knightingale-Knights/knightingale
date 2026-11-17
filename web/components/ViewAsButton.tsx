import { startViewAsAction } from "@/app/view-as/actions";

/** Admin button to open the app as this user. */
export function ViewAsButton({ user, back, label = "View as" }: { user: string; back: string; label?: string }) {
  return (
    <form action={startViewAsAction} className="inline">
      <input type="hidden" name="user" value={user} />
      <input type="hidden" name="back" value={back} />
      <button className="secondary">{label}</button>
    </form>
  );
}
