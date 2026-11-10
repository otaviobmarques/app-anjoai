import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ANGEL_PATH } from "../../src/lib/angel-path";

/**
 * Anjo IA — vídeo da abertura do site (10 s, 1920x1080).
 * 0–1,5 s  escuridão com um ponto de luz
 * 1–4 s    a luz cresce, o anjo surge e as grandes asas se abrem
 * 4–5 s    a auréola acende e a luz se espalha
 * 5–10 s   brilho que respira, raios girando e partículas subindo (o último quadro vira o pôster)
 */
const ease = Easing.bezier(0.22, 0.7, 0.2, 1);

export type HeroProps = { layout: "wide" | "tall" };

export const AnjoHero = ({ layout }: HeroProps) => {
  const f = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  // onde fica o anjo: em cima, deixando a parte de baixo clara para o texto do site
  const tall = layout === "tall";
  const size = tall ? 740 : 560;
  const cy = tall ? 0.3 : 0.38; // centro vertical do anjo (fração da altura)
  const lift = (cy - 0.5) * height;

  const dawn = interpolate(f, [20, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const appear = interpolate(f, [35, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const open = spring({ frame: f - 60, fps, config: { damping: 18, stiffness: 40, mass: 1.4 } });
  const halo = interpolate(f, [120, 155], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const burst = interpolate(f, [130, 148, 200], [0, 1, 0.25], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const breathe = 0.5 + 0.5 * Math.sin((f / fps) * 1.6);
  const push = interpolate(f, [0, 300], [0.9, 1.04], { easing: Easing.inOut(Easing.quad) });
  const rise = interpolate(appear, [0, 1], [60, 0]);

  // fundo: da noite para uma manhã dourada
  const bg = `radial-gradient(70% 90% at 50% ${cy * 100}%,
     rgba(255,252,240,${0.15 + 0.85 * dawn}) 0%,
     rgba(255,238,190,${0.1 + 0.85 * dawn}) 28%,
     rgba(246,206,112,${0.05 + 0.75 * dawn}) 55%,
     rgba(120,82,20,${0.9 - 0.55 * dawn}) 100%), #120d05`;

  const wingL = interpolate(open, [0, 1], [34, 0]);
  const wingR = -wingL;
  const wingScale = interpolate(open, [0, 1], [0.72, 1.07]);

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {/* raios de luz girando atrás do anjo */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${lift}px)`, opacity: interpolate(f, [50, 160], [0, 0.85], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <div style={{
          width: 3200, height: 3200, borderRadius: "50%",
          background: "repeating-conic-gradient(from 0deg, rgba(255,247,214,.55) 0deg 4deg, rgba(255,247,214,0) 4deg 13deg)",
          maskImage: "radial-gradient(closest-side, #000 8%, transparent 62%)",
          WebkitMaskImage: "radial-gradient(closest-side, #000 8%, transparent 62%)",
          transform: `rotate(${f * 0.08}deg)`,
        }} />
      </AbsoluteFill>

      {/* brilho central que respira */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${lift}px)` }}>
        <div style={{
          width: 1500, height: 1500, borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(255,255,255,1) 0%, rgba(255,240,190,.85) 22%, rgba(254,199,52,.35) 48%, rgba(254,199,52,0) 72%)",
          opacity: 0.15 + 0.7 * dawn + 0.12 * breathe * halo,
          transform: `scale(${0.35 + 0.75 * dawn + 0.04 * breathe})`,
        }} />
      </AbsoluteFill>

      {/* partículas de luz subindo */}
      <AbsoluteFill>
        {Array.from({ length: 140 }).map((_, i) => {
          const x = random(`x${i}`) * 1920;
          const speed = 0.6 + random(`s${i}`) * 1.6;
          const size = 3 + random(`z${i}`) * 9;
          const start = random(`t${i}`) * 300;
          const y = 1180 - (((f + start) * speed * 3.2) % 1400);
          const drift = Math.sin((f + start) / 30 + i) * 24;
          const tw = 0.4 + 0.6 * Math.abs(Math.sin((f + i * 7) / 12));
          return (
            <div key={i} style={{
              position: "absolute", left: x + drift, top: y, width: size, height: size, borderRadius: "50%",
              background: "radial-gradient(circle, #fff 0%, rgba(255,226,140,.9) 45%, rgba(254,199,52,0) 70%)",
              opacity: tw * interpolate(f, [40, 130], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }} />
          );
        })}
      </AbsoluteFill>

      {/* o anjo */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${lift}px)` }}>
        <div style={{ transform: `translateY(${rise}px) scale(${push})`, opacity: appear }}>
          <svg viewBox="0 0 601 601" width={size} height={size} style={{
            overflow: "visible",
            filter: `drop-shadow(0 0 ${30 + 50 * halo}px rgba(255,236,170,${0.6 + 0.4 * halo})) drop-shadow(0 0 ${90 + 80 * halo}px rgba(254,199,52,${0.45 + 0.35 * halo}))`,
          }}>
            <defs>
              <linearGradient id="ouro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff6cf" />
                <stop offset="35%" stopColor="#ffd75e" />
                <stop offset="70%" stopColor="#f6b928" />
                <stop offset="100%" stopColor="#c98f10" />
              </linearGradient>
              {/* recortes: asa esquerda, asa direita e corpo */}
              <clipPath id="asaE"><polygon points="0,0 272,0 272,296 0,330" /></clipPath>
              <clipPath id="asaD"><polygon points="329,0 601,0 601,330 329,296" /></clipPath>
              <clipPath id="corpo"><polygon points="272,0 329,0 329,296 601,330 601,601 0,601 0,330 272,296" /></clipPath>
            </defs>
            <g clipPath="url(#corpo)"><path d={ANGEL_PATH} fill="url(#ouro)" fillRule="evenodd" /></g>
            <g style={{ transformOrigin: "272px 250px", transform: `rotate(${wingL}deg) scale(${wingScale})` }}>
              <g clipPath="url(#asaE)"><path d={ANGEL_PATH} fill="url(#ouro)" fillRule="evenodd" /></g>
            </g>
            <g style={{ transformOrigin: "329px 250px", transform: `rotate(${wingR}deg) scale(${wingScale})` }}>
              <g clipPath="url(#asaD)"><path d={ANGEL_PATH} fill="url(#ouro)" fillRule="evenodd" /></g>
            </g>
            {/* auréola acendendo */}
            <ellipse cx="300.5" cy="148" rx="52" ry="14" fill="none" stroke="#fffbe8" strokeWidth={3 + 4 * halo} opacity={halo * (0.75 + 0.25 * breathe)}
              style={{ filter: `blur(${1 + 2 * halo}px)` }} />
          </svg>
        </div>
      </AbsoluteFill>

      {/* clarão quando a auréola acende */}
      <AbsoluteFill style={{ background: `radial-gradient(60% 60% at 50% ${cy * 100 - 6}%, rgba(255,255,255,.95), rgba(255,250,230,0) 70%)`, opacity: burst * 0.55 }} />

      {/* parte de baixo clara, para o texto do site */}
      <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(255,253,247,1) 0%, rgba(255,253,247,.85) 18%, rgba(255,253,247,0) 45%)", opacity: dawn }} />

      {/* vinheta suave */}
      <AbsoluteFill style={{ background: "radial-gradient(120% 100% at 50% 50%, rgba(0,0,0,0) 60%, rgba(70,45,8,.35) 100%)", opacity: 1 - 0.6 * dawn }} />
    </AbsoluteFill>
  );
};
