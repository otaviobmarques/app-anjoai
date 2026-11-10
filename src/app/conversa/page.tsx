import { requireReady } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Chat } from "./Chat";

export const dynamic = "force-dynamic";

/**
 * A conversa sempre abre em branco: a pessoa não vê o histórico.
 * Por dentro, o Anjo recebe a memória da jornada e trechos das conversas anteriores (ver /api/chat).
 */
export default async function Conversa({ searchParams }: { searchParams: Promise<{ voz?: string }> }) {
  const { profile } = await requireReady("/conversa");
  const { voz } = await searchParams;
  return (
    <AppShell active="/conversa">
      <Chat conversationId={null} initial={[]} name={profile.name} voiceReplies={profile.voice_replies} theme={profile.angel_theme} startVoice={voz === "1"} />
    </AppShell>
  );
}
