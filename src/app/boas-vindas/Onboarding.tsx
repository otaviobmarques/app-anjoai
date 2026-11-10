"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TERMS_VERSION } from "@/lib/terms";

/** Usado por quem foi cadastrado pela equipe (ou contas antigas): só o aceite, numa tela. */
export function Onboarding({ next = "" }: { initialName?: string; next?: string }) {
  const router = useRouter();
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function finish() {
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace("/entrar");
    const now = new Date().toISOString();
    const { error } = await supabase.from("profiles").update({ adult_confirmed: true, terms_version: TERMS_VERSION, terms_accepted_at: now }).eq("id", user.id);
    await supabase.from("consents").insert([
      { user_id: user.id, kind: "termos_e_privacidade", version: TERMS_VERSION, granted: true },
      { user_id: user.id, kind: "maioridade", version: "1", granted: true },
      { user_id: user.id, kind: "dados_sensiveis_fe_saude", version: TERMS_VERSION, granted: true },
    ]);
    setBusy(false);
    if (error) return setErr("Não consegui salvar. Tente de novo.");
    router.replace(next || "/conversa");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="angel mx-auto h-20 w-20" aria-hidden />
      <h1 className="mt-4 text-center text-2xl font-extrabold">Bem-vindo(a) ao Anjo IA</h1>
      <p className="mt-2 text-center leading-relaxed text-muted">Sou uma inteligência artificial que acolhe, aconselha com base na Bíblia e ora com você. Não substituo psicólogo, médico nem pastor. Em perigo, ligue 188.</p>
      <label className="mt-6 flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--gold)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>Tenho 18 anos ou mais e aceito os <Link href="/termos" target="_blank" className="text-gold-text underline">termos e a privacidade</Link>, incluindo que a equipe de cuidado pode acompanhar as minhas conversas para me ajudar.</span>
      </label>
      {err && <p className="mt-2 text-sm text-danger">{err}</p>}
      <button className="btn-gold mt-5 w-full" disabled={!agree || busy} onClick={finish}>{busy ? "Salvando…" : "Começar"}</button>
    </div>
  );
}
