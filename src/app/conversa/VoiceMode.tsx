"use client";
import { useEffect, useRef, useState } from "react";
import { AngelArt } from "@/components/AngelArt";
import { CrisisCard } from "@/components/CrisisCard";
import { getRecognizer, SentenceSpeaker, voiceModeSupported } from "@/lib/voice";
import type { SendHooks } from "./Chat";

type State = "ouvindo" | "pensando" | "falando" | "parado";
const LABEL: Record<State, string> = {
  ouvindo: "Estou ouvindo…",
  pensando: "Pensando…",
  falando: "Falando · toque para interromper",
  parado: "Toque no anjo para falar",
};

export function VoiceMode({
  theme, sendText, crisisActive, onClose,
}: {
  theme: "marca" | "asas" | "aureola";
  sendText: (t: string, viaAudio: boolean, hooks?: SendHooks) => Promise<void>;
  crisisActive: boolean;
  onClose: () => void;
}) {
  const [state, setState] = useState<State>("parado");
  const [heard, setHeard] = useState("");
  const [reply, setReply] = useState("");
  const [crisis, setCrisis] = useState(crisisActive);
  const [err, setErr] = useState("");
  const rec = useRef<ReturnType<typeof getRecognizer>>(null);
  const speaker = useRef<SentenceSpeaker | null>(null);
  const alive = useRef(true);
  const silentTries = useRef(0);

  function listen() {
    if (!alive.current) return;
    const r = getRecognizer();
    if (!r) return;
    rec.current = r;
    let finalText = "";
    setHeard("");
    r.onresult = (e) => {
      let s = "";
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
      finalText = s;
      setHeard(s);
    };
    r.onerror = () => {};
    r.onend = () => {
      if (!alive.current) return;
      const t = finalText.trim();
      if (!t) {
        // ninguém falou: tenta mais uma vez e depois espera um toque (o microfone não fica ligado para sempre)
        if (silentTries.current++ < 3) return listen();
        return setState("parado");
      }
      silentTries.current = 0;
      think(t);
    };
    setState("ouvindo");
    try { r.start(); } catch { setState("parado"); }
  }

  async function think(t: string) {
    setState("pensando");
    setReply("");
    const sp = new SentenceSpeaker(() => { if (alive.current) listen(); });
    speaker.current = sp;
    await sendText(t, true, {
      onDelta: (d) => {
        setReply((r) => r + d);
        setState((s) => (s === "pensando" ? "falando" : s));
        sp.push(d);
      },
      onRisk: () => setCrisis(true),
      onDone: (ok) => {
        if (!ok) { sp.stop(); setErr("Não consegui responder agora. Toque no anjo para tentar de novo."); setState("parado"); return; }
        sp.end();
      },
    });
  }

  function tap() {
    setErr("");
    if (state === "falando" || state === "pensando") {
      speaker.current?.stop();
      return listen();
    }
    if (state === "ouvindo") { rec.current?.stop(); return; }
    silentTries.current = 0;
    listen();
  }

  function close() {
    alive.current = false;
    speaker.current?.stop();
    try { rec.current?.stop(); } catch {}
    onClose();
  }

  useEffect(() => {
    alive.current = true;
    if (!voiceModeSupported()) {
      setErr("Este navegador não tem reconhecimento de voz. Use o Chrome (Android ou computador) ou o Safari no iPhone.");
      return;
    }
    // a primeira fala precisa nascer de um toque (regra do iPhone): o toque no botão "Voz" já conta
    const hello = new SentenceSpeaker(() => listen());
    speaker.current = hello;
    hello.push("Pode falar, estou ouvindo.");
    hello.end();
    setState("falando");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", onKey);
    return () => { removeEventListener("keydown", onKey); alive.current = false; speaker.current?.stop(); try { rec.current?.stop(); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pulsing = state === "ouvindo" || state === "falando";
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]" role="dialog" aria-modal="true" aria-label="Conversa por voz">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">Modo voz</p>
          <a href="/sos" className="rounded-full bg-[#c62828] px-4 py-2 text-sm font-extrabold text-white">SOS</a>
        </div>

        <button onClick={tap} className="mt-6 flex flex-col items-center rounded-3xl p-4" aria-label={LABEL[state]}>
          <div className={`transition-transform duration-700 ${pulsing ? "voice-pulse" : ""} ${state === "pensando" ? "opacity-70" : ""}`}>
            <AngelArt theme={theme} size={210} />
          </div>
          <p className="mt-6 text-lg font-bold" aria-live="polite">{LABEL[state]}</p>
        </button>

        <div className="mt-2 flex-1 space-y-3 overflow-y-auto">
          {heard && <p className="text-center text-muted">“{heard}”</p>}
          {crisis && <CrisisCard />}
          {reply && <p className="card max-h-56 overflow-y-auto whitespace-pre-wrap p-4 leading-relaxed">{reply}</p>}
          {err && <p className="rounded-xl bg-surface-2 p-3 text-sm" role="alert">{err}</p>}
        </div>

        <button className="btn-ghost mt-4 w-full" onClick={close}>Encerrar e voltar ao texto</button>
        <p className="mt-2 text-center text-xs text-muted">A voz é transcrita pelo serviço do seu navegador (Google ou Apple).</p>
      </div>
    </div>
  );
}
