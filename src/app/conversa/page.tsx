import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Chat } from "./Chat";

export default async function Conversa({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/entrar");
  if (!profile?.terms_version) redirect("/boas-vindas");
  const { nova } = await searchParams;

  let conversationId: string | null = null;
  let initial: { role: "user" | "assistant"; content: string }[] = [];
  if (!nova) {
    const { data: conv } = await supabase.from("conversations").select("id").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (conv) {
      conversationId = conv.id;
      const { data: msgs } = await supabase.from("messages").select("role,content").eq("conversation_id", conv.id).order("created_at", { ascending: false }).limit(40);
      initial = ((msgs ?? []) as typeof initial).reverse();
    }
  }
  return (
    <AppShell active="/conversa">
      <Chat key={conversationId ?? "nova"} conversationId={conversationId} initial={initial} name={profile.name} voiceReplies={profile.voice_replies} theme={profile.angel_theme} />
    </AppShell>
  );
}
