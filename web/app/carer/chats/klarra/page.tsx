import Link from "next/link";
import { requireCarer } from "@/lib/auth";
import { KLARRA_MAX, klarraChat, markKlarraRead } from "@/lib/klarra/chat";
import { ChatRefresh } from "@/components/ChatRefresh";
import { CarerNav } from "../../CarerNav";
import { askKlarraAction } from "./actions";

export const dynamic = "force-dynamic";

const TZ = "Australia/Melbourne";
const stamp = (d: Date) => {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
  const time = new Intl.DateTimeFormat("en-AU", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(d);
  return day === today ? time : `${new Intl.DateTimeFormat("en-AU", { timeZone: TZ, day: "numeric", month: "short" }).format(d)}, ${time}`;
};

/** Ask Klarra: the carer's chat with Klarra, Knightingale's assistant. */
export default async function KlarraChat({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requireCarer();
  const sp = await searchParams;
  if (!me.viewAs) await markKlarraRead(me.id);
  const chat = await klarraChat(me.id);
  return (
    <div className="carer">
      <CarerNav on="chats" name={me.name} />
      <main>
        <div className="chat">
          <ChatRefresh every={chat.waiting ? 3000 : 15000} />
          <Link href="/carer/chats" className="back">&larr; Chats</Link>
          <h1>Klarra</h1>
          <p className="hint">Ask Klarra anything about your shifts, pay or our policies.</p>
          <div className="messages">
            {chat.messages.length === 0 && (
              <div className="msg">
                <span className="from">Klarra</span>
                <p>Hi {me.name.split(" ")[0]}, I&apos;m Klarra. Ask me anything about shifts, pay, documents or how things work at Knightingale.</p>
              </div>
            )}
            {chat.messages.map((m) => (
              <div key={m.id} className={`msg ${m.mine ? "mine" : ""}${m.pending ? " pending" : ""}`}>
                {!m.mine && <span className="from">Klarra</span>}
                <p>{m.text}</p>
                <span className="at">{m.pending ? "Sending" : stamp(m.at)}{m.sms ? " · by text" : ""}</span>
              </div>
            ))}
            {chat.waiting && <div className="msg typing" aria-label="Klarra is replying"><span /><span /><span /></div>}
            <span id="end" />
          </div>
          {sp.error && <p className="banner error">{sp.error}</p>}
          {!chat.phone && <p className="banner error">Add your mobile number in Personal Details so Klarra knows it&apos;s you.</p>}
          <form action={askKlarraAction} className="compose">
            <textarea name="content" rows={2} required maxLength={KLARRA_MAX} placeholder="Ask Klarra" />
            <button type="submit">Send</button>
          </form>
        </div>
      </main>
    </div>
  );
}
