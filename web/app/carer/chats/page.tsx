import { requireCarer } from "@/lib/auth";
import { ChatList } from "@/components/ChatView";
import { chatList } from "@/lib/chats/data";
import { klarraLast, klarraUnread } from "@/lib/klarra/chat";
import Link from "next/link";
import { CarerNav } from "../CarerNav";

export const dynamic = "force-dynamic";

export default async function CarerChats() {
  const me = await requireCarer();
  const [chats, kUnread, kLast] = await Promise.all([chatList(me), klarraUnread(me.id), klarraLast(me.id)]);
  return (
    <div className="carer">
      <CarerNav on="chats" name={me.name} />
      <main>
        <h1>Chats</h1>
        <div className="chat-list klarra-row">
          <Link href="/carer/chats/klarra" className={`chat-item ${kUnread ? "unread" : ""}`}>
            <span className="who">Klarra</span>
            {kUnread > 0 && <span className="badge">{kUnread}</span>}
            <span className="last">{kLast ? kLast.body.slice(0, 90) : "Ask me anything about shifts, pay or policies"}</span>
          </Link>
        </div>
        <ChatList chats={chats} base="/carer/chats" />
      </main>
    </div>
  );
}
