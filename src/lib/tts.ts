import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Voz natural do Anjo — ElevenLabs.
 * ELEVENLABS_API_KEY na Vercel liga a voz. Sem ela, o app usa a voz do navegador.
 * A voz escolhida fica em app_settings (key "tts_voice"), definida no painel de administrador.
 */
// Voz do Anjo: "Will - Deep, Smooth and Affectionate" (biblioteca ElevenLabs, adicionada à conta como "Anjo IA - Will")
export const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "CstacWqMhJQlnfLPxRG4";
export const TTS_MODEL = process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5";

export function ttsAvailable() {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

export async function currentVoice(supabase: SupabaseClient): Promise<{ id: string; name?: string }> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", "tts_voice").maybeSingle();
  const v = (data?.value ?? null) as { id?: string; name?: string } | null;
  return v?.id ? { id: v.id, name: v.name } : { id: DEFAULT_VOICE_ID };
}

export async function synthesize(text: string, voiceId: string) {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: TTS_MODEL,
      language_code: "pt",
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
    }),
  });
}

export type VoiceInfo = { voice_id: string; name: string; preview_url?: string; labels?: Record<string, string>; category?: string };

export async function listVoices(): Promise<VoiceInfo[]> {
  const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! }, cache: "no-store" });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}`);
  const j = (await r.json()) as { voices?: VoiceInfo[] };
  return j.voices ?? [];
}
