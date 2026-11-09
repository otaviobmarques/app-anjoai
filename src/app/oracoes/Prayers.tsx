"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SpeakButton } from "@/components/SpeakButton";
import { CrisisCard } from "@/components/CrisisCard";

type Prayer = { id: string; topic: string; content: string; saved: boolean; created_at: string };
type Req = { id: string; request: string; status: string; answer_note: string | null; created_at: string };

export function Prayers({ saved: s0, requests: r0 }: { saved: Prayer[]; requests: Req[] }) {
  const [tab, setTab] = useState<"orar" | "salvas" | "pedidos">("orar");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [current, setCurrent] = useState<Prayer | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [saved, setSaved] = useState(s0);
  const [reqs, setReqs] = useState(r0);
  const [newReq, setNewReq] = useState("");
  const supabase = createClient();

  async function pray(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(""); setCurrent(null);
    const r = await fetch("/api/oracao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Não consegui agora. Tente de novo.");
    setCurrent(j.prayer);
    setCrisis(j.risk >= 2);
  }

  async function save(p: Prayer) {
    await supabase.from("prayers").update({ saved: true }).eq("id", p.id);
    setCurrent({ ...p, saved: true });
    setSaved((x) => [{ ...p, saved: true }, ...x]);
  }
  async function unsave(id: string) {
    await supabase.from("prayers").update({ saved: false }).eq("id", id);
    setSaved((x) => x.filter((p) => p.id !== id));
  }
  async function addReq(e: React.FormEvent) {
    e.preventDefault();
    const t = newReq.trim();
    if (!t) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("prayer_requests").insert({ user_id: user!.id, request: t.slice(0, 500) }).select("*").single();
    if (data) setReqs((x) => [data as Req, ...x]);
    setNewReq("");
  }
  async function answer(id: string) {
    const note = prompt("Como Deus respondeu? (opcional)") ?? "";
    await supabase.from("prayer_requests").update({ status: "respondido", answer_note: note.slice(0, 500) || null, answered_at: new Date().toISOString() }).eq("id", id);
    setReqs((x) => x.map((r) => (r.id === id ? { ...r, status: "respondido", answer_note: note || null } : r)));
  }

  return (
    <div>
      <h1 className="text-lg font-extrabold">Orações</h1>
      <div className="mt-3 flex gap-2" role="tablist">
        {(["orar", "salvas", "pedidos"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-full px-4 py-2 text-sm ${tab === t ? "bg-gold font-bold text-on-gold" : "border border-line"}`}>
            {t === "orar" ? "Pedir oração" : t === "salvas" ? "Salvas" : "Meus pedidos"}
          </button>
        ))}
      </div>

      {tab === "orar" && (
        <section className="mt-5 space-y-4">
          <form onSubmit={pray} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm text-muted">Pelo que você quer orar hoje?</span>
              <textarea className="field min-h-28" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex.: minha entrevista de emprego amanhã, a saúde da minha mãe…" />
            </label>
            {err && <p className="text-sm text-danger">{err}</p>}
            <button className="btn-gold w-full" disabled={busy || !topic.trim()}>{busy ? "Escrevendo a oração…" : "Orar comigo"}</button>
          </form>
          {crisis && <CrisisCard />}
          {current && (
            <article className="card p-5">
              <p className="whitespace-pre-wrap leading-relaxed">{current.content}</p>
              <div className="mt-4 flex gap-2">
                <SpeakButton text={current.content} />
                {!current.saved ? (
                  <button className="rounded-full border border-line px-3 py-1.5 text-xs" onClick={() => save(current)}>Salvar</button>
                ) : (
                  <span className="px-3 py-1.5 text-xs text-gold-text">Salva</span>
                )}
              </div>
            </article>
          )}
        </section>
      )}

      {tab === "salvas" && (
        <section className="mt-5 space-y-3">
          {saved.length === 0 && <p className="text-muted">Você ainda não salvou orações.</p>}
          {saved.map((p) => (
            <article key={p.id} className="card p-5">
              <p className="text-sm font-bold text-gold-text">{p.topic}</p>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{p.content}</p>
              <div className="mt-3 flex gap-2">
                <SpeakButton text={p.content} />
                <button className="rounded-full border border-line px-3 py-1.5 text-xs" onClick={() => unsave(p.id)}>Remover</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === "pedidos" && (
        <section className="mt-5 space-y-3">
          <form onSubmit={addReq} className="flex gap-2">
            <input className="field" value={newReq} onChange={(e) => setNewReq(e.target.value)} placeholder="Novo pedido de oração" aria-label="Novo pedido de oração" />
            <button className="btn-gold shrink-0">Anotar</button>
          </form>
          {reqs.length === 0 && <p className="text-muted">Anote aqui seus pedidos. Depois você pode marcar como Deus respondeu.</p>}
          {reqs.map((r) => (
            <div key={r.id} className="card p-4">
              <p>{r.request}</p>
              {r.status === "respondido" ? (
                <p className="mt-2 text-sm text-gold-text">Respondido{r.answer_note ? `: ${r.answer_note}` : ""}</p>
              ) : (
                <button className="mt-2 text-sm text-gold-text underline" onClick={() => answer(r.id)}>Deus respondeu</button>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
