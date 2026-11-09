type Theme = "marca" | "asas" | "aureola";

export function AngelArt({ theme, size = 220 }: { theme: Theme; size?: number }) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} aria-hidden>
      <div className="glow absolute -inset-10 rounded-full" />
      {theme === "marca" && <div className="angel relative h-full w-full" />}
      {theme === "asas" && <AsasDeLuz />}
      {theme === "aureola" && <Aureola />}
    </div>
  );
}

function AsasDeLuz() {
  // Duas asas abertas que se encontram formando um coração, com brilho branco no centro
  const wing = "M100 172 C 70 150, 22 120, 18 72 C 15 40, 40 22, 62 30 C 80 37, 94 58, 100 80 Z";
  return (
    <svg viewBox="0 0 200 200" className="relative h-full w-full">
      <defs>
        <radialGradient id="core" cx="50%" cy="52%" r="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[0, 1].map((side) => (
        <g key={side} transform={side ? "translate(200 0) scale(-1 1)" : undefined} fill="var(--angel)">
          <path d={wing} />
          <path d="M100 150 C 78 132, 44 110, 40 78 C 38 60, 50 50, 62 54" fill="none" stroke="var(--bg)" strokeWidth="5" strokeLinecap="round" />
          <path d="M100 124 C 84 112, 64 96, 62 80" fill="none" stroke="var(--bg)" strokeWidth="5" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="100" cy="100" r="46" fill="url(#core)" />
    </svg>
  );
}

function Aureola() {
  // Um círculo dourado de luz sobre a letra A
  return (
    <svg viewBox="0 0 200 200" className="relative h-full w-full">
      <ellipse cx="100" cy="46" rx="44" ry="13" fill="none" stroke="var(--angel)" strokeWidth="8" />
      <ellipse cx="100" cy="46" rx="44" ry="13" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2" />
      <path d="M100 74 L 146 176 H 124 L 114 152 H 86 L 76 176 H 54 Z M 93 134 H 107 L 100 116 Z" fill="var(--angel)" fillRule="evenodd" />
    </svg>
  );
}

export const THEMES: { id: Theme; name: string; feel: string }[] = [
  { id: "marca", name: "Anjo da marca", feel: "Acolhimento, proteção, grandeza" },
  { id: "asas", name: "Asas de Luz", feel: "Acolhimento, amor, cuidado" },
  { id: "aureola", name: "Auréola", feel: "Simplicidade, paz, modernidade" },
];
