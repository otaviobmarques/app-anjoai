"use client";
/**
 * Voz do Anjo.
 * - Fala: voz natural (ElevenLabs, via /api/voz). Se não estiver configurada ou falhar, usa a voz do navegador.
 * - Escuta: reconhecimento de voz do navegador (Google no Chrome, Apple no Safari).
 */

type AC = typeof AudioContext;
let ctx: AudioContext | null = null;
let naturalOff = false; // vira true quando o servidor diz que a voz natural não está configurada

/** Precisa ser chamado dentro de um toque/clique: libera o áudio no iPhone e no Chrome. */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    const C: AC | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: AC }).webkitAudioContext;
    if (!C) return;
    ctx ??= new C();
    void ctx.resume();
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(ctx.destination);
    s.start(0);
  } catch {}
}

function cleanForSpeech(t: string) {
  return t.replace(/[*_#>`]/g, "").replace(/\s+/g, " ").trim();
}

async function fetchAudio(text: string): Promise<AudioBuffer | null> {
  if (naturalOff || !ctx) return null;
  try {
    const r = await fetch("/api/voz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    if (r.status === 501) { naturalOff = true; return null; }
    if (!r.ok) return null;
    const ab = await r.arrayBuffer();
    return await ctx.decodeAudioData(ab);
  } catch {
    return null;
  }
}

function ptVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((x) => x.lang === "pt-BR" && /female|luciana|francisca|google/i.test(x.name)) || voices.find((x) => x.lang?.startsWith("pt"));
}

function browserSay(text: string) {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    u.rate = 1;
    const v = ptVoice();
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

/**
 * Fala a resposta enquanto ela ainda chega: cada trecho completo já é pedido ao servidor de voz
 * e tocado em ordem, sem esperar a resposta inteira.
 * onIdle é chamado uma vez, quando a resposta terminou e o último trecho acabou de tocar.
 */
export class SentenceSpeaker {
  private buf = "";
  private queue: { text: string; audio: Promise<AudioBuffer | null> }[] = [];
  private playing = false;
  private ended = false;
  private stopped = false;
  private idleFired = false;
  private chunks = 0;
  private current: AudioBufferSourceNode | null = null;
  constructor(private onIdle: () => void) {}

  push(delta: string) {
    if (this.stopped) return;
    this.buf += delta;
    // o primeiro trecho é curto para começar a falar logo; os seguintes são maiores para soar mais natural
    const min = this.chunks === 0 ? 24 : 140;
    const re = /[.!?…\n]+["”')]*(\s|$)/g;
    let last = -1;
    let m: RegExpExecArray | null;
    while ((m = re.exec(this.buf))) if (m.index + m[0].length >= min) { last = m.index + m[0].length; break; }
    if (last > 0) {
      this.enqueue(this.buf.slice(0, last));
      this.buf = this.buf.slice(last);
    }
  }

  end() {
    if (this.stopped) return;
    this.ended = true;
    if (this.buf.trim()) this.enqueue(this.buf);
    this.buf = "";
    void this.kick();
  }

  stop() {
    this.stopped = true;
    this.queue = [];
    try { this.current?.stop(); } catch {}
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  private enqueue(text: string) {
    const t = cleanForSpeech(text);
    if (!t) return;
    this.chunks++;
    this.queue.push({ text: t, audio: fetchAudio(t) });
    void this.kick();
  }

  private async kick() {
    if (this.playing || this.stopped) return;
    const item = this.queue.shift();
    if (!item) {
      if (this.ended && !this.idleFired) { this.idleFired = true; this.onIdle(); }
      return;
    }
    this.playing = true;
    const buf = await item.audio;
    if (this.stopped) return;
    if (buf && ctx) await this.play(buf);
    else await browserSay(item.text);
    this.playing = false;
    void this.kick();
  }

  private play(buf: AudioBuffer) {
    return new Promise<void>((resolve) => {
      const s = ctx!.createBufferSource();
      s.buffer = buf;
      s.connect(ctx!.destination);
      s.onended = () => resolve();
      this.current = s;
      s.start(0);
    });
  }
}

let active: SentenceSpeaker | null = null;

/** Lê um texto inteiro (botões "Ouvir", palavra do dia, resposta em voz). */
export function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined") return onEnd?.();
  unlockAudio();
  active?.stop();
  const sp = new SentenceSpeaker(() => onEnd?.());
  active = sp;
  sp.push(text);
  sp.end();
}

export function stopSpeaking() {
  active?.stop();
  active = null;
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

export function voiceModeSupported() {
  return typeof window !== "undefined" && getRecognizer() !== null;
}
