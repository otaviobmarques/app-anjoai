"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCPF } from "@/lib/cpf";

type Msg = { role: "user" | "assistant"; content: string; at: string; risk: number | null; audio: boolean };
type H = {
  person: { email: string; name: string | null; phone: string | null; tradition: string; bible_version: string; plan: string; created_at: string; last_sign_in_at: string | null; terms_version: string | null; terms_accepted_at: string | null } | null;
  memory: { summary: string; version: number; updated_at: string } | null;
  conversations: { id: string; title: string | null; created_at: string; updated_at: string; messages: Msg[] | null }[];
  risk_events: { id: string; level: number; source: string; reason: string | null; review: string; at: string }[];
  alerts: { channel: string; status: string; contact: string | null; acked_at: string | null; at: string }[];
  contacts: { name: string; kind: string; profession: string | null; relation: string | null; status: string; linked: boolean }[];
  prayers: { topic: string; saved: boolean; at: string }[];
  prayer_requests: { request: string; status: string; answer: string | null; at: string }[];
  access_log: { admin: string; reason: string; at: string }[];
};

const REASONS = ["Revisão de caso de risco", "Pedido da própria pessoa", "Suporte técnico", "Acompanhamento do teste fechado"];
const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "—");

export function PersonHistory({ userId }: { userId: string }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [other, setOther] = useState("");
  const [h, setH] = useState<H | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [openConv, setOpenConv] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");

  const [cpf, setCpf] = useState<string | null>(null);
  const [link, setLink] = useState("");
  async function makeLink() {
    const r = await fetch("/api/admin/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    const j = await r.json().catch(() => ({}));
    setLink(r.ok ? j.link : "erro");
  }
  async function resetPassword() {
    if (!confirm("Gerar um PIN novo para esta pessoa? O PIN atual deixa de funcionar.")) return;
    const r = await fetch("/api/admin/pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    const j = await r.json().catch(() => ({}));
    setNewPw(r.ok ? j.pin : "erro");
  }

  async function load(e: React.FormEvent) {
    e.preventDefault();
    const r = reason === "Outro" ? other.trim() : reason;
    if (r.length < 5) return setErr("Descreva o motivo do acesso.");
    setBusy(true); setErr("");
    const { data, error } = await createClient().rpc("admin_person_history", { p_user: userId, p_reason: r });
    setBusy(false);
    if (error) return setErr("Não consegui abrir o histórico.");
    setH(data as H);
    const { data: c } = await createClient().rpc("admin_person_cpf", { p_user: userId });
    setCpf((c as string) || null);
    const first = (data as H).conversations[0];
    if (first) setOpenConv(first.id);
  }

  async function review(id: string, status: "revisado" | "falso_alarme") {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("risk_events").update({ review_status: status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    setH((x) => x && { ...x, risk_events: x.risk_events.map((e) => (e.id === id ? { ...e, review: status } : e)) });
  }

  if (!h) {
    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 py-10">
        <Link href="/admin/pessoas" className="text-sm text-muted underline">‹ Pessoas</Link>
        <h1 className="text-xl font-extrabold">Abrir histórico</h1>
        <p className="text-sm leading-relaxed text-muted">O histórico tem dados sensíveis (fé e saúde emocional, LGPD art. 11). Abra só quando for necessário. Este acesso fica registrado com o seu nome, a data e o motivo, e a pessoa pode ver esse registro ao baixar os dados dela.</p>
        <form onSubmit={load} className="card space-y-3 p-4">
          <fieldset>
            <legend className="mb-2 text-sm text-muted">Motivo do acesso</legend>
            <div className="space-y-2">
              {[...REASONS, "Outro"].map((r) => (
                <label key={r} className="flex items-center gap-3 text-sm">
                  <input type="radio" name="motivo" className="h-5 w-5 accent-[var(--gold)]" checked={reason === r} onChange={() => setReason(r)} /> {r}
                </label>
              ))}
            </div>
          </fieldset>
          {reason === "Outro" && <input className="field" placeholder="Descreva o motivo" value={other} onChange={(e) => setOther(e.target.value)} />}
          {err && <p className="text-sm text-danger">{err}</p>}
          <button className="btn-gold w-full" disabled={busy}>{busy ? "Abrindo…" : "Registrar acesso e abrir"}</button>
        </form>
      </div>
    );
  }

  const p = h.person;
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <Link href="/admin/pessoas" className="text-sm text-muted underline">‹ Pessoas</Link>
        <span className="text-xs text-muted">Acesso registrado: {reason === "Outro" ? other : reason}</span>
      </header>

      <section className="card p-5">
        <h1 className="text-xl font-extrabold">{p?.name || "Sem nome"}</h1>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">Login</dt><dd>{cpf ? `CPF ${formatCPF(cpf)} + PIN` : p?.email}</dd>
          <dt className="text-muted">Telefone</dt><dd>{p?.phone || "—"}</dd>
          <dt className="text-muted">Tradição</dt><dd>{p?.tradition} · {p?.bible_version}</dd>
          <dt className="text-muted">Plano</dt><dd>{p?.plan}</dd>
          <dt className="text-muted">Cadastro</dt><dd>{fmt(p?.created_at)} · último acesso {fmt(p?.last_sign_in_at)}</dd>
          <dt className="text-muted">Termos</dt><dd>{p?.terms_version || "não aceitou"} {p?.terms_accepted_at ? `em ${fmt(p.terms_accepted_at)}` : ""}</dd>
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {cpf && <button className="btn-ghost text-sm" onClick={resetPassword}>Gerar PIN novo</button>}
          {cpf && <button className="btn-ghost text-sm" onClick={makeLink}>Gerar link de acesso</button>}
          {link && link !== "erro" && <span className="w-full break-all rounded-xl bg-surface-2 p-2 font-mono text-xs">{link} <button className="ml-2 underline" onClick={() => navigator.clipboard.writeText(link)}>copiar</button></span>}
          {newPw && newPw !== "erro" && <span className="text-sm">PIN provisório: <strong className="font-mono text-lg">{newPw}</strong> (a pessoa cria o dela no próximo acesso)</span>}
          {newPw === "erro" && <span className="text-sm text-danger">Não consegui gerar.</span>}
        </div>
      </section>

      {h.risk_events.length > 0 && (
        <section>
          <h2 className="font-bold">Eventos de risco</h2>
          <ul className="mt-2 space-y-2">
            {h.risk_events.map((e) => (
              <li key={e.id} className={`card flex flex-wrap items-center justify-between gap-2 p-3 text-sm ${e.level >= 3 ? "border-danger" : ""}`}>
                <span><strong>Nível {e.level}</strong> · {e.source} · {fmt(e.at)} · {e.reason}</span>
                {e.review === "pendente" ? (
                  <span className="flex gap-2">
                    <button className="rounded-full border border-line px-3 py-1 text-xs" onClick={() => review(e.id, "revisado")}>Revisado</button>
                    <button className="rounded-full border border-line px-3 py-1 text-xs" onClick={() => review(e.id, "falso_alarme")}>Falso alarme</button>
                  </span>
                ) : <span className="text-xs text-muted">{e.review}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-bold">Conversas ({h.conversations.length})</h2>
        <div className="mt-2 grid gap-3 md:grid-cols-[240px_1fr]">
          <ul className="space-y-1">
            {h.conversations.map((c) => (
              <li key={c.id}>
                <button onClick={() => setOpenConv(c.id)} className={`w-full rounded-xl p-3 text-left text-sm ${openConv === c.id ? "bg-gold text-on-gold" : "card"}`}>
                  <span className="block truncate font-bold">{c.title || "Conversa"}</span>
                  <span className="text-xs opacity-80">{fmt(c.updated_at)} · {c.messages?.length ?? 0} mensagens</span>
                </button>
              </li>
            ))}
            {h.conversations.length === 0 && <li className="text-sm text-muted">Nenhuma conversa.</li>}
          </ul>
          <div className="space-y-2">
            {(h.conversations.find((c) => c.id === openConv)?.messages ?? []).map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-gold text-on-gold" : "card"} ${m.risk && m.risk >= 2 ? "ring-2 ring-[var(--danger)]" : ""}`}>
                  {m.content}
                  <span className="mt-1 block text-[11px] opacity-70">{m.role === "user" ? "Pessoa" : "Anjo"} · {fmt(m.at)}{m.audio ? " · por voz" : ""}{m.risk ? ` · risco ${m.risk}` : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="font-bold">Memória da jornada</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{h.memory?.summary || "Vazia."}</p>
        </div>
        <div className="card p-4">
          <h2 className="font-bold">Rede de Cuidado</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {h.contacts.map((c, i) => <li key={i}>{c.name} · {c.kind === "profissional" ? c.profession : c.relation || "Anjo da Guarda"} · {c.status}{c.linked ? " · no app" : ""}</li>)}
            {h.contacts.length === 0 && <li className="text-muted">Nenhum contato.</li>}
          </ul>
          {h.alerts.length > 0 && <>
            <h3 className="mt-3 text-sm font-bold">Avisos enviados</h3>
            <ul className="mt-1 space-y-1 text-xs text-muted">{h.alerts.map((a, i) => <li key={i}>{fmt(a.at)} · {a.contact || "—"} · {a.channel} · {a.status}{a.acked_at ? ` · atendido ${fmt(a.acked_at)}` : ""}</li>)}</ul>
          </>}
        </div>
        <div className="card p-4">
          <h2 className="font-bold">Orações pedidas</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">{h.prayers.map((x, i) => <li key={i}>{fmt(x.at)} · {x.topic}{x.saved ? " · salva" : ""}</li>)}{h.prayers.length === 0 && <li>Nenhuma.</li>}</ul>
        </div>
        <div className="card p-4">
          <h2 className="font-bold">Pedidos de oração</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">{h.prayer_requests.map((x, i) => <li key={i}>{fmt(x.at)} · {x.request} · {x.status}{x.answer ? ` (${x.answer})` : ""}</li>)}{h.prayer_requests.length === 0 && <li>Nenhum.</li>}</ul>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-bold">Registro de acessos da equipe a esta pessoa</h2>
        <ul className="mt-2 space-y-1 text-xs text-muted">{h.access_log.map((l, i) => <li key={i}>{fmt(l.at)} · {l.admin} · {l.reason}</li>)}</ul>
      </section>
    </div>
  );
}
