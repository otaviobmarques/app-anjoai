/**
 * Falas fixas do Anjo, gravadas uma vez com a voz do Will e guardadas em public/audio/.
 * Tocam na hora, sem custo por uso e sem internet (as do SOS ficam no cache do aparelho).
 * Mudou algum texto? Rode: node scripts/gerar-audios.ts (precisa de ELEVENLABS_API_KEY).
 */
export const FIXED_AUDIO = {
  saudacao: { file: "/audio/saudacao.mp3", text: "Pode falar, estou ouvindo." },
  "sos-respiracao": {
    file: "/audio/sos-respiracao.mp3",
    text:
      "Estou aqui com você. Vamos respirar juntos, bem devagar. Inspire pelo nariz, contando até quatro: um, dois, três, quatro. Segure o ar: um, dois, três, quatro. Agora solte devagar pela boca: um, dois, três, quatro, cinco, seis. Mais uma vez. Inspire: um, dois, três, quatro. Segure: um, dois, três, quatro. Solte: um, dois, três, quatro, cinco, seis. Muito bem. Se houver algo perto de você que possa te machucar, afaste-se dele agora. Chame alguém para ficar com você. E se precisar conversar, ligue cento e oitenta e oito, o CVV. Eles atendem a qualquer hora. Você não está só.",
  },
  "sos-intro": {
    file: "/audio/sos-intro.mp3",
    text: "Você não está só. Para falar com alguém agora, toque no número cento e oitenta e oito, do CVV, que atende vinte e quatro horas. Em uma emergência médica, toque no cento e noventa e dois.",
  },
} as const;

export const palavraAudio = (index: number) => `/audio/palavra/${String(index + 1).padStart(2, "0")}.mp3`;
