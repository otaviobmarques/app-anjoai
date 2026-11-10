"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PROFS = ["Psicóloga(o)", "Terapeuta", "Psiquiatra", "Pastor(a)", "Padre", "Médica(o)", "Outro"];

function tempPassword() {
  const words = ["Luz", "Paz", "Fe", "Graca", "Asas", "Ceu", "Amor", "Vida"];
  const a = new Uint32Array(3); crypto.getRandomValues(a);
  return `${words[a[0] % words.length]}${words[a[1] % words.length]}-${1000 + (a[2] % 9000)}`;
}

type Done = { email: string; password: string; name: string; contactName: string; inviteUrl: string; userId: string };

export function NewPerson({ appUrl }: { appUrl: string }) {
  const empty = { name: "", email: "", phone: "", password: tempPassword(), cKind: "pessoa", cName: "", cRelation: "", cProfession: PROFS[0], cPhone: "", cEmail: "", consent: false };
  const [f, setF] = useState(empty);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [copied, setCopied] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (f.cPhone.replace(/\D/g, "").length < 10) return setErr("O contato de emergência precisa de telefone com DDD.");
    if (!f.consent) return setErr("Confirme que a pessoa autorizou o contato de emergência.");
    setBusy(true);
    const { data, error } = await createClient().rpc("admin_create_person", {
      p_name: f.name, p_email: f.email, p_phone: f.phone, p_password: f.password,
      p_contact_name: f.cName, p_contact_phone: f.cPhone, p_contact_relation: f.cRelation || null,
      p_contact_kind: f.cKind, p_contact_email: f.cEmail || null, p_contact_profession: f.cKind === "profissional" ? f.cProfession : null,
    });
    setBusy(false);
    if (error) {
      const m = error.message;
      return setErr(/já cadastrado/.test(m) ? "Esse e-mail já tem conta." : /inválido|obrigatório|menos de 8/.test(m) ? m.charAt(0).toUpperCase() + m.slice(1) + "." : "Não consegui cadastrar.");
    }
    const r = data as { user_id: string; email: string; invite_token: string };
    setDone({ email: r.email, password: f.password, name: f.name.trim(), contactName: f.cName.trim(), inviteUrl: `${appUrl}/convite/${r.invite_token}`, userId: r.user_id });
  }

  async function copy(label: string, text: string) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  if (done) {
    const first = done.name.split(" ")[0];
    const msgPessoa = `Olá, ${first}! Seu acesso ao Anjo IA está pronto.\n\nEntre em ${appUrl}/entrar\nE-mail: ${done.email}\nSenha provisória: ${done.password}\n\nNo primeiro acesso você cria a sua própria senha.`;
    const msgContato = `Olá, ${done.contactName}! ${done.name} cadastrou você como contato de emergência no Anjo IA. Se um dia ${first} precisar de ajuda, você recebe um aviso no celular. Aceite por aqui: ${done.inviteUrl}`;
    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 py-10">
        <h1 className="text-xl font-extrabold">{done.name} foi cadastrado(a)</h1>
        <div className="card space-y-3 p-4">
          <p className="font-bold">1. Envie o acesso para a pessoa</p>
          <pre className="whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-sm">{msgPessoa}</pre>
          <button className="btn-gold w-full" onClick={() => copy("pessoa", msgPessoa)}>{copied === "pessoa" ? "Copiado" : "Copiar mensagem"}</button>
          <p className="text-xs text-muted">A senha provisória só aparece agora. No primeiro acesso a pessoa aceita os termos e cria a própria senha.</p>
        </div>
        <div className="card space-y-3 p-4">
          <p className="font-bold">2. Envie o convite para o contato de emergência</p>
          <pre className="whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-sm">{msgContato}</pre>
          <button className="btn-ghost w-full" onClick={() => copy("contato", msgContato)}>{copied === "contato" ? "Copiado" : "Copiar convite"}</button>
          <p className="text-xs text-muted">O telefone já fica no SOS da pessoa. Para receber os avisos no app, o contato precisa aceitar o convite.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => { setDone(null); setF({ ...empty, password: tempPassword() }); }}>Cadastrar outra pessoa</button>
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
          <input className="field" placeholder="Nome completo" value={f.name} onChange={set("name")} required />
          <input className="field" type="email" placeholder="E-mail (é o login)" value={f.email} onChange={set("email")} required />
          <input className="field" type="tel" placeholder="Telefone com DDD" value={f.phone} onChange={set("phone")} />
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Senha provisória</span>
            <div className="flex gap-2">
              <input className="field font-mono" value={f.password} onChange={set("password")} minLength={8} required />
              <button type="button" className="btn-ghost shrink-0 text-sm" onClick={() => setF({ ...f, password: tempPassword() })}>Gerar</button>
            </div>
          </label>
        </fieldset>

        <fieldset className="card space-y-3 p-4">
          <legend className="px-1 font-bold">Contato de emergência <span className="text-danger">(obrigatório)</span></legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de contato">
            {[["pessoa", "Pessoa de confiança"], ["profissional", "Profissional"]].map(([k, l]) => (
              <button type="button" key={k} role="radio" aria-checked={f.cKind === k} onClick={() => setF({ ...f, cKind: k })}
                className={`rounded-xl px-3 py-3 text-sm ${f.cKind === k ? "bg-gold font-bold text-on-gold" : "border border-line"}`}>{l}</button>
            ))}
          </div>
          <input className="field" placeholder="Nome do contato" value={f.cName} onChange={set("cName")} required />
          {f.cKind === "profissional" ? (
            <select className="field" value={f.cProfession} onChange={set("cProfession")} aria-label="Profissão">{PROFS.map((p) => <option key={p}>{p}</option>)}</select>
          ) : (
            <input className="field" placeholder="Relação (mãe, cônjuge, amigo…)" value={f.cRelation} onChange={set("cRelation")} />
          )}
          <input className="field" type="tel" placeholder="Telefone do contato com DDD" value={f.cPhone} onChange={set("cPhone")} required />
          <input className="field" type="email" placeholder="E-mail do contato (opcional)" value={f.cEmail} onChange={set("cEmail")} />
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--gold)]" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
            A pessoa autorizou que esse contato seja avisado em caso de SOS ou risco grave.
          </label>
        </fieldset>

        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <button className="btn-gold w-full" disabled={busy}>{busy ? "Cadastrando…" : "Cadastrar"}</button>
      </form>
    </div>
  );
}
