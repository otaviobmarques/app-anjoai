import { createClient } from "@/lib/supabase/server";
import { InviteAnswer } from "./InviteAnswer";

export const metadata = { title: "Convite da Rede de Cuidado — Anjo IA" };
export const dynamic = "force-dynamic";

type Inv = { contact_name: string; user_name: string; status: string; linked: boolean; kind: string };

export default async function Convite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ok = /^[0-9a-f-]{36}$/i.test(token);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = ok ? await supabase.rpc("get_invite", { p_token: token }) : { data: null };
  const inv = (data as Inv[] | null)?.[0];
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="angel mx-auto h-24 w-24" aria-hidden />
      {!inv ? (
        <p className="mt-6 text-center">Este convite não existe ou expirou.</p>
      ) : (
        <>
          <h1 className="mt-6 text-center text-xl font-extrabold">Olá, {inv.contact_name}.</h1>
          <p className="mt-3 leading-relaxed">
            <strong>{inv.user_name}</strong> escolheu você {inv.kind === "profissional" ? "como profissional que acompanha" : "como pessoa de confiança"} no Anjo IA, um app cristão de apoio emocional. Se um dia {inv.user_name} apertar o botão SOS ou passar por um momento de risco grave, você recebe um aviso no app e uma notificação no seu celular para entrar em contato.
          </p>
          <p className="mt-2 text-sm text-muted">Você não recebe o conteúdo das conversas. Pode sair da Rede quando quiser, pedindo para {inv.user_name} remover você.</p>
          <InviteAnswer token={token} status={inv.status} linked={inv.linked} loggedIn={!!user} email={user?.email ?? null} />
        </>
      )}
    </div>
  );
}
