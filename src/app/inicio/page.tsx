import Link from "next/link";
import { requireReady } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { AngelArt } from "@/components/AngelArt";
import { verseOfDay } from "@/lib/verses";
import { SpeakButton } from "@/components/SpeakButton";
import { InstallApp } from "@/components/InstallApp";
import { palavraAudio } from "@/lib/fixed-audio";

function saudacao() {
  const h = Number(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false }));
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function Inicio() {
  const { supabase, profile } = await requireReady("/inicio");
  const v = verseOfDay();
  const [{ data: people }, { data: careAlerts }] = await Promise.all([supabase.rpc("my_care_people"), supabase.rpc("my_care_alerts")]);
  const openAlerts = ((careAlerts ?? []) as { acked_at: string | null }[]).filter((a) => !a.acked_at).length;
  const caring = ((people ?? []) as unknown[]).length;
  const first = profile.name?.split(" ")[0];

  return (
    <AppShell active="/inicio">
      <header className="flex items-center justify-between">
        <p className="text-sm font-bold">Anjo <span className="text-gold-text">IA</span></p>
        {profile.is_admin && <Link href="/admin" className="text-xs text-muted underline">Painel</Link>}
      </header>

      <section className="mt-6 text-center">
        <AngelArt theme={profile.angel_theme} size={190} />
        <h1 className="mt-6 text-2xl font-extrabold">{saudacao()}{first ? `, ${first}` : ""}.</h1>
        <p className="mt-1 text-muted">Estou aqui com você.</p>
      </section>

      <div className="mt-6"><InstallApp /></div>

      {caring > 0 && (
        <Link href="/cuidando" className={`mt-6 flex items-center justify-between rounded-2xl p-4 ${openAlerts ? "border-2 border-danger bg-danger-bg" : "card"}`}>
          <span>
            <span className="block font-bold">Pessoas que acompanho</span>
            <span className="text-sm text-muted">{openAlerts ? `${openAlerts} ${openAlerts === 1 ? "aviso precisa" : "avisos precisam"} de você` : `${caring} ${caring === 1 ? "pessoa" : "pessoas"} na sua lista`}</span>
          </span>
          <span aria-hidden>›</span>
        </Link>
      )}

      <section className="card mt-6 p-5" aria-labelledby="pd">
        <div className="flex items-center justify-between">
          <h2 id="pd" className="text-sm font-bold text-gold-text">Palavra do dia</h2>
          <SpeakButton text={`${v.text} ${v.ref}. ${v.reflection}`} src={palavraAudio(v.index)} />
        </div>
        <blockquote className="mt-3 text-lg font-medium leading-snug">“{v.text}”</blockquote>
        <p className="mt-1 text-sm text-muted">{v.ref} · paráfrase</p>
        <p className="mt-3 leading-relaxed">{v.reflection}</p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <Link href="/conversa" className="btn-gold col-span-2 flex items-center justify-center text-lg">Conversar</Link>
        <Link href="/oracoes" className="btn-ghost flex items-center justify-center">Orar</Link>
        <Link href="/rede" className="btn-ghost flex items-center justify-center">Minha Rede</Link>
        <div className="col-span-2 rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">
          Minha jornada (trilhas, contador de dias, diário) chega na próxima fase.
        </div>
      </section>
    </AppShell>
  );
}
