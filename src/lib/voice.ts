"use client";
/**
 * Voz na Fase 0: recursos do próprio navegador (sem custo).
 * Fase 1: trocar por transcrição (Whisper/Deepgram) e voz sintética calorosa (ElevenLabs/Azure).
 */
export function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return onEnd?.();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[*_#>]/g, ""));
  u.lang = "pt-BR";
  u.rate = 0.95;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find((x) => x.lang === "pt-BR" && /female|luciana|francisca|google/i.test(x.name)) || voices.find((x) => x.lang?.startsWith("pt"));
  if (v) u.voice = v;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}
export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

type Rec = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

export function getRecognizer(): Rec | null {
  if (typeof window === "undefined") return null;
  const W = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const C = W.SpeechRecognition || W.webkitSpeechRecognition;
  if (!C) return null;
  const r = new C();
  r.lang = "pt-BR";
  r.interimResults = true;
  r.continuous = false;
  return r;
}
