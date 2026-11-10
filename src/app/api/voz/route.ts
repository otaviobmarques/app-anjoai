import { getSession } from "@/lib/supabase/server";
import { currentVoice, synthesize, ttsAvailable } from "@/lib/tts";

export const runtime = "nodejs";

// Transforma um trecho de texto em áudio (mp3). Só para pessoas logadas.
export async function POST(req: Request) {
  if (!ttsAvailable()) return new Response("voz natural não configurada", { status: 501 });
  const { supabase, user } = await getSession();
  if (!user) return new Response("não autenticado", { status: 401 });
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  const t = (text ?? "").replace(/[*_#>`]/g, "").replace(/\s+/g, " ").trim().slice(0, 800);
  if (!t) return new Response("texto vazio", { status: 400 });

  const voice = await currentVoice(supabase);
  const r = await synthesize(t, voice.id);
  if (!r.ok || !r.body) {
    console.error("tts error", r.status, await r.text().catch(() => ""));
    return new Response("falha na voz", { status: 502 });
  }
  return new Response(r.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
