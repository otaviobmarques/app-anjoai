"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MOODS, moodById } from "@/lib/moods";

/** "Como você está hoje?" — opcional. O Anjo usa a resposta na próxima conversa. */
export function MoodCheckin({ firstName }: { firstName?: string }) {
  const [sel, setSel] = useState<string[]>([]);
  const [state, setState] = useState<"pergunta" | "salvo" | "fechado">("pergunta");
  const [busy, setBusy] = useState(false);
  // "Agora não" vale até o fim do dia (horário de Brasília) neste aparelho
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  useEffect(() => {
    try { if (localStorage.getItem("anjo.humor.pulado") === today) setState("fechado"); } catch {}
  }, [today]);
  function skip() {
    try { localStorage.setItem("anjo.humor.pulado", today); } catch {}
    setState("fechado");
  }

  if (state === "fechado") return null;

  function toggle(id: string) {
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id]));
  }

  async function save() {
    if (!sel.length) return;
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("mood_checkins").insert({ user_id: user.id, moods: sel });
      if (sel.includes("pensamentos_ruins")) {
        // sinal leve, só para a equipe olhar com cuidado (não avisa o Anjo da Guarda sozinho)
        await supabase.rpc("log_risk_event", { p_level: 1, p_source: "humor", p_reason: "check-in do dia: com pensamentos ruins" });
      }
    }
    setBusy(false);
    setState("salvo");
  }

  if (state === "salvo") {
    const main = moodById(sel.find((s) => moodById(s)?.heavy) ?? sel[0]);
    const dark = sel.includes("pensamentos_ruins");
    return (
      <section className="card space-y-3 p-5" aria-live="polite">
        <p className="text-lg leading-snug">{main?.emoji} {main?.reply}</p>
        <Link href="/conversa" className="btn-gold flex w-full items-center justify-center">Conversar com o Anjo</Link>
        {dark && (
          <p className="text-sm text-muted">
            Se esses pensamentos forem de se machucar, ligue agora para o <a href="tel:188" className="font-bold text-danger underline">CVV, 188</a> (24 horas, gratuito) ou toque em <Link href="/sos" className="font-bold underline">SOS</Link>.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="card space-y-4 p-5" aria-labelledby="humor-titulo">
      <div className="flex items-start justify-between gap-3">
        <h2 id="humor-titulo" className="text-lg font-extrabold">Como você está hoje{firstName ? `, ${firstName}` : ""}?</h2>
        <button className="shrink-0 text-xs text-muted underline" onClick={skip}>Agora não</button>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Escolha até 3">
        {MOODS.map((m) => (
          <button key={m.id} type="button" onClick={() => toggle(m.id)} aria-pressed={sel.includes(m.id)}
            className={`rounded-full px-3 py-2 text-sm transition ${sel.includes(m.id) ? "bg-gold font-bold text-on-gold" : "border border-line bg-surface"}`}>
            <span aria-hidden>{m.emoji}</span> {m.label}
          </button>
        ))}
      </div>
      {sel.length > 0 && <button className="btn-gold w-full" onClick={save} disabled={busy}>{busy ? "Guardando…" : "Contar ao Anjo"}</button>}
      <p className="text-xs text-muted">Pode escolher até 3. Só o Anjo fica sabendo, para te acolher melhor.</p>
    </section>
  );
}
