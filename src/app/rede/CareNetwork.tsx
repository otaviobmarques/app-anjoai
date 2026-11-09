"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type C = { id: string; name: string; relation: string | null; email: string | null; phone: string | null; status: string; alert_on_risk: boolean; alert_on_sos: boolean; invite_token: string };

const STATUS: Record<string, string> = { pendente: "Aguardando confirmação", confirmado: "Confirmado", recusado: "Recusou" };

export function CareNetwork({ initial, appUrl }: { initial: C[]; appUrl: string }) {
  const [list, setList] = useState(initial);
  const [form, setForm] = useState({ name: "", relation: "", email: "", phone: "", consent: false });
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const supabase = createClient();
  const active = list.filter((c) => c.status !== "recusado");

  // guarda nomes e telefones no aparelho para a tela SOS funcionar sem internet
  useEffect(() => {
    try {
      localStorage.setItem("anjo.sos.contacts", JSON.stringify(list.filter((c) => c.phone && c.status !== "recusado").map((c) => ({ name: c.name, phone: c.phone }))));
    } catch {}
  }, [list]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(""); setInfo("");
    const r = await fetch("/api/rede", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Não consegui salvar.");
    setList((l) => [...l, j.contact]);
    setForm({ name: "", relation: "", email: "", phone: "", consent: false });
    setInfo(j.invited ? "Convite enviado por e-mail." : "Contato salvo. Envie o link de convite abaixo para a pessoa confirmar.");
  }
  async function toggle(c: C, key: "alert_on_risk" | "alert_on_sos") {
    await supabase.from("trusted_contacts").update({ [key]: !c[key] }).eq("id", c.id);
    setList((l) => l.map((x) => (x.id === c.id ? { ...x, [key]: !c[key] } : x)));
  }
  async function remove(c: C) {
    if (!confirm(`Remover ${c.name} da sua Rede de Cuidado?`)) return;
    await supabase.from("trusted_contacts").delete().eq("id", c.id);
    setList((l) => l.filter((x) => x.id !== c.id));
  }
  async function share(c: C) {
    const url = `${appUrl || location.origin}/convite/${c.invite_token}`;
    const text = `Oi, ${c.name}! Escolhi você como pessoa de confiança no Anjo IA. Se um dia eu precisar de ajuda, você recebe um aviso. Pode confirmar aqui? ${url}`;
    if (navigator.share) await navigator.share({ text }).catch(() => {});
    else { await navigator.clipboard.writeText(text); setInfo("Convite copiado. Cole numa mensagem para a pessoa."); }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-extrabold">Rede de Cuidado</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted">Até duas pessoas de confiança. Elas recebem um aviso por e-mail quando você aperta o SOS ou quando o app percebe um risco grave. Elas nunca recebem o conteúdo das conversas.</p>
      </header>

      {active.map((c) => (
        <div key={c.id} className="card space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold">{c.name}{c.relation ? <span className="font-normal text-muted"> · {c.relation}</span> : null}</p>
              <p className="text-sm text-muted">{[c.email, c.phone].filter(Boolean).join(" · ")}</p>
            </div>
            <span className={`rounded-full px-2 py-1 text-xs ${c.status === "confirmado" ? "bg-gold text-on-gold" : "border border-line"}`}>{STATUS[c.status]}</span>
          </div>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 accent-[var(--gold)]" checked={c.alert_on_sos} onChange={() => toggle(c, "alert_on_sos")} /> Avisar quando eu apertar SOS</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 accent-[var(--gold)]" checked={c.alert_on_risk} onChange={() => toggle(c, "alert_on_risk")} /> Avisar se o app perceber risco grave</label>
          <div className="flex gap-2">
            {c.status === "pendente" && <button className="btn-ghost flex-1 text-sm" onClick={() => share(c)}>Enviar convite</button>}
            <button className="btn-ghost text-sm" onClick={() => remove(c)}>Remover</button>
          </div>
        </div>
      ))}

      {active.length < 2 && (
        <form onSubmit={add} className="card space-y-3 p-4">
          <p className="font-bold">Adicionar pessoa de confiança</p>
          <input className="field" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="field" placeholder="Relação (mãe, amigo, pastor…)" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
          <input className="field" type="email" placeholder="E-mail (para receber os avisos)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" type="tel" placeholder="Telefone (para ligar pelo SOS)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--gold)]" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
            Autorizo que essa pessoa seja avisada em caso de SOS ou risco grave. Ela precisa confirmar o convite.
          </label>
          {err && <p className="text-sm text-danger">{err}</p>}
          <button className="btn-gold w-full" disabled={busy}>{busy ? "Salvando…" : "Adicionar"}</button>
        </form>
      )}
      {info && <p className="rounded-xl bg-surface-2 p-3 text-sm" role="status">{info}</p>}
    </div>
  );
}
