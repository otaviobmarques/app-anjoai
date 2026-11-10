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

function cleanForSpeech(t: string) {
  return t.replace(/[*_#>`]/g, "").replace(/\s+/g, " ").trim();
}

function ptVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((x) => x.lang === "pt-BR" && /female|luciana|francisca|google/i.test(x.name)) || voices.find((x) => x.lang?.startsWith("pt"));
}

/**
 * Fala a resposta enquanto ela ainda chega: cada frase completa entra na fila de voz.
 * onIdle é chamado quando a resposta terminou e a última frase acabou de ser falada.
 */
export class SentenceSpeaker {
  private buf = "";
  private pending = 0;
  private ended = false;
  private stopped = false;
  constructor(private onIdle: () => void) {}

  push(delta: string) {
    if (this.stopped) return;
    this.buf += delta;
    const re = /[.!?…\n]+["”')]*(\s|$)/g;
    let last = -1;
    let m: RegExpExecArray | null;
    while ((m = re.exec(this.buf))) last = m.index + m[0].length;
    if (last >= 24) {
      this.say(this.buf.slice(0, last));
      this.buf = this.buf.slice(last);
    }
  }

  end() {
    if (this.stopped) return;
    this.ended = true;
    if (this.buf.trim()) this.say(this.buf);
    this.buf = "";
    if (this.pending === 0) this.onIdle();
  }

  stop() {
    this.stopped = true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  private say(text: string) {
    const t = cleanForSpeech(text);
    if (!t || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "pt-BR";
    u.rate = 1;
    const v = ptVoice();
    if (v) u.voice = v;
    this.pending++;
    const done = () => {
      this.pending--;
      if (this.ended && this.pending === 0 && !this.stopped) this.onIdle();
    };
    u.onend = done;
    u.onerror = done;
    window.speechSynthesis.speak(u);
  }
}

export function voiceModeSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && getRecognizer() !== null;
}
