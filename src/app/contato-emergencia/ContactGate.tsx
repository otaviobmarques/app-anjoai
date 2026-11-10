"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrustedContactFields, emptyTrusted, saveTrusted, trustedError } from "@/components/TrustedContactFields";

export function ContactGate({ next }: { next: string }) {
  const router = useRouter();
  const [c, setC] = useState(emptyTrusted);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const v = trustedError(c);
    if (v) return setErr(v);
    setBusy(true); setErr("");
    const r = await saveTrusted(c);
    setBusy(false);
    if (r) return setErr(r);
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="angel mx-auto h-20 w-20" aria-hidden />
      <h1 className="mt-4 text-center text-2xl font-extrabold">Quem é o seu Anjo da Guarda?</h1>
      <p className="mt-1 text-center text-muted">Antes de continuar, conte quem é alguém em quem você confia muito.</p>
      <form onSubmit={save} className="mt-6 space-y-4">
        <div className="card p-4"><TrustedContactFields value={c} onChange={setC} /></div>
        {err && <p className="text-sm text-danger" role="alert">{err}</p>}
        <button className="btn-gold w-full" disabled={busy}>{busy ? "Salvando…" : "Continuar"}</button>
      </form>
      <Link href="/sos" className="mt-6 block text-center text-sm text-muted underline">Precisa de ajuda agora?</Link>
    </div>
  );
}
