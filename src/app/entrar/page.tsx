"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AngelSymbol } from "@/components/Logo";
import { PinInput } from "@/components/PinInput";
import { TrustedContactFields, emptyTrusted, trustedError } from "@/components/TrustedContactFields";
import { formatCPF, onlyDigits, validCPF } from "@/lib/cpf";
import { loginEmail } from "@/lib/login";

export default function Entrar() {
  return <Suspense><EntrarForm /></Suspense>;
}

type Mode = "entrar" | "cadastro" | "esqueci" | "equipe";

function EntrarForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";
  const caregiver = next.startsWith("/convite/"); // quem vai acompanhar alguém não precisa de Anjo da Guarda
  const [mode, setMode] = useState<Mode>(params.get("modo") === "cadastro" ? "cadastro" : params.get("modo") === "equipe" ? "equipe" : "entrar");
  const [cpf, setCpf] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [trusted, setTrusted] = useState(emptyTrusted);
  const [agree, setAgree] = useState(false);
  const [teamUser, setTeamUser] = useState("");
  const [teamPw, setTeamPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newPin, setNewPin] = useState("");

  const go = (dest: string) => { router.replace(dest); router.refresh(); };
  const post = async (url: string, body: unknown) => {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: r.ok, j: (await r.json().catch(() => ({}))) as Record<string, string | boolean> };
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode !== "equipe" && !validCPF(cpf)) return setError("Confira o seu CPF.");

    if (mode === "entrar") {
      if (pin.length !== 4) return setError("O PIN tem 4 números.");
      setBusy(true);
      const { ok, j } = await post("/api/auth/entrar", { cpf, pin });
      setBusy(false);
      if (!ok) return setError(String(j.error ?? "Não foi possível entrar."));
      return go(next || (j.admin ? "/admin" : "/inicio"));
    }

    if (mode === "esqueci") {
      if (onlyDigits(phone).length < 10) return setError("Coloque o telefone com DDD.");
      setBusy(true);
      const { ok, j } = await post("/api/auth/redefinir", { cpf, phone });
      setBusy(false);
      if (!ok) return setError(String(j.error ?? "Não consegui redefinir."));
      return setNewPin(String(j.pin));
    }

    if (mode === "cadastro") {
      if (!name.trim()) return setError("Diga o seu nome.");
      if (onlyDigits(phone).length < 10) return setError("Coloque o seu WhatsApp com DDD.");
      if (pin.length !== 4) return setError("Crie um PIN de 4 números.");
      if (pin !== pin2) return setError("Os dois PINs não são iguais.");
      if (!caregiver) { const t = trustedError(trusted); if (t) return setError(t); }
      if (!agree) return setError("Confirme que tem 18 anos ou mais e aceita os termos.");
      setBusy(true);
      const { ok, j } = await post("/api/auth/cadastro", { name, cpf, phone, pin, agree, caregiver, contact: trusted });
      setBusy(false);
      if (!ok) return setError(String(j.error ?? "Não consegui criar a conta."));
      return go(next || "/conversa");
    }

    // equipe: e-mail ou usuário + senha
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail(teamUser), password: teamPw });
    setBusy(false);
    if (error) return setError("Usuário ou senha incorretos.");
    const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", data.user!.id).single();
    go(next || (prof?.is_admin ? "/admin" : "/inicio"));
  }

  const switchTo = (m: Mode) => { setMode(m); setError(""); setPin(""); setPin2(""); setNewPin(""); };

  if (newPin) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10 text-center">
        <div className="angel mx-auto h-20 w-20" aria-hidden />
        <h1 className="mt-4 text-2xl font-extrabold">Seu novo PIN</h1>
        <p className="mt-1 text-muted">Anote. Você vai usar ele com o seu CPF para entrar.</p>
        <p className="card mx-auto mt-6 px-10 py-6 font-mono text-5xl font-extrabold tracking-[0.3em]">{newPin}</p>
        <p className="mt-4 text-sm text-muted">Você pode trocar por outro PIN em Ajustes.</p>
        <button className="btn-gold mt-6 w-full" onClick={() => go(next || "/inicio")}>Continuar</button>
      </div>
    );
  }

  const title = { entrar: <>Anjo <span className="text-gold-text">IA</span></>, cadastro: "Vamos começar", esqueci: "Esqueci meu PIN", equipe: "Acesso da equipe" }[mode];
  const sub = { entrar: "Que bom te ver de novo.", cadastro: "Leva menos de um minuto.", esqueci: "Coloque o seu CPF e o telefone cadastrado. O PIN novo aparece na hora.", equipe: "Entre com o seu usuário e senha." }[mode];

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-black"><AngelSymbol size={66} /></div>
      <h1 className="mt-4 text-center text-2xl font-extrabold">{title}</h1>
      <p className="mt-1 text-center text-muted">{sub}</p>

      {mode === "entrar" && (
        <div className="mt-5 rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed">
          <p><strong>Usuário:</strong> o seu CPF.</p>
          <p><strong>Senha:</strong> o PIN de 4 números que você criou no cadastro.</p>
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-3">
        {mode === "cadastro" && <input className="field" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" aria-label="Seu nome" />}

        {mode !== "equipe" && (
          <input className="field" inputMode="numeric" placeholder="CPF" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} autoComplete="username" aria-label="CPF" />
        )}

        {(mode === "cadastro" || mode === "esqueci") && (
          <input className="field" type="tel" inputMode="tel" placeholder={mode === "cadastro" ? "Seu WhatsApp, com DDD" : "Telefone cadastrado, com DDD"} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" aria-label="Telefone" />
        )}

        {mode === "entrar" && <PinInput value={pin} onChange={setPin} label="PIN" />}

        {mode === "cadastro" && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-center"><span className="mb-1 block text-xs text-muted">Crie um PIN (4 números)</span><PinInput value={pin} onChange={setPin} label="Crie um PIN" autoComplete="new-password" /></label>
            <label className="block text-center"><span className="mb-1 block text-xs text-muted">Repita o PIN</span><PinInput value={pin2} onChange={setPin2} label="Repita o PIN" autoComplete="new-password" /></label>
          </div>
        )}

        {mode === "cadastro" && !caregiver && <div className="card mt-2 p-4"><TrustedContactFields value={trusted} onChange={setTrusted} /></div>}

        {mode === "cadastro" && (
          <label className="flex items-start gap-3 pt-1 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--gold)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>Tenho 18 anos ou mais e aceito os <Link href="/termos" target="_blank" className="text-gold-text underline">termos e a privacidade</Link>, incluindo que a equipe de cuidado pode acompanhar as minhas conversas para me ajudar.</span>
          </label>
        )}

        {mode === "equipe" && (
          <>
            <input className="field" autoCapitalize="none" placeholder="Usuário ou e-mail" value={teamUser} onChange={(e) => setTeamUser(e.target.value)} autoComplete="username" aria-label="Usuário ou e-mail" />
            <input className="field" type="password" placeholder="Senha" value={teamPw} onChange={(e) => setTeamPw(e.target.value)} autoComplete="current-password" aria-label="Senha" />
          </>
        )}

        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <button className="btn-gold w-full" disabled={busy}>
          {busy ? "Aguarde…" : { entrar: "Entrar", cadastro: "Começar", esqueci: "Ver meu PIN novo", equipe: "Entrar" }[mode]}
        </button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-3 text-sm">
        {mode === "entrar" && <button className="text-gold-text underline" onClick={() => switchTo("esqueci")}>Esqueci meu PIN</button>}
        {mode === "entrar" && <button className="text-gold-text underline" onClick={() => switchTo("cadastro")}>Ainda não tenho conta</button>}
        {mode !== "entrar" && <button className="text-gold-text underline" onClick={() => switchTo("entrar")}>Voltar para entrar</button>}
      </div>

      {mode === "cadastro" && <p className="mt-6 text-center text-xs text-muted">O Anjo IA é uma inteligência artificial. Não substitui psicólogo, médico nem pastor.</p>}
      <Link href="/sos" className="mt-6 text-center text-sm text-muted underline">Precisa de ajuda agora?</Link>
      {mode === "entrar" && <button className="mt-6 text-center text-xs text-muted underline" onClick={() => switchTo("equipe")}>Acesso da equipe</button>}
    </div>
  );
}
