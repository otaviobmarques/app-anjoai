"use client";
import Link from "next/link";
import { useState } from "react";
import { formatCPF, onlyDigits, validCPF } from "@/lib/cpf";
import { RELATIONS } from "@/components/TrustedContactFields";

type Done = { name: string; cpf: string; pin: string; accessLink: string | null; inviteLink: string; contactName: string; phone: string; contactPhone: string; forceChange: boolean };

const randomPin = () => {
  const a = new Uint32Array(1); crypto.getRandomValues(a);
  let p = String(a[0] % 10000).padStart(4, "0");
  if (/^(\d)\1{3}$/.test(p)) p = String((Number(p) + 1379) % 10000).padStart(4, "0");
  return p;
};
const waLink = (phone: string, text: string) => {
  let d = onlyDigits(phone); if (d.length === 10 || d.length === 11) d = "55" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
};

export function NewPerson() {
  const empty = { name: "", cpf: "", pin: randomPin(), phone: "", cName: "", cPhone: "", cRelation: "", consent: false, forceChange: false };
  const [f, setF] = useState(empty);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [copied, setCopied] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!f.name.trim()) return setErr("Informe o nome.");
    if (!validCPF(f.cpf)) return setErr("Confira o CPF (é o usuário).");
    if (!/^\d{4}$/.test(f.pin)) return setErr("O PIN tem 4 números.");
    if (onlyDigits(f.phone).length < 10) return setErr("Informe o telefone da pessoa com DDD.");
    if (!f.cName.trim() || onlyDigits(f.cPhone).length < 10) return setErr("Informe o nome e o telefone (com DDD) do Anjo da Guarda.");
    if (!f.consent) return setErr("Confirme que a pessoa autorizou o Anjo da Guarda a ser avisado.");
    setBusy(true);
    const r = await fetch("/api/admin/pessoas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Não consegui cadastrar.");
    setDone({ name: f.name.trim(), cpf: f.cpf, pin: j.pin, accessLink: j.accessLink, inviteLink: j.inviteLink, contactName: f.cName.trim(), phone: f.phone, contactPhone: f.cPhone, forceChange: f.forceChange });
  }
  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label); setTimeout(() => setCopied(""), 1500);
  }

  if (done) {
    const first = done.name.split(" ")[0];
    const msgPessoa = `Olá, ${first}! O seu acesso ao Anjo IA está pronto 👼\n\nToque no link para entrar:\n${done.accessLink}\n\nUsuário: o seu CPF\nPIN: ${done.pin}${done.forceChange ? "\n\nNo primeiro acesso você cria o seu próprio PIN." : ""}`;
    const msgAnjo = `Olá, ${done.contactName.split(" ")[0]}! ${done.name} escolheu você como Anjo da Guarda no Anjo IA 👼 Se um dia ${first} precisar de ajuda, você recebe um aviso no celular. Aceite por aqui: ${done.inviteLink}`;
    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 py-10">
        <h1 className="text-xl font-extrabold">{done.name} foi cadastrado(a)</h1>
        <div className="card space-y-2 p-4">
          <p className="text-sm text-muted">Link de acesso (válido por 30 dias)</p>
          <p className="break-all rounded-xl bg-surface-2 p-3 font-mono text-sm">{done.accessLink}</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-muted">Usuário</p><p className="font-bold">{done.cpf}</p></div>
            <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-muted">PIN</p><p className="font-mono text-xl font-extrabold">{done.pin}</p></div>
          </div>
        </div>
        <div className="card space-y-3 p-4">
          <p className="font-bold">1. Mande o acesso para a pessoa</p>
          <pre className="whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-sm [overflow-wrap:anywhere]">{msgPessoa}</pre>
          <div className="grid grid-cols-2 gap-2">
            <a href={waLink(done.phone, msgPessoa)} target="_blank" rel="noopener" className="flex min-h-12 items-center justify-center rounded-full bg-[#1f7a4d] px-3 text-sm font-bold text-white">Enviar no WhatsApp</a>
            <button className="btn-ghost text-sm" onClick={() => copy("pessoa", msgPessoa)}>{copied === "pessoa" ? "Copiado" : "Copiar"}</button>
          </div>
        </div>
        <div className="card space-y-3 p-4">
          <p className="font-bold">2. Mande o convite para o Anjo da Guarda</p>
          <pre className="whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-sm [overflow-wrap:anywhere]">{msgAnjo}</pre>
          <div className="grid grid-cols-2 gap-2">
            <a href={waLink(done.contactPhone, msgAnjo)} target="_blank" rel="noopener" className="flex min-h-12 items-center justify-center rounded-full bg-[#1f7a4d] px-3 text-sm font-bold text-white">Enviar no WhatsApp</a>
            <button className="btn-ghost text-sm" onClick={() => copy("anjo", msgAnjo)}>{copied === "anjo" ? "Copiado" : "Copiar"}</button>
          </div>
          <p className="text-xs text-muted">O telefone do Anjo da Guarda já vale no SOS da pessoa. O convite serve para ele(a) receber os avisos no celular.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => { setDone(null); setF({ ...empty, pin: randomPin() }); }}>Cadastrar outra pessoa</button>
          <Link href="/admin/pessoas" className="btn-ghost flex flex-1 items-center justify-center">Ver lista</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Cadastrar pessoa</h1>
        <Link href="/admin/pessoas" className="text-sm text-muted underline">‹ Pessoas</Link>
      </header>
      <form onSubmit={save} className="space-y-5">
        <fieldset className="card space-y-3 p-4">
          <legend className="px-1 font-bold">Pessoa</legend>
          <input className="field" placeholder="Nome" value={f.name} onChange={set("name")} aria-label="Nome" />
          <label className="block"><span className="mb-1 block text-sm text-muted">Usuário (CPF)</span>
            <input className="field" inputMode="numeric" placeholder="000.000.000-00" value={f.cpf} onChange={(e) => setF({ ...f, cpf: formatCPF(e.target.value) })} aria-label="Usuário (CPF)" />
          </label>
          <label className="block"><span className="mb-1 block text-sm text-muted">PIN (4 números)</span>
            <div className="flex gap-2">
              <input className="field text-center font-mono text-xl tracking-[0.4em]" inputMode="numeric" maxLength={4} value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })} aria-label="PIN" />
              <button type="button" className="btn-ghost shrink-0 text-sm" onClick={() => setF({ ...f, pin: randomPin() })}>Gerar</button>
            </div>
          </label>
          <label className="block"><span className="mb-1 block text-sm text-muted">Telefone (WhatsApp) — usado para redefinir o PIN</span>
            <input className="field" type="tel" placeholder="(11) 99999-0000" value={f.phone} onChange={set("phone")} aria-label="Telefone" />
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--gold)]" checked={f.forceChange} onChange={(e) => setF({ ...f, forceChange: e.target.checked })} />
            Pedir para a pessoa criar o próprio PIN no primeiro acesso
          </label>
        </fieldset>

        <fieldset className="card space-y-3 p-4">
          <legend className="px-1 font-bold">Anjo da Guarda <span className="text-xs font-normal text-muted">(contato de emergência)</span></legend>
          <input className="field" placeholder="Nome do Anjo da Guarda" value={f.cName} onChange={set("cName")} aria-label="Nome do Anjo da Guarda" />
          <input className="field" type="tel" placeholder="Telefone do Anjo da Guarda, com DDD" value={f.cPhone} onChange={set("cPhone")} aria-label="Telefone do Anjo da Guarda" />
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Quem é">
            {RELATIONS.map((r) => (
              <button type="button" key={r} role="radio" aria-checked={f.cRelation === r} onClick={() => setF({ ...f, cRelation: r })}
                className={`rounded-full px-3 py-1.5 text-sm ${f.cRelation === r ? "bg-gold font-bold text-on-gold" : "border border-line"}`}>{r}</button>
            ))}
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--gold)]" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
            A pessoa autorizou que o Anjo da Guarda seja avisado em caso de SOS ou risco grave.
          </label>
        </fieldset>

        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <button className="btn-gold w-full" disabled={busy}>{busy ? "Cadastrando…" : "Cadastrar e gerar link de acesso"}</button>
      </form>
    </div>
  );
}
