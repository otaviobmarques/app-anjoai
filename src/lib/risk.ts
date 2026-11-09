import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

/**
 * Detecção de risco — camadas da Fase 0:
 *  1) palavras-chave (instantânea, funciona mesmo se a IA cair)
 *  2) classificador com modelo rápido, em paralelo à resposta
 *  3) o próprio Prompt-Mestre segue o protocolo de crise na resposta
 * Níveis: 0 sem sinal · 1 tristeza/desânimo · 2 risco (ideação sem plano, violência) · 3 risco alto (plano, meio, despedida, perigo imediato)
 */

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");

const LEVEL3 = [
  /\b(vou|quero|pensando em|planejando|decidi) (me matar|tirar (a )?minha (propria )?vida|acabar com (a )?minha vida|me suicidar)/,
  /\b(me matar|me suicidar|suicidio) (hoje|agora|essa noite|esta noite|amanha)/,
  /\b(comprei|juntei|separei|tenho aqui) (os |uns )?(remedios|comprimidos|corda|veneno|arma)\b.*\b(morrer|acabar|me matar)/,
  /\b(carta de despedida|me despedindo de todos|adeus a todos|ultima mensagem)\b/,
  /\b(vou pular|vou me jogar) (da|de|do)\b/,
];
const LEVEL2 = [
  /\b(suicid|me matar|tirar (a )?minha vida|acabar com (a )?minha vida)/,
  /\b(quero|queria|vontade de) (morrer|sumir|desaparecer|nao acordar|dormir e nao acordar)/,
  /\bnao (aguento|quero) mais (viver|existir)/,
  /\b(me cortar|me corto|me cortei|automutila|me machucar de proposito)/,
  /\b(melhor sem mim|seria melhor (se eu )?(nao existisse|morresse))/,
  /\b(ele|ela) (me bate|me bateu|ameacou me matar|vai me matar)/,
];

export function keywordRisk(text: string): 0 | 2 | 3 {
  const t = norm(text);
  if (LEVEL3.some((r) => r.test(t))) return 3;
  if (LEVEL2.some((r) => r.test(t))) return 2;
  return 0;
}

const RiskSchema = z.object({
  level: z.number().int().min(0).max(3),
  reason: z.string(),
});

const CLASSIFIER_PROMPT = `Você é um classificador de risco para um app cristão de apoio emocional no Brasil. Leia as últimas mensagens da pessoa e devolva o nível de risco da ÚLTIMA mensagem considerando o contexto:
0 = sem sinal de risco;
1 = tristeza, desânimo, cansaço, ansiedade, sem sinal de se ferir;
2 = ideação suicida sem plano, desejo de morrer/sumir, automutilação, ou relato de violência/agressão;
3 = plano, meio disponível, data, despedida, tentativa em andamento ou perigo imediato para si ou para outros.
Na dúvida entre dois níveis, escolha o maior. Ironia e expressões comuns ("morri de rir", "essa prova me mata") são 0. "reason" em uma frase curta, sem repetir dados pessoais.`;

export async function classifyRisk(client: Anthropic, recentUserTexts: string[]) {
  const transcript = recentUserTexts.map((t, i) => `[${i + 1}] ${t}`).join("\n");
  const res = await client.messages.parse({
    model: "claude-haiku-5-5",
    max_tokens: 1024,
    output_config: { effort: "low", format: zodOutputFormat(RiskSchema) },
    system: CLASSIFIER_PROMPT,
    messages: [{ role: "user", content: `Mensagens da pessoa (a última é a que importa):\n${transcript}` }],
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) {
    // Sem classificação: o servidor registra para revisão humana, sem disparar o cartão de crise sozinho
    return null;
  }
  return { level: res.parsed_output.level as 0 | 1 | 2 | 3, reason: res.parsed_output.reason };
}
