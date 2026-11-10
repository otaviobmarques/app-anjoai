"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AngelSymbol } from "@/components/Logo";
import { PinInput } from "@/components/PinInput";

export function AccessLogin({ token, firstName, cpfHint }: { token: string; firstName: string; cpfHint: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function enter(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 4) return setErr("O PIN tem 4 números.");
    setBusy(true); setErr("");
    const r = await fetch("/api/auth/entrar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, pin }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error || "Não foi possível entrar.");
    router.replace("/inicio");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-black"><AngelSymbol size={66} /></div>
      <h1 className="mt-4 text-center text-2xl font-extrabold">Olá{firstName ? `, ${firstName}` : ""}!</h1>
      <p className="mt-1 text-center text-muted">Digite o seu PIN de 4 números para entrar.</p>
      <form onSubmit={enter} className="mt-6 space-y-3">
        <p className="text-center text-sm text-muted">Usuário: CPF {cpfHint}</p>
        <PinInput value={pin} onChange={setPin} label="PIN" />
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <button className="btn-gold w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
      <Link href="/entrar" className="mt-5 text-center text-sm text-gold-text underline">Esqueci meu PIN</Link>
      <Link href="/sos" className="mt-6 text-center text-sm text-muted underline">Precisa de ajuda agora?</Link>
    </div>
  );
}
