import { requireCarer } from "@/lib/auth";
import { ChatList } from "@/components/ChatView";
import { chatList } from "@/lib/chats/data";
import { CarerNav } from "../CarerNav";

export const dynamic = "force-dynamic";

export default async function CarerChats() {
  const me = await requireCarer();
  const chats = await chatList(me);
  return (
    <div className="carer">
      <CarerNav on="chats" name={me.name} />
      <main>
        <h1>Chats</h1>
        <ChatList chats={chats} base="/carer/chats" />
      </main>
    </div>
  );
}
