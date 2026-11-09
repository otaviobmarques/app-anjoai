import Link from "next/link";
export const dynamic = "force-static";
export default function Offline() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="angel h-28 w-28" aria-hidden />
      <h1 className="mt-6 text-xl font-extrabold">Sem conexão</h1>
      <p className="mt-2 text-muted">A conversa volta quando a internet voltar. A ajuda de emergência funciona agora.</p>
      <Link href="/sos" className="btn-gold mt-6">Abrir SOS</Link>
    </div>
  );
}
