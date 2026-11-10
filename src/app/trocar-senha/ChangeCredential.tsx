"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PinInput } from "@/components/PinInput";

export function ChangeCredential({ usesPin, next, firstTime }: { usesPin: boolean; next: string; firstTime: boolean }) {
  const router = useRouter();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (usesPin ? a.length !== 4 : a.length < 8) return setErr(usesPin ? "O PIN tem 4 números." : "A senha precisa ter pelo menos 8 caracteres.");
    if (a !== b) return setErr(usesPin ? "Os dois PINs não são iguais." : "As duas senhas não são iguais.");
    setBusy(true);
    if (usesPin) {
      const r = await fetch("/api/auth/pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: a }) });
      const j = await r.json().catch(() => ({}));
      setBusy(false);
      if (!r.ok) return setErr(j.error || "Não consegui salvar o PIN.");
    } else {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: a });
      if (error) { setBusy(false); return setErr("Não consegui trocar a senha. Tente outra."); }
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", user!.id);
      setBusy(false);
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="angel mx-auto h-20 w-20" aria-hidden />
      <h1 className="mt-4 text-center text-2xl font-extrabold">{usesPin ? (firstTime ? "Crie o seu PIN" : "Trocar PIN") : "Crie a sua senha"}</h1>
      <p className="mt-1 text-center text-muted">{usesPin ? "4 números que só você saiba. Você vai entrar com o seu CPF e esse PIN." : "Troque a senha provisória por uma que só você saiba."}</p>
      <form onSubmit={save} className="mt-6 space-y-3">
        {usesPin ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-center"><span className="mb-1 block text-xs text-muted">Novo PIN</span><PinInput value={a} onChange={setA} label="Novo PIN" autoComplete="new-password" /></label>
            <label className="block text-center"><span className="mb-1 block text-xs text-muted">Repita o PIN</span><PinInput value={b} onChange={setB} label="Repita o PIN" autoComplete="new-password" /></label>
          </div>
        ) : (
          <>
            <input className="field" type="password" placeholder="Nova senha" value={a} onChange={(e) => setA(e.target.value)} autoComplete="new-password" />
            <input className="field" type="password" placeholder="Repita a nova senha" value={b} onChange={(e) => setB(e.target.value)} autoComplete="new-password" />
          </>
        )}
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <button className="btn-gold w-full" disabled={busy}>{busy ? "Salvando…" : "Salvar"}</button>
      </form>
    </div>
  );
}
