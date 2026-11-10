"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TrocarSenha() {
  return <Suspense><Form /></Suspense>;
}

function Form() {
  const router = useRouter();
  const raw = useSearchParams().get("next") ?? "";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/inicio";
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (a.length < 8) return setErr("A senha precisa ter pelo menos 8 caracteres.");
    if (a !== b) return setErr("As duas senhas não são iguais.");
    setBusy(true); setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: a });
    if (error) { setBusy(false); return setErr(/different/i.test(error.message) ? "Escolha uma senha diferente da provisória." : "Não consegui trocar a senha. Tente de novo."); }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ must_change_password: false }).eq("id", user!.id);
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="angel mx-auto h-20 w-20" aria-hidden />
      <h1 className="mt-4 text-center text-2xl font-extrabold">Crie a sua senha</h1>
      <p className="mt-1 text-center text-muted">Troque a senha provisória por uma que só você saiba.</p>
      <form onSubmit={save} className="mt-6 space-y-3">
        <input className="field" type="password" placeholder="Nova senha" value={a} onChange={(e) => setA(e.target.value)} autoComplete="new-password" required />
        <input className="field" type="password" placeholder="Repita a nova senha" value={b} onChange={(e) => setB(e.target.value)} autoComplete="new-password" required />
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <button className="btn-gold w-full" disabled={busy}>{busy ? "Salvando…" : "Salvar senha"}</button>
      </form>
    </div>
  );
}
