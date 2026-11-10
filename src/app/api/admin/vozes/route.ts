import { getSession } from "@/lib/supabase/server";
import { currentVoice, listVoices, ttsAvailable } from "@/lib/tts";

export const runtime = "nodejs";

export async function GET() {
  const { supabase, user, profile } = await getSession();
  if (!user || !profile?.is_admin) return new Response("proibido", { status: 403 });
  if (!ttsAvailable()) return Response.json({ configured: false, voices: [] });
  try {
    const [voices, current] = await Promise.all([listVoices(), currentVoice(supabase)]);
    return Response.json({
      configured: true,
      current,
      voices: voices.map((v) => ({ id: v.voice_id, name: v.name, preview: v.preview_url, labels: v.labels ?? {}, category: v.category })),
    });
  } catch (e) {
    return Response.json({ configured: true, error: String(e), voices: [] });
  }
}

export async function POST(req: Request) {
  const { supabase, user, profile } = await getSession();
  if (!user || !profile?.is_admin) return new Response("proibido", { status: 403 });
  const { id, name } = (await req.json().catch(() => ({}))) as { id?: string; name?: string };
  if (!id || !/^[A-Za-z0-9]{10,40}$/.test(id)) return Response.json({ error: "voz inválida" }, { status: 400 });
  const { error } = await supabase.from("app_settings").upsert({ key: "tts_voice", value: { id, name: name?.slice(0, 80) }, updated_by: user.id, updated_at: new Date().toISOString() });
  if (error) return Response.json({ error: "não consegui salvar" }, { status: 500 });
  return Response.json({ ok: true });
}
