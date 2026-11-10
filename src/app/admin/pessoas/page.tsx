import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Row = { user_id: string; name: string | null; email: string; tradition: string; plan: string; created_at: string; last_message_at: string | null; messages: number; max_risk: number | null; open_risks: number; is_admin: boolean };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "—");

export default async function Pessoas({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/entrar");
  if (!profile?.is_admin) redirect("/inicio");
  const { q } = await searchParams;
  const { data, error } = await supabase.rpc("admin_list_people", { p_search: q ?? null });
  const rows = (data ?? []) as Row[];

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Pessoas</h1>
        <span className="flex items-center gap-3">
          <Link href="/admin/pessoas/nova" className="btn-gold text-sm">+ Cadastrar pessoa</Link>
          <Link href="/admin" className="text-sm text-muted underline">‹ Painel</Link>
        </span>
      </header>
      <form className="flex gap-2">
        <input name="q" defaultValue={q ?? ""} className="field" placeholder="Buscar por nome ou e-mail" aria-label="Buscar" />
        <button className="btn-gold shrink-0">Buscar</button>
      </form>
      {error && <p className="text-danger">Não consegui carregar a lista.</p>}
      <p className="text-sm text-muted">{rows.length} {rows.length === 1 ? "pessoa" : "pessoas"}. Quem tem risco pendente aparece primeiro. Abrir o histórico de alguém fica registrado.</p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.user_id}>
            <Link href={`/admin/pessoas/${r.user_id}`} className={`card flex items-center justify-between gap-3 p-4 ${r.open_risks ? "border-danger" : ""}`}>
              <div className="min-w-0">
                <p className="truncate font-bold">{r.name || "Sem nome"}{r.is_admin ? <span className="ml-2 text-xs text-gold-text">admin</span> : null}</p>
                <p className="truncate text-xs text-muted">{r.email} · {r.tradition} · plano {r.plan}</p>
                <p className="text-xs text-muted">Desde {fmt(r.created_at)} · última mensagem {fmt(r.last_message_at)} · {r.messages} mensagens</p>
              </div>
              <div className="shrink-0 text-right text-xs">
                {r.open_risks > 0 && <p className="font-bold text-danger">{r.open_risks} risco(s) a revisar</p>}
                {r.max_risk != null && <p className="text-muted">risco máx. {r.max_risk}</p>}
                <span aria-hidden>›</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
