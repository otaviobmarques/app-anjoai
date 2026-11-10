import { requireReady } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Chat } from "./Chat";
import { startOfTodayBR } from "@/lib/limits";

export const dynamic = "force-dynamic";

/**
 * A conversa sempre abre em branco: a pessoa não vê o histórico.
 * Por dentro, o Anjo recebe a memória da jornada e trechos das conversas anteriores (ver /api/chat).
 */
export default async function Conversa({ searchParams }: { searchParams: Promise<{ voz?: string }> }) {
  const { supabase, profile } = await requireReady("/conversa");
  const { data: mood } = await supabase.from("mood_checkins").select("moods").gte("created_at", startOfTodayBR()).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const { voz } = await searchParams;
  return (
    <AppShell active="/conversa">
      <Chat conversationId={null} initial={[]} name={profile.name} voiceReplies={profile.voice_replies} theme={profile.angel_theme} startVoice={voz === "1"} moods={(mood?.moods as string[] | undefined) ?? []} />
    </AppShell>
  );
}
