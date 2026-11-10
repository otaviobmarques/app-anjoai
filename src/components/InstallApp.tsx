"use client";
import { useEffect, useState } from "react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const KEY = "anjo.install.dismissed";

/** Convite para instalar o Anjo IA como aplicativo (PWA). Some quando já está instalado. */
export function InstallApp({ compact = false }: { compact?: boolean }) {
  const [evt, setEvt] = useState<BIP | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) return;
    let dismissed = false;
    try { dismissed = !compact && localStorage.getItem(KEY) === "1"; } catch {}
    if (dismissed) return;
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) setShow(true);
    const onBip = (e: Event) => { e.preventDefault(); setEvt(e as BIP); setShow(true); };
    const onInstalled = () => setShow(false);
    addEventListener("beforeinstallprompt", onBip);
    addEventListener("appinstalled", onInstalled);
    return () => { removeEventListener("beforeinstallprompt", onBip); removeEventListener("appinstalled", onInstalled); };
  }, [compact]);

  if (!show) return null;

  async function install() {
    if (ios) return setSteps(true);
    if (!evt) return;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome === "accepted") setShow(false);
    setEvt(null);
  }
  function dismiss() {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setShow(false);
  }

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-xl" />
        <div className="flex-1">
          <p className="font-bold">Instale o Anjo IA</p>
          <p className="text-sm text-muted">Abre como aplicativo, recebe avisos e o SOS funciona sem internet.</p>
        </div>
      </div>
      {steps ? (
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>Toque em <strong>Compartilhar</strong> <span aria-hidden>(o quadrado com a seta ↑)</span>, na barra do Safari.</li>
          <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
          <li>Toque em <strong>Adicionar</strong>. Depois abra o Anjo IA pelo ícone.</li>
        </ol>
      ) : (
        <div className="flex gap-2">
          <button className="btn-gold flex-1" onClick={install}>Instalar app</button>
          {!compact && <button className="btn-ghost" onClick={dismiss}>Agora não</button>}
        </div>
      )}
    </div>
  );
}
