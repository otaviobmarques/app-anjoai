"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { enablePush, pushState, type PushState } from "@/lib/push-client";

export type CarePerson = { contact_id: string; person_name: string; person_phone: string | null; kind: string; profession: string | null; since: string };
export type CareAlert = { alert_id: string; person_name: string; person_phone: string | null; kind: "sos" | "risco"; level: number; created_at: string; read_at: string | null; acked_at: string | null };

const fmt = (d: string) => new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export function CareDashboard({ people, initialAlerts }: { people: CarePerson[]; initialAlerts: CareAlert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [push, setPush] = useState<PushState | null>(null);
  const supabase = createClient();

  useEffect(() => {
    pushState().then(setPush);
    // atualiza sozinho enquanto a tela está aberta
    const t = setInterval(async () => {
      const { data } = await supabase.rpc("my_care_alerts");
      if (data) setAlerts(data as CareAlert[]);
    }, 15000);
    return () => clearInterval(t);
  }, [supabase]);

  // marcar como lidos os avisos que já estão na tela
  useEffect(() => {
    alerts.filter((a) => !a.read_at).forEach((a) => supabase.rpc("mark_care_alert", { p_alert_id: a.alert_id, p_ack: false }));
  }, [alerts, supabase]);

  async function ack(id: string) {
    await supabase.rpc("mark_care_alert", { p_alert_id: id, p_ack: true });
    setAlerts((l) => l.map((a) => (a.alert_id === id ? { ...a, acked_at: new Date().toISOString() } : a)));
  }

  const open = alerts.filter((a) => !a.acked_at);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-extrabold">Pessoas que acompanho</h1>
        <p className="mt-1 text-sm text-muted">Você recebe um aviso quando alguém da sua lista aperta o SOS ou passa por um momento de risco grave. Por privacidade, você não vê o conteúdo das conversas.</p>
      </header>

      <PushCard state={push} onEnable={async () => setPush(await enablePush())} />

      {open.length > 0 && (
        <section className="space-y-3" aria-label="Avisos abertos">
          {open.map((a) => (
            <div key={a.alert_id} role="alert" className="rounded-2xl border-2 border-danger bg-danger-bg p-4">
              <p className="font-extrabold">{a.kind === "sos" ? `${a.person_name} apertou o SOS` : `${a.person_name} pode estar em risco`}</p>
              <p className="text-sm">{fmt(a.created_at)} · nível {a.level} de 3</p>
              <p className="mt-2 text-sm">Entre em contato agora. Ouça sem julgar. Em perigo imediato, ligue 192 ou 190.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {a.person_phone ? (
                  <a href={`tel:${a.person_phone}`} className="flex min-h-12 items-center justify-center rounded-xl bg-[#c62828] font-bold text-white">Ligar para {a.person_name.split(" ")[0]}</a>
                ) : (
                  <span className="flex min-h-12 items-center justify-center rounded-xl border border-line p-2 text-center text-xs">Sem telefone cadastrado</span>
                )}
                <button className="btn-gold" onClick={() => ack(a.alert_id)}>Estou cuidando</button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold text-gold-text">Quem você acompanha</h2>
        {people.length === 0 ? (
          <p className="mt-2 text-muted">Ninguém ainda. Quando alguém te convidar para a Rede de Cuidado e você aceitar com esta conta, a pessoa aparece aqui.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {people.map((p) => (
              <li key={p.contact_id} className="card flex items-center justify-between gap-2 p-4">
                <div>
                  <p className="font-bold">{p.person_name}</p>
                  <p className="text-xs text-muted">{p.kind === "profissional" ? `Você acompanha como ${p.profession || "profissional"}` : "Você é o Anjo da Guarda dessa pessoa"} · desde {new Date(p.since).toLocaleDateString("pt-BR")}</p>
                </div>
                {p.person_phone && <a href={`tel:${p.person_phone}`} className="rounded-full border border-line px-3 py-1.5 text-xs">Ligar</a>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {alerts.some((a) => a.acked_at) && (
        <section>
          <h2 className="text-sm font-bold text-gold-text">Avisos anteriores</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {alerts.filter((a) => a.acked_at).map((a) => (
              <li key={a.alert_id}>{fmt(a.created_at)} · {a.person_name} · {a.kind === "sos" ? "SOS" : `risco nível ${a.level}`} · atendido {fmt(a.acked_at!)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function PushCard({ state, onEnable }: { state: PushState | null; onEnable: () => void }) {
  if (!state || state === "ligado") return state === "ligado" ? <p className="rounded-xl bg-surface-2 p-3 text-sm">Notificações ligadas neste aparelho.</p> : null;
  const msg: Record<Exclude<PushState, "ligado">, string> = {
    desligado: "Ligue as notificações para saber na hora, mesmo com o app fechado.",
    negado: "As notificações estão bloqueadas para o Anjo IA. Libere nas configurações do navegador para receber os avisos na hora.",
    "precisa-instalar": "No iPhone, as notificações só funcionam com o app instalado: Safari → Compartilhar → Adicionar à Tela de Início. Depois abra pelo ícone e volte aqui.",
    indisponivel: "Este navegador não recebe notificações. Abra esta tela de vez em quando ou use o Chrome.",
  };
  return (
    <div className="card space-y-3 p-4">
      <p className="text-sm">{msg[state]}</p>
      {state === "desligado" && <button className="btn-gold w-full" onClick={onEnable}>Ligar notificações</button>}
    </div>
  );
}
