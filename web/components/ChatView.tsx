import Link from "next/link";
import type { Chat, ChatSummary } from "@/lib/chats/data";
import { MAX_MESSAGE } from "@/lib/chats/data";
import { postMessageAction } from "@/app/chats/actions";
import { ChatRefresh } from "./ChatRefresh";

const TZ = "Australia/Melbourne";
const stamp = (d: Date) => {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
  const time = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(d);
  return day === today ? time : `${new Intl.DateTimeFormat("en-AU", { timeZone: TZ, day: "numeric", month: "short" }).format(d)}, ${time}`;
};

export function ChatList({ chats, base }: { chats: ChatSummary[]; base: string }) {
  if (!chats.length) return <p className="empty">No participant chats yet. Chats appear for participants you have shifts with.</p>;
  return (
    <div className="chat-list">
      {chats.map((c) => (
        <Link key={c.participant} href={`${base}/${c.participant}`} className={`chat-item ${c.unread ? "unread" : ""}`}>
          <span className="who">{c.name}</span>
          {c.unread > 0 && <span className="badge">{c.unread}</span>}
          <span className="last">{c.last_text ? c.last_text.slice(0, 90) : "No messages yet"}</span>
          {c.last_at && <span className="at">{stamp(c.last_at)}</span>}
        </Link>
      ))}
    </div>
  );
}

export function ChatThread({ chat, back, error }: { chat: Chat; back: string; error?: string }) {
  return (
    <div className="chat">
      <ChatRefresh />
      <Link href={back} className="back">← Chats</Link>
      <h1>{chat.name}&apos;s care team</h1>
      <div className="messages">
        {chat.messages.length === 0 && <p className="empty">No messages yet. Say hello to the team.</p>}
        {chat.messages.map((m) => (
          <div key={m.id} className={`msg ${m.mine ? "mine" : ""}`}>
            {!m.mine && <span className="from">{m.sender ?? "Knightingale"}</span>}
            <p>{m.content}</p>
            <span className="at">{stamp(m.at)}</span>
          </div>
        ))}
        <span id="end" />
      </div>
      {error && <p className="banner error">{error}</p>}
      <form action={postMessageAction} className="compose">
        <input type="hidden" name="participant" value={chat.participant} />
        <textarea name="content" rows={2} required maxLength={MAX_MESSAGE} placeholder="Message the care team" />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
