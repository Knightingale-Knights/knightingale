import { requireStaff, currentUser } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { ChatList } from "@/components/ChatView";
import { chatList } from "@/lib/chats/data";

export const dynamic = "force-dynamic";

export default async function Chats() {
  const staff = await requireStaff();
  const me = (await currentUser())!;
  const chats = await chatList(me);
  return (
    <div className="shell">
      <TopBar section="/chats" email={staff.email} />
      <main className="narrow">
        <h1>Participant chats</h1>
        <ChatList chats={chats} base="/chats" />
      </main>
    </div>
  );
}
