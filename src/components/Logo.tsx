import { ANGEL_PATH } from "@/lib/angel-path";

export function AngelSymbol({ size = 96, color = "#FEC734", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg viewBox="0 0 601 601" width={size} height={size} className={className} aria-hidden>
      <path d={ANGEL_PATH} fill={color} fillRule="evenodd" />
    </svg>
  );
}

/** Versão completa: símbolo, nome e assinatura, sobre fundo preto */
export function LogoCompleto({ width = 280 }: { width?: number }) {
  return (
    <div role="img" aria-label="Anjo IA — Terapeuta on-line" className="flex flex-col items-center" style={{ width }}>
      <AngelSymbol size={width * 0.72} />
      <p className="-mt-1 font-extrabold leading-none tracking-tight text-white" style={{ fontSize: width * 0.2 }}>
        Anjo <span style={{ color: "#FEC734" }}>IA</span>
      </p>
      <p className="mt-2 font-medium text-white" style={{ fontSize: width * 0.068 }}>Terapeuta on-line</p>
    </div>
  );
}
