// Gera os áudios fixos do Anjo com a voz do Will (ElevenLabs) em public/audio/.
// Uso: ELEVENLABS_API_KEY=... node scripts/gerar-audios.ts [--force]
// (atrás de proxy: NODE_USE_ENV_PROXY=1)
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { VERSES } from "../src/lib/verses.ts";
import { FIXED_AUDIO, palavraAudio } from "../src/lib/fixed-audio.ts";
import { PRAYERS, prayerAudio } from "../src/lib/prayers.ts";

const VOICE = process.env.ELEVENLABS_VOICE_ID || "CstacWqMhJQlnfLPxRG4";
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("defina ELEVENLABS_API_KEY");
const force = process.argv.includes("--force");

// "Salmos 23:1" -> "Salmos, capítulo 23, versículo 1" (fica natural na voz)
const falarRef = (ref: string) =>
  ref.replace(/(\d+):(\d+)(?:-(\d+))?$/, (_, c, v, v2) => `capítulo ${c}, ${v2 ? `versículos ${v} a ${v2}` : `versículo ${v}`}`);

const jobs: { file: string; text: string }[] = [
  ...Object.values(FIXED_AUDIO),
  ...VERSES.map((v, i) => ({ file: palavraAudio(i), text: `${v.text} ${falarRef(v.ref)}. ${v.reflection}` })),
  ...PRAYERS.map((p) => ({ file: prayerAudio(p.id), text: p.text })),
];

for (const j of jobs) {
  const out = join("public", j.file);
  if (existsSync(out) && !force) { console.log("já existe", out); continue; }
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: j.text,
      model_id: "eleven_multilingual_v2",
      language_code: "pt",
      voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
    }),
  });
  if (!r.ok) throw new Error(`${out}: ${r.status} ${await r.text()}`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  console.log("ok", out);
}
