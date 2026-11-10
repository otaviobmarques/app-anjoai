"use client";
import { useEffect, useRef, useState } from "react";
import { AngelSymbol } from "@/components/Logo";
import { MEDITATIONS, SOUNDS, meditationAudio, soundAudio, type Meditation } from "@/lib/meditations";
import { stopSpeaking } from "@/lib/voice";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const TIMERS = [15, 30, 60, 0] as const; // 0 = sem limite

export function Peace() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [med, setMed] = useState<Meditation | null>(null);
  const [sound, setSound] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(0);
  const [timer, setTimer] = useState<number>(30);
  const [left, setLeft] = useState<number | null>(null);
  const [vol, setVol] = useState(0.8);

  // um único player para tudo
  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    a.addEventListener("timeupdate", () => setT(a.currentTime));
    a.addEventListener("loadedmetadata", () => setDur(a.duration));
    a.addEventListener("play", () => setPlaying(true));
    a.addEventListener("pause", () => setPlaying(false));
    a.addEventListener("ended", () => setPlaying(false));
    audio.current = a;
    return () => { a.pause(); a.src = ""; };
  }, []);

  useEffect(() => { if (audio.current) audio.current.volume = vol; }, [vol]);

  // timer dos sons: diminui o volume no último minuto e para
  useEffect(() => {
    if (!sound || !playing || !left) return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l === null) return l;
        const n = l - 1;
        const a = audio.current;
        if (a && n <= 60) a.volume = Math.max(0, vol * (n / 60));
        if (n <= 0) { a?.pause(); return null; }
        return n;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [sound, playing, left, vol]);

  function mediaSession(title: string, artist: string) {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album: "Anjo IA", artwork: [{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }] });
    }
  }

  function startMeditation(m: Meditation) {
    const a = audio.current!;
    stopSpeaking();
    setSound(null); setLeft(null);
    a.loop = false; a.volume = vol; a.src = meditationAudio(m.id); a.currentTime = 0;
    setMed(m); setT(0); setDur(m.minutes * 60);
    a.play().catch(() => {});
    mediaSession(m.title, "Meditação guiada");
  }
  function startSound(id: string) {
    const a = audio.current!;
    stopSpeaking();
    if (sound === id) { if (a.paused) a.play().catch(() => {}); else a.pause(); return; }
    setMed(null);
    a.loop = true; a.volume = vol; a.src = soundAudio(id); a.currentTime = 0;
    setSound(id); setLeft(timer ? timer * 60 : null);
    a.play().catch(() => {});
    mediaSession(SOUNDS.find((s) => s.id === id)!.title, "Sons para descansar");
  }
  function chooseTimer(m: number) {
    setTimer(m);
    if (sound) { setLeft(m ? m * 60 : null); if (audio.current) audio.current.volume = vol; }
  }
  const toggle = () => { const a = audio.current!; if (a.paused) a.play().catch(() => {}); else a.pause(); };
  const close = () => { audio.current?.pause(); setMed(null); };

  if (med) {
    return (
      <div className="flex min-h-[calc(100dvh-9rem)] flex-col items-center text-center">
        <button className="self-start text-sm text-muted underline" onClick={close}>‹ Voltar</button>
        <div className={`relative mt-6 flex h-64 w-64 items-center justify-center ${playing ? "voice-pulse" : ""}`}>
          <div className="glow absolute -inset-8 rounded-full" />
          <div className="relative flex h-52 w-52 items-center justify-center rounded-full bg-black"><AngelSymbol size={170} /></div>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">{med.title}</h1>
        <p className="text-muted">{med.subtitle}</p>
        <input type="range" min={0} max={dur || 1} step={1} value={t} aria-label="Progresso"
          onChange={(e) => { if (audio.current) audio.current.currentTime = Number(e.target.value); }}
          className="mt-8 w-full accent-[var(--gold)]" />
        <div className="flex w-full justify-between text-xs text-muted"><span>{mmss(t)}</span><span>{mmss(dur)}</span></div>
        <button onClick={toggle} className="btn-gold mt-6 h-16 w-40 text-lg" aria-label={playing ? "Pausar" : "Continuar"}>{playing ? "Pausar" : "Continuar"}</button>
        <p className="mt-6 text-sm text-muted">Use fones, se puder. Pode fechar os olhos: a voz te guia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-lg font-extrabold">Momento de paz</h1>
        <p className="mt-1 text-sm text-muted">Respire, medite na Palavra e descanse. Feche os olhos se quiser: a voz do Anjo te guia.</p>
      </header>

      <section aria-labelledby="med-t">
        <h2 id="med-t" className="text-sm font-bold text-gold-text">Meditações guiadas</h2>
        <ul className="mt-2 space-y-2">
          {MEDITATIONS.map((m) => (
            <li key={m.id}>
              <button onClick={() => startMeditation(m)} className="card flex w-full items-center gap-4 p-4 text-left">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-on-gold" aria-hidden>▶</span>
                <span className="flex-1">
                  <span className="block font-bold">{m.title}</span>
                  <span className="block text-sm text-muted">{m.subtitle}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">{m.minutes} min</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="sons-t">
        <h2 id="sons-t" className="text-sm font-bold text-gold-text">Sons para descansar</h2>
        <p className="mt-1 text-xs text-muted">Para relaxar, orar em silêncio ou pegar no sono.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SOUNDS.map((s) => {
            const on = sound === s.id && playing;
            return (
              <button key={s.id} onClick={() => startSound(s.id)} aria-pressed={on}
                className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl p-3 ${on ? "bg-gold font-bold text-on-gold voice-pulse" : "card"}`}>
                <span className="text-3xl" aria-hidden>{s.emoji}</span>
                <span className="text-sm">{s.title}</span>
                {sound === s.id && <span className="text-xs">{playing ? "tocando" : "pausado"}</span>}
              </button>
            );
          })}
        </div>
        <div className="card mt-3 space-y-3 p-4">
          <div>
            <p className="text-sm text-muted">Desligar em</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIMERS.map((m) => (
                <button key={m} onClick={() => chooseTimer(m)} aria-pressed={timer === m}
                  className={`rounded-full px-3 py-1.5 text-sm ${timer === m ? "bg-gold font-bold text-on-gold" : "border border-line"}`}>{m ? `${m} min` : "Sem limite"}</button>
              ))}
            </div>
            {sound && left !== null && playing && <p className="mt-2 text-xs text-muted">Desliga em {mmss(left)}</p>}
          </div>
          <label className="block text-sm text-muted">Volume
            <input type="range" min={0} max={1} step={0.05} value={vol} onChange={(e) => setVol(Number(e.target.value))} className="mt-1 w-full accent-[var(--gold)]" />
          </label>
        </div>
      </section>
    </div>
  );
}
