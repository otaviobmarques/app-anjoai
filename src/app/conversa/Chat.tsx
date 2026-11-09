"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CrisisCard } from "@/components/CrisisCard";
import { getRecognizer, speak, stopSpeaking } from "@/lib/voice";

type Msg = { role: "user" | "assistant"; content: string; crisis?: boolean; alerted?: { sent: number; total: number } | null };

export function Chat({ conversationId, initial, name, voiceReplies }: { conversationId: string | null; initial: Msg[]; name: string | null; voiceReplies: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voice, setVoice] = useState(voiceReplies);
  const [notice, setNotice] = useState("");
  const conv = useRef<string | null>(conversationId);
  const viaAudio = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const rec = useRef<ReturnType<typeof getRecognizer>>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs]);
  useEffect(() => () => stopSpeaking(), []);

  function toggleMic() {
    if (listening) { rec.current?.stop(); return; }
    const r = getRecognizer();
    if (!r) { setNotice("Seu navegador não permite ditar por voz. No iPhone, use o microfone do teclado."); return; }
    rec.current = r;
    const base = text ? text + " " : "";
    r.onresult = (e) => {
      let s = "";
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
      setText(base + s);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    viaAudio.current = true;
    setListening(true);
    r.start();
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    setNotice("");
    setBusy(true);
    stopSpeaking();
    setMsgs((m) => [...m, { role: "user", content: t }, { role: "assistant", content: "" }]);
    const patchLast = (f: (m: Msg) => Msg) => setMsgs((m) => { const c = [...m]; c[c.length - 1] = f(c[c.length - 1]); return c; });

    let full = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conv.current, text: t, viaAudio: viaAudio.current }),
      });
      viaAudio.current = false;
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setMsgs((m) => m.slice(0, -1));
        setNotice(j.message || "Não consegui enviar agora. Tente de novo.");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i); buf = buf.slice(i + 1);
          if (!line) continue;
          const ev = JSON.parse(line);
          if (ev.t === "meta") conv.current = ev.conversationId;
          else if (ev.t === "delta") { full += ev.text; patchLast((m) => ({ ...m, content: m.content + ev.text })); }
          else if (ev.t === "risk" && ev.level >= 2) patchLast((m) => ({ ...m, crisis: true }));
          else if (ev.t === "alerted") patchLast((m) => ({ ...m, crisis: true, alerted: { sent: ev.sent, total: ev.total } }));
          else if (ev.t === "error") { setNotice(ev.message); }
        }
      }
    } catch {
      setNotice("A conexão caiu. Se precisar de ajuda agora, toque em SOS.");
    } finally {
      setBusy(false);
      setMsgs((m) => (m.length && m[m.length - 1].role === "assistant" && !m[m.length - 1].content && !m[m.length - 1].crisis ? m.slice(0, -1) : m));
      if (voice && full) speak(full);
    }
  }

  const first = name?.split(" ")[0];
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <header className="flex items-center justify-between pb-3">
        <h1 className="text-lg font-extrabold">Conversa</h1>
        <div className="flex gap-2">
          <button className={`rounded-full border px-3 py-1.5 text-xs ${voice ? "border-gold text-gold-text" : "border-line text-muted"}`} onClick={() => { setVoice(!voice); stopSpeaking(); }} aria-pressed={voice}>
            {voice ? "Voz ligada" : "Voz desligada"}
          </button>
          <Link href="/conversa?nova=1" className="rounded-full border border-line px-3 py-1.5 text-xs">Nova</Link>
        </div>
      </header>

      <div className="flex-1 space-y-3" aria-live="polite">
        {msgs.length === 0 && (
          <div className="card p-5 leading-relaxed">
            <p>Oi{first ? `, ${first}` : ""}. Que bom que você veio.</p>
            <p className="mt-2 text-muted">Pode me contar o que está no seu coração, por texto ou pelo microfone. Estou aqui para ouvir, aconselhar e orar com você.</p>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 leading-relaxed ${m.role === "user" ? "bg-gold text-on-gold" : "card"}`}>
              {m.crisis && <div className="mb-3"><CrisisCard alreadyAlerted={m.alerted} /></div>}
              {m.content || (busy && i === msgs.length - 1 ? <span className="text-muted">…</span> : null)}
              {m.role === "assistant" && m.content && !busy && (
                <button className="mt-2 block text-xs text-muted underline" onClick={() => speak(m.content)}>Ouvir</button>
              )}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>

      {notice && <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm" role="status">{notice}</p>}

      <form onSubmit={send} className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] mt-3 flex items-end gap-2 bg-bg py-2 pr-[4.75rem]">
        <button type="button" onClick={toggleMic} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${listening ? "border-gold bg-gold text-on-gold" : "border-line bg-surface"}`} aria-label={listening ? "Parar de gravar" : "Falar"} aria-pressed={listening}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
        </button>
        <textarea
          className="field max-h-40 min-h-12 flex-1 resize-none"
          rows={1}
          placeholder={listening ? "Ouvindo…" : "Escreva aqui…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          aria-label="Mensagem"
        />
        <button className="btn-gold h-12 shrink-0 px-4" disabled={busy || !text.trim()} aria-label="Enviar">Enviar</button>
      </form>
    </div>
  );
}
