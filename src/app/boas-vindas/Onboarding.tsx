"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AngelArt, THEMES } from "@/components/AngelArt";
import { TERMS_VERSION } from "@/lib/terms";

const TRADITIONS = [
  { id: "evangelica", label: "Evangélica" },
  { id: "catolica", label: "Católica" },
  { id: "geral", label: "Geral / ainda não sei" },
] as const;

export function Onboarding({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [name, setName] = useState(initialName);
  const [tradition, setTradition] = useState<string>("geral");
  const [theme, setTheme] = useState<"marca" | "asas" | "aureola">("marca");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function finish() {
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.replace("/entrar");
    const now = new Date().toISOString();
    const { error } = await supabase.from("profiles").update({
      name: name.trim() || null, tradition, angel_theme: theme,
      adult_confirmed: true, terms_version: TERMS_VERSION, terms_accepted_at: now,
    }).eq("id", user.id);
    await supabase.from("consents").insert([
      { user_id: user.id, kind: "termos_e_privacidade", version: TERMS_VERSION, granted: true },
      { user_id: user.id, kind: "maioridade", version: "1", granted: true },
      { user_id: user.id, kind: "dados_sensiveis_fe_saude", version: TERMS_VERSION, granted: true },
    ]);
    setBusy(false);
    if (error) return setErr("Não consegui salvar. Tente de novo.");
    router.replace("/inicio");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-10">
      <p className="text-sm text-muted">Passo {step + 1} de 3</p>

      {step === 0 && (
        <section className="mt-4 flex-1 space-y-5">
          <h1 className="text-2xl font-extrabold">Antes de começar</h1>
          <div className="card space-y-3 p-4 text-sm leading-relaxed">
            <p>O Anjo IA é uma <strong>inteligência artificial</strong> que acolhe, aconselha com base na Bíblia e ora com você.</p>
            <p>Ele <strong>não é</strong> psicólogo, médico, pastor ou padre, e <strong>não é</strong> serviço de emergência. Em perigo, ligue <strong>188</strong> (CVV), <strong>192</strong> (SAMU) ou <strong>190</strong>.</p>
            <p>Suas conversas falam de fé e de saúde emocional, que a LGPD trata como dados sensíveis. Elas ficam protegidas e você pode baixar ou apagar tudo quando quiser.</p>
          </div>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--gold)]" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
            <span>Tenho 18 anos ou mais.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--gold)]" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
            <span>Li e aceito os <Link href="/termos" target="_blank" className="text-gold-text underline">termos de uso e a política de privacidade</Link>, incluindo o tratamento de dados sobre fé e saúde emocional.</span>
          </label>
          <button className="btn-gold w-full" disabled={!adult || !terms} onClick={() => setStep(1)}>Continuar</button>
        </section>
      )}

      {step === 1 && (
        <section className="mt-4 flex-1 space-y-5">
          <h1 className="text-2xl font-extrabold">Sobre você</h1>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Seu nome</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <fieldset>
            <legend className="mb-2 text-sm text-muted">Sua tradição</legend>
            <div className="space-y-2">
              {TRADITIONS.map((t) => (
                <label key={t.id} className={`card flex cursor-pointer items-center gap-3 p-4 ${tradition === t.id ? "border-gold" : ""}`}>
                  <input type="radio" name="trad" className="h-5 w-5 accent-[var(--gold)]" checked={tradition === t.id} onChange={() => setTradition(t.id)} />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
          <button className="btn-gold w-full" onClick={() => setStep(2)}>Continuar</button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-4 flex-1 space-y-5">
          <h1 className="text-2xl font-extrabold">Qual anjo fica na sua tela inicial?</h1>
          <p className="text-sm text-muted">Você pode trocar quando quiser nos Ajustes.</p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => setTheme(t.id)} className={`card flex flex-col items-center gap-2 p-3 text-xs ${theme === t.id ? "border-gold" : ""}`} aria-pressed={theme === t.id}>
                <AngelArt theme={t.id} size={72} />
                <span className="font-bold">{t.name}</span>
              </button>
            ))}
          </div>
          <div className="py-6"><AngelArt theme={theme} size={180} /></div>
          {err && <p className="text-sm text-danger">{err}</p>}
          <button className="btn-gold w-full" disabled={busy} onClick={finish}>{busy ? "Salvando…" : "Começar"}</button>
        </section>
      )}
    </div>
  );
}
