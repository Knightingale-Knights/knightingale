import { notFound } from "next/navigation";
import { requireStaff, currentUser } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { ChatThread } from "@/components/ChatView";
import { openChat } from "@/lib/chats/data";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params, searchParams }: { params: Promise<{ participant: string }>; searchParams: Promise<{ error?: string }> }) {
  const staff = await requireStaff();
  const me = (await currentUser())!;
  const { participant } = await params;
  const chat = /^[0-9a-f-]{36}$/i.test(participant) ? await openChat(me, participant) : null;
  if (!chat) notFound();
  return (
    <div className="shell">
      <TopBar section="/chats" email={staff.email} />
      <main className="narrow"><ChatThread chat={chat} back="/chats" error={(await searchParams).error} /></main>
    </div>
  );
}
