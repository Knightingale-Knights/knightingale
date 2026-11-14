import { notFound } from "next/navigation";
import { requireCarer } from "@/lib/auth";
import { ChatThread } from "@/components/ChatView";
import { openChat } from "@/lib/chats/data";
import { CarerNav } from "../../CarerNav";

export const dynamic = "force-dynamic";

export default async function CarerChat({ params, searchParams }: { params: Promise<{ participant: string }>; searchParams: Promise<{ error?: string }> }) {
  const me = await requireCarer();
  const { participant } = await params;
  const chat = /^[0-9a-f-]{36}$/i.test(participant) ? await openChat(me, participant) : null;
  if (!chat) notFound();
  return (
    <div className="carer">
      <CarerNav on="chats" name={me.name} />
      <main><ChatThread chat={chat} back="/carer/chats" error={(await searchParams).error} /></main>
    </div>
  );
}
