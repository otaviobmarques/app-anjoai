import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import Link from "next/link";
import { ReviewButtons } from "./ReviewButtons";
import { AiTestButton } from "./AiStatus";
import { CHAT_MODEL, FAST_MODEL } from "@/lib/ai";
import { PROMPT_VERSION } from "@/lib/prompt";

function mask(v?: string) {
  if (!v) return null;
  return `${v.slice(0, 10)}…${v.slice(-4)}`;
}

export const dynamic = "force-dynamic";

const LEVEL = ["sem sinal", "tristeza", "risco", "risco alto"];

export default async function Admin() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/entrar");
  if (!profile?.is_admin) redirect("/inicio");

  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const [users, msgs, msgsWeek, events, alerts] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("role", "user"),
    supabase.from("messages").select("user_id").eq("role", "user").gte("created_at", weekAgo).limit(5000),
    supabase.from("risk_events").select("id,user_id,source,level,reason,review_status,created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("alerts").select("id,status,error,created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  const activeWeek = new Set((msgsWeek.data ?? []).map((m) => m.user_id)).size;
  const pending = (events.data ?? []).filter((e) => e.review_status === "pendente");

  const stat = (label: string, value: number | string) => (
    <div className="card p-4"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Painel de acompanhamento</h1>
        <Link href="/inicio" className="text-sm text-muted underline">Abrir o app</Link>
      </header>

      <section className="card space-y-3 p-4">
        <h2 className="font-bold">Inteligência artificial (Anthropic)</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted">Chave</dt>
          <dd>{mask(process.env.ANTHROPIC_API_KEY) ? <code>{mask(process.env.ANTHROPIC_API_KEY)}</code> : <span className="text-danger">não configurada</span>}</dd>
          <dt className="text-muted">Conversa e orações</dt><dd><code>{CHAT_MODEL}</code></dd>
          <dt className="text-muted">Classificador e memória</dt><dd><code>{FAST_MODEL}</code></dd>
          <dt className="text-muted">Prompt-Mestre</dt><dd><code>{PROMPT_VERSION}</code></dd>
          <dt className="text-muted">E-mail de alertas</dt>
          <dd>{process.env.RESEND_API_KEY && process.env.ALERT_FROM ? process.env.ALERT_FROM : <span className="text-danger">não configurado (alertas ficam pendentes)</span>}</dd>
        </dl>
        <p className="text-xs text-muted">A chave fica guardada só na Vercel (variável protegida). Por segurança, aqui aparecem só o começo e o fim. Para trocar: Vercel → anjo-ia → Settings → Environment Variables.</p>
        <AiTestButton />
      </section>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stat("Pessoas", users.count ?? 0)}
        {stat("Ativas na semana", activeWeek)}
        {stat("Mensagens", msgs.count ?? 0)}
        {stat("Riscos a revisar", pending.length)}
      </div>

      <section>
        <h2 className="font-bold">Fila de revisão de risco</h2>
        <p className="text-sm text-muted">Sem conteúdo das conversas aqui. Abrir uma conversa exige registro de acesso (próxima fase).</p>
        <div className="mt-3 space-y-2">
          {(events.data ?? []).length === 0 && <p className="text-muted">Nenhum evento.</p>}
          {(events.data ?? []).map((e) => (
            <div key={e.id} className={`card flex flex-wrap items-center justify-between gap-2 p-3 ${e.level >= 3 ? "border-danger" : ""}`}>
              <div className="text-sm">
                <p><strong>Nível {e.level}</strong> ({LEVEL[e.level]}) · {e.source} · {new Date(e.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
                <p className="text-muted">{e.reason} · pessoa {String(e.user_id).slice(0, 8)}</p>
              </div>
              {e.review_status === "pendente" ? <ReviewButtons id={e.id} /> : <span className="text-xs text-muted">{e.review_status}</span>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold">Alertas recentes</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {(alerts.data ?? []).map((a) => (
            <li key={a.id} className="text-muted">{new Date(a.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} · <span className={a.status === "enviado" ? "text-gold-text" : "text-danger"}>{a.status}</span>{a.error ? ` · ${a.error}` : ""}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
