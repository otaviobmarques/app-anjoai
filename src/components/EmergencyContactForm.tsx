"use client";
import { useState } from "react";

const PROFS = ["Psicóloga(o)", "Terapeuta", "Psiquiatra", "Pastor(a)", "Padre", "Médica(o)", "Outro"];

/** Contato de emergência obrigatório: nome, telefone com DDD e autorização. */
export function EmergencyContactForm({ onSaved, submitLabel = "Salvar e continuar" }: { onSaved: () => void; submitLabel?: string }) {
  const [f, setF] = useState({ kind: "pessoa", name: "", relation: "", profession: PROFS[0], phone: "", email: "", consent: false });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (f.phone.replace(/\D/g, "").length < 10) return setErr("Informe o telefone com DDD.");
    if (!f.consent) return setErr("Confirme que essa pessoa pode ser avisada.");
    setBusy(true);
    const r = await fetch("/api/rede", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Não consegui salvar.");
    onSaved();
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de contato">
        {[["pessoa", "Pessoa de confiança"], ["profissional", "Profissional"]].map(([k, l]) => (
          <button type="button" key={k} role="radio" aria-checked={f.kind === k} onClick={() => setF({ ...f, kind: k })}
            className={`rounded-xl px-3 py-3 text-sm ${f.kind === k ? "bg-gold font-bold text-on-gold" : "border border-line"}`}>{l}</button>
        ))}
      </div>
      <input className="field" placeholder="Nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
      {f.kind === "profissional" ? (
        <select className="field" value={f.profession} onChange={(e) => setF({ ...f, profession: e.target.value })} aria-label="Profissão">
          {PROFS.map((p) => <option key={p}>{p}</option>)}
        </select>
      ) : (
        <input className="field" placeholder="Relação (mãe, cônjuge, amigo…)" value={f.relation} onChange={(e) => setF({ ...f, relation: e.target.value })} />
      )}
      <input className="field" type="tel" placeholder="Telefone com DDD" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required />
      <input className="field" type="email" placeholder="E-mail (opcional)" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--gold)]" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
        Autorizo que essa pessoa seja avisada se eu apertar o SOS ou se o app perceber um risco grave. Ela não vê as minhas conversas.
      </label>
      {err && <p className="text-sm text-danger" role="alert">{err}</p>}
      <button className="btn-gold w-full" disabled={busy}>{busy ? "Salvando…" : submitLabel}</button>
    </form>
  );
}
