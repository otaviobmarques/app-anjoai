"use client";
import { useEffect, useRef, useState } from "react";
import { speak, stopSpeaking } from "@/lib/voice";

type V = { id: string; name: string; preview?: string; labels: Record<string, string>; category?: string };
type Res = { configured: boolean; error?: string; current?: { id: string; name?: string }; voices: V[] };

export function VoicePicker() {
  const [data, setData] = useState<Res | null>(null);
  const [sel, setSel] = useState("");
  const [msg, setMsg] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/admin/vozes").then((r) => r.json()).then((j: Res) => { setData(j); setSel(j.current?.id ?? ""); }).catch(() => setData({ configured: false, voices: [] }));
  }, []);

  if (!data) return <p className="text-sm text-muted">Carregando vozes…</p>;
  if (!data.configured) return <p className="text-sm text-danger">Voz natural não configurada. Coloque ELEVENLABS_API_KEY na Vercel. Enquanto isso, o app usa a voz do navegador.</p>;
  if (data.error) return <p className="text-sm text-danger">Não consegui listar as vozes: {data.error}</p>;

  const voices = [...data.voices].sort((a, b) => a.name.localeCompare(b.name));
  const cur = voices.find((v) => v.id === sel);

  function preview(v?: V) {
    if (!v?.preview) return;
    audio.current?.pause();
    audio.current = new Audio(v.preview);
    void audio.current.play();
  }
  async function save() {
    const v = voices.find((x) => x.id === sel);
    const r = await fetch("/api/admin/vozes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sel, name: v?.name }) });
    setMsg(r.ok ? "Voz salva. Ela já vale para todas as conversas." : "Não consegui salvar.");
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm text-muted">Voz do Anjo ({voices.length} disponíveis na sua conta ElevenLabs)</span>
        <select className="field" value={sel} onChange={(e) => { setSel(e.target.value); setMsg(""); }}>
          {!cur && <option value={sel}>Voz padrão ({sel})</option>}
          {voices.map((v) => (
            <option key={v.id} value={v.id}>{v.name}{v.labels.gender ? ` · ${v.labels.gender}` : ""}{v.labels.accent ? ` · ${v.labels.accent}` : ""}{v.category ? ` · ${v.category}` : ""}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost text-sm" onClick={() => preview(cur)} disabled={!cur?.preview}>Prévia (inglês)</button>
        <button className="btn-ghost text-sm" onClick={() => { stopSpeaking(); speak("Oi, eu sou o Anjo. Estou aqui com você. Pode me contar o que está no seu coração."); }}>Ouvir em português (voz salva)</button>
        <button className="btn-gold text-sm" onClick={save}>Salvar voz</button>
      </div>
      {msg && <p className="text-sm text-gold-text" role="status">{msg}</p>}
      <p className="text-xs text-muted">Dica: adicione vozes brasileiras da Voice Library do ElevenLabs à sua conta; elas aparecem nesta lista. Salve e depois toque em “Ouvir em português”.</p>
    </div>
  );
}
