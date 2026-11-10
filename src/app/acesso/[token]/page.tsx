import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { serverKey } from "@/lib/pin-auth";
import { AccessLogin } from "./AccessLogin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seu acesso", robots: { index: false } };

// Link de acesso gerado pela equipe: a pessoa só digita o PIN (o CPF não aparece no link nem na página)
export default async function Acesso({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ok = /^[0-9a-f-]{36}$/i.test(token);
  const supabase = await createClient();
  const { data } = ok ? await supabase.rpc("access_link_resolve", { p_server_key: serverKey(), p_token: token }) : { data: null };
  const info = data as { name: string | null; cpf: string } | null;
  if (!info) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
        <div className="angel mx-auto h-20 w-20" aria-hidden />
        <h1 className="mt-4 text-xl font-extrabold">Este link expirou</h1>
        <p className="mt-2 text-muted">Entre com o seu CPF e PIN, ou peça um link novo para a equipe do Anjo IA.</p>
        <Link href="/entrar" className="btn-gold mt-6">Entrar</Link>
      </div>
    );
  }
  return <AccessLogin token={token} firstName={(info.name || "").split(" ")[0]} cpfHint={`•••.•••.${info.cpf.slice(6, 9)}-${info.cpf.slice(9)}`} />;
}
