"use client";
import { useEffect, useState } from "react";
import type { WhatsAppConfig } from "@/lib/whatsapp-api";

type Info = { config: WhatsAppConfig; secrets: { meta: boolean; evolution: boolean }; template: string };

export function WhatsAppSettings() {
  const [info, setInfo] = useState<Info | null>(null);
  const [cfg, setCfg] = useState<WhatsAppConfig | null>(null);
  const [msg, setMsg] = useState("");
  const [qr, setQr] = useState<{ state?: string; qr?: string | null; error?: string } | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testRes, setTestRes] = useState("");

  useEffect(() => {
    fetch("/api/admin/whatsapp").then((r) => r.json()).then((j: Info) => { setInfo(j); setCfg(j.config); });
  }, []);
  if (!info || !cfg) return <p className="text-sm text-muted">Carregando…</p>;

  const setMeta = (k: string, v: string) => setCfg({ ...cfg, meta: { ...cfg.meta, [k]: v } });
  const setEvo = (k: string, v: string) => setCfg({ ...cfg, evolution: { ...cfg.evolution, [k]: v } });

  async function save() {
    const r = await fetch("/api/admin/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: cfg }) });
    const j = await r.json();
    setMsg(j.ok ? "Configuração salva." : j.error || "Não consegui salvar.");
    if (j.config) setCfg(j.config);
  }
  async function loadQr() {
    setQr({ state: "carregando" });
    setQr(await (await fetch("/api/admin/whatsapp?qr=1")).json());
  }
  async function test() {
    setTestRes("Enviando…");
    const j = await (await fetch("/api/admin/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test", phone: testPhone }) })).json();
    setTestRes(j.ok ? "Mensagem de teste enviada." : `Falhou: ${j.error}`);
  }

  const Opt = ({ v, t, d }: { v: WhatsAppConfig["provider"]; t: string; d: string }) => (
    <label className={`card flex cursor-pointer gap-3 p-3 ${cfg.provider === v ? "border-gold" : ""}`}>
      <input type="radio" name="wa" className="mt-1 h-5 w-5 accent-[var(--gold)]" checked={cfg.provider === v} onChange={() => setCfg({ ...cfg, provider: v })} />
      <span><span className="block font-bold">{t}</span><span className="text-xs text-muted">{d}</span></span>
    </label>
  );
  const Secret = ({ ok, name }: { ok: boolean; name: string }) => (
    <p className="text-xs">Chave <code>{name}</code> na Vercel: {ok ? <span className="text-gold-text">configurada</span> : <span className="text-danger">não configurada</span>}</p>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Quando ligado, o Anjo da Guarda recebe uma mensagem automática no WhatsApp se a pessoa apertar o SOS ou se o app perceber um risco grave, mesmo que ainda não tenha aceitado o convite. O botão de WhatsApp no SOS da própria pessoa continua funcionando de qualquer jeito.</p>
      <div className="space-y-2">
        <Opt v="desligado" t="Desligado" d="Avisos só no app, por notificação e pelo botão de WhatsApp da própria pessoa." />
        <Opt v="meta" t="API oficial do WhatsApp (Meta Cloud API)" d="Domma Chat ou conta direta na Meta. Mais estável; exige modelo de mensagem aprovado." />
        <Opt v="evolution" t="QR Code (Evolution API)" d="Conecta um número escaneando o QR Code. Não oficial: o número pode ser bloqueado pelo WhatsApp." />
      </div>

      {cfg.provider === "meta" && (
        <div className="card space-y-3 p-4">
          <Secret ok={info.secrets.meta} name="WHATSAPP_META_TOKEN" />
          <input className="field" placeholder="Phone number ID" value={cfg.meta?.phone_number_id ?? ""} onChange={(e) => setMeta("phone_number_id", e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="field" placeholder="Nome do modelo" value={cfg.meta?.template ?? ""} onChange={(e) => setMeta("template", e.target.value)} />
            <input className="field" placeholder="Idioma (pt_BR)" value={cfg.meta?.lang ?? ""} onChange={(e) => setMeta("lang", e.target.value)} />
          </div>
          <input className="field" placeholder="Endereço da API (opcional, ex.: da Domma Chat)" value={cfg.meta?.api_base ?? ""} onChange={(e) => setMeta("api_base", e.target.value)} />
          <details className="text-sm">
            <summary className="cursor-pointer text-gold-text">Texto do modelo para aprovar na Meta (categoria Utilidade)</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-surface-2 p-3 text-xs">{info.template}</pre>
            <p className="mt-1 text-xs text-muted">{"{{1}}"} = nome do Anjo da Guarda · {"{{2}}"} = nome da pessoa.</p>
          </details>
        </div>
      )}

      {cfg.provider === "evolution" && (
        <div className="card space-y-3 p-4">
          <Secret ok={info.secrets.evolution} name="WHATSAPP_EVOLUTION_APIKEY" />
          <input className="field" placeholder="Endereço da Evolution API (https://…)" value={cfg.evolution?.base_url ?? ""} onChange={(e) => setEvo("base_url", e.target.value)} />
          <input className="field" placeholder="Nome da instância" value={cfg.evolution?.instance ?? ""} onChange={(e) => setEvo("instance", e.target.value)} />
          <button className="btn-ghost w-full text-sm" onClick={loadQr}>Mostrar QR Code / status da conexão</button>
          {qr && (
            <div className="text-center text-sm">
              {qr.error && <p className="text-danger">{qr.error}</p>}
              {qr.state && <p>Conexão: <strong>{qr.state === "open" ? "conectado" : qr.state}</strong></p>}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {qr.qr && <img src={qr.qr.startsWith("data:") ? qr.qr : `data:image/png;base64,${qr.qr}`} alt="QR Code para conectar o WhatsApp" className="mx-auto mt-2 w-60 rounded-xl bg-white p-2" />}
              {qr.qr && <p className="mt-1 text-xs text-muted">No celular: WhatsApp → Aparelhos conectados → Conectar aparelho.</p>}
            </div>
          )}
        </div>
      )}

      <button className="btn-gold w-full" onClick={save}>Salvar configuração do WhatsApp</button>
      {msg && <p className="text-sm text-gold-text" role="status">{msg}</p>}

      {cfg.provider !== "desligado" && (
        <div className="flex gap-2">
          <input className="field" type="tel" placeholder="Seu WhatsApp para teste" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
          <button className="btn-ghost shrink-0 text-sm" onClick={test}>Testar</button>
        </div>
      )}
      {testRes && <p className="text-sm" role="status">{testRes}</p>}
    </div>
  );
}
