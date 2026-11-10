// Monta as meditações: narração do Will (ElevenLabs) + pausas + som ambiente baixo, com ffmpeg.
// Uso: ELEVENLABS_API_KEY=... FFMPEG=/caminho/ffmpeg node scripts/gerar-meditacoes.ts [id]
// (atrás de proxy: NODE_USE_ENV_PROXY=1)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MEDITATIONS } from "../src/lib/meditations.ts";

const KEY = process.env.ELEVENLABS_API_KEY;
const FF = process.env.FFMPEG || "ffmpeg";
const VOICE = process.env.ELEVENLABS_VOICE_ID || "CstacWqMhJQlnfLPxRG4";
if (!KEY) throw new Error("defina ELEVENLABS_API_KEY");
const only = process.argv[2];
mkdirSync("public/audio/meditacoes", { recursive: true });

const ff = (args: string[]) => execFileSync(FF, ["-hide_banner", "-loglevel", "error", "-y", ...args]);

for (const m of MEDITATIONS.filter((x) => !only || x.id === only)) {
  const dir = mkdtempSync(join(tmpdir(), `med-${m.id}-`));
  const parts: string[] = [];
  let n = 0;
  for (const step of m.steps) {
    const out = join(dir, `${String(n++).padStart(3, "0")}.wav`);
    if (typeof step === "number") {
      ff(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(step), out]);
    } else {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: step,
          model_id: "eleven_multilingual_v2",
          language_code: "pt",
          voice_settings: { stability: 0.75, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true, speed: 0.88 },
        }),
      });
      if (!r.ok) throw new Error(`${m.id}: ${r.status} ${await r.text()}`);
      const mp3 = out.replace(".wav", ".mp3");
      writeFileSync(mp3, Buffer.from(await r.arrayBuffer()));
      ff(["-i", mp3, "-ar", "44100", "-ac", "1", out]);
    }
    parts.push(out);
  }
  const list = join(dir, "lista.txt");
  writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
  const voice = join(dir, "voz.wav");
  ff(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", voice]);
  const dur = Number(execFileSync(FF.replace(/ffmpeg$/, "ffprobe"), ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", voice]).toString()) + 6;
  // fundo: som ambiente em loop, bem baixo, com entrada e saída suaves
  ff([
    "-i", voice, "-stream_loop", "-1", "-i", `public/audio/sons/${m.ambient}.mp3`,
    "-filter_complex",
    `[1:a]volume=0.13,afade=t=in:d=4,afade=t=out:st=${dur - 6}:d=6,atrim=0:${dur}[bg];[0:a]adelay=2500|2500,apad=pad_dur=4[v];[v][bg]amix=inputs=2:duration=longest:dropout_transition=0,volume=1.6,loudnorm=I=-18:TP=-1.5:LRA=11[out]`,
    "-map", "[out]", "-t", String(dur), "-ac", "2", "-c:a", "libmp3lame", "-b:a", "96k",
    `public/audio/meditacoes/${m.id}.mp3`,
  ]);
  console.log("ok", m.id, `${Math.round(dur / 60 * 10) / 10} min`);
}
