"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EMERGENCY } from "@/lib/emergency";
import { FIXED_AUDIO } from "@/lib/fixed-audio";
import { SpeakButton } from "@/components/SpeakButton";

export function SosClient() {
  const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
  const [online, setOnline] = useState(true);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    try { setContacts(JSON.parse(localStorage.getItem("anjo.sos.contacts") || "[]")); } catch {}
    setOnline(navigator.onLine);
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener("online", on); addEventListener("offline", off);
    return () => { removeEventListener("online", on); removeEventListener("offline", off); };
  }, []);

  async function avisar() {
    setState("sending");
    try {
      const r = await fetch("/api/sos", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setState("done");
      setMsg(j.total === 0 ? "Você ainda não tem contato confirmado. Ligue para alguém ou para o 188." : j.sent > 0 ? `Avisamos ${j.sent} ${j.sent === 1 ? "pessoa" : "pessoas"} da sua Rede de Cuidado.` : "Registramos o pedido, mas o aviso não saiu. Ligue para alguém de confiança.");
    } catch (e) {
      setState("error");
      setMsg(e instanceof Error && e.message ? e.message : "Sem conexão. Use os números acima.");
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <h1 className="text-2xl font-extrabold">Ajuda agora</h1>
      <p className="mt-1 text-muted">Você não está sozinho(a). Toque para ligar.</p>
      {!online && <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">Sem internet: as ligações abaixo funcionam normalmente.</p>}

      <div className="mt-5 space-y-3">
        {EMERGENCY.map((e, i) => (
          <a key={e.number} href={`tel:${e.number}`} className={`flex min-h-16 items-center justify-between rounded-2xl p-4 font-bold ${i === 0 ? "bg-[#c62828] text-white" : "card"}`}>
            <span>
              <span className="block">{e.label}</span>
              {e.note && <span className={`block text-xs font-medium ${i === 0 ? "text-white/85" : "text-muted"}`}>{e.note}</span>}
            </span>
            <span className="text-2xl">{e.number}</span>
          </a>
        ))}
      </div>

      {contacts.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold text-gold-text">Minha Rede de Cuidado</h2>
          <div className="mt-2 space-y-2">
            {contacts.map((c) => (
              <a key={c.phone} href={`tel:${c.phone}`} className="card flex min-h-14 items-center justify-between p-4">
                <span className="font-bold">{c.name}</span><span className="text-muted">Ligar</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <button className="btn-gold mt-6 w-full" onClick={avisar} disabled={state === "sending" || state === "done" || !online}>
        {state === "sending" ? "Avisando…" : state === "done" ? "Rede avisada" : "Avisar minha Rede de Cuidado"}
      </button>
      {msg && <p className="mt-2 text-sm" role="status">{msg}</p>}

      <div className="mt-8 card p-4 text-sm leading-relaxed">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold">Enquanto espera</p>
          <SpeakButton text={FIXED_AUDIO["sos-respiracao"].text} src={FIXED_AUDIO["sos-respiracao"].file} label="Respirar comigo" />
        </div>
        <p className="mt-1 text-muted">Respire devagar: inspire contando até 4, segure até 4, solte contando até 6. Se houver algo perto que possa te ferir, afaste-se dele. Chame alguém para ficar com você.</p>
      </div>

      <Link href="/inicio" className="mt-6 block text-center text-sm text-muted underline">Voltar ao app</Link>
      <p className="mt-6 text-center text-xs text-muted">O Anjo IA não é serviço médico nem de emergência.</p>
    </div>
  );
}
