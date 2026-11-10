"use client";
import { AngelSymbol } from "@/components/Logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Entrar() {
  const router = useRouter();
  const [mode, setMode] = useState<"entrar" | "cadastro">("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    if (mode === "cadastro") {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) {
        setBusy(false);
        return setError(traduz(error.message));
      }
    }
    // Contas da equipe entram com nome de usuário (ex.: "Admin")
    const login = email.includes("@") ? email.trim() : `${email.trim().toLowerCase()}@anjo-ia.app`;
    const { data, error } = await supabase.auth.signInWithPassword({ email: login, password });
    setBusy(false);
    if (error) return setError(traduz(error.message));
    let dest = mode === "cadastro" ? "/boas-vindas" : "/inicio";
    if (mode === "entrar" && data.user) {
      const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", data.user.id).single();
      if (prof?.is_admin) dest = "/admin";
    }
    router.replace(dest);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-black"><AngelSymbol size={80} /></div>
      <h1 className="mt-4 text-center text-2xl font-extrabold">
        Anjo <span className="text-gold-text">IA</span>
      </h1>
      <p className="mt-1 text-center text-muted">{mode === "entrar" ? "Que bom te ver de novo." : "Vamos caminhar juntos."}</p>

      <form onSubmit={submit} className="mt-8 space-y-3">
        {mode === "cadastro" && (
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Como você gosta de ser chamado(a)?</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="given-name" />
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm text-muted">{mode === "entrar" ? "E-mail ou usuário" : "E-mail"}</span>
          <input className="field" type={mode === "entrar" ? "text" : "email"} inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete={mode === "entrar" ? "username" : "email"} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Senha</span>
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "entrar" ? "current-password" : "new-password"} />
        </label>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <button className="btn-gold w-full" disabled={busy}>{busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}</button>
      </form>

      <button className="mt-4 text-sm text-gold-text underline" onClick={() => { setMode(mode === "entrar" ? "cadastro" : "entrar"); setError(""); }}>
        {mode === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
      </button>

      <Link href="/sos" className="mt-10 text-center text-sm text-muted underline">Precisa de ajuda agora? Números de emergência</Link>
    </div>
  );
}

function traduz(msg: string) {
  if (/Invalid login/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/already registered/i.test(msg)) return "Esse e-mail já tem conta. Toque em “Já tenho conta”.";
  if (/at least/i.test(msg)) return "A senha precisa ter pelo menos 8 caracteres.";
  if (/rate limit/i.test(msg)) return "Muitas tentativas. Espere um pouco e tente de novo.";
  return "Não foi possível continuar. Tente de novo.";
}
