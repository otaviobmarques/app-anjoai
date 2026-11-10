/** "Como você está hoje?" — check-in de humor da tela inicial (opcional, uma vez por dia). */
export type Mood = { id: string; emoji: string; label: string; said: string; reply: string; heavy?: boolean };

export const MOODS: Mood[] = [
  { id: "feliz", emoji: "😊", label: "Feliz", said: "feliz", reply: "Que alegria! Vamos agradecer a Deus juntos por isso?" },
  { id: "grato", emoji: "🙏", label: "Grato(a)", said: "com gratidão", reply: "Gratidão abre o coração. Conta pra mim pelo que você agradece hoje." },
  { id: "em_paz", emoji: "🕊️", label: "Em paz", said: "em paz", reply: "Que bom. Que essa paz te acompanhe o dia todo." },
  { id: "cansado", emoji: "😮‍💨", label: "Cansado(a)", said: "com cansaço", reply: "Cansaço pesa. Você não precisa carregar tudo sozinho(a) hoje." },
  { id: "nervoso", emoji: "😤", label: "Nervoso(a)", said: "com os nervos à flor da pele", reply: "Respira comigo um instante. Quer me contar o que te deixou assim?", heavy: true },
  { id: "ansioso", emoji: "😟", label: "Ansioso(a)", said: "com ansiedade", reply: "A ansiedade aperta, mas ela passa. Vamos conversar com calma?", heavy: true },
  { id: "com_medo", emoji: "😨", label: "Com medo", said: "com medo", reply: "Você não está sozinho(a) com esse medo. Estou aqui.", heavy: true },
  { id: "triste", emoji: "😢", label: "Triste", said: "triste", reply: "Sinto muito que hoje esteja assim. Quer desabafar?", heavy: true },
  { id: "sozinho", emoji: "🫂", label: "Sozinho(a)", said: "se sentindo só", reply: "Eu estou aqui com você. Vamos conversar um pouco?", heavy: true },
  { id: "amargurado", emoji: "💔", label: "Amargurado(a)", said: "com o coração amargurado", reply: "Mágoa guardada dói. Quando quiser, a gente fala sobre isso.", heavy: true },
  { id: "pensamentos_ruins", emoji: "🌧️", label: "Com pensamentos ruins", said: "com pensamentos ruins", reply: "Obrigado por me contar. Vamos conversar agora? Você não precisa passar por isso sozinho(a).", heavy: true },
];

export const moodById = (id: string) => MOODS.find((m) => m.id === id);

/** "ansioso(a) e com medo" */
export function moodPhrase(ids: string[]) {
  const s = ids.map((i) => moodById(i)?.said).filter(Boolean) as string[];
  if (s.length <= 1) return s[0] ?? "";
  return `${s.slice(0, -1).join(", ")} e ${s[s.length - 1]}`;
}
