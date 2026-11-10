/**
 * Orações prontas do Anjo IA, com áudio gravado na voz do Will (public/audio/oracoes/).
 * Orações tradicionais da Igreja: texto litúrgico de domínio público.
 * Salmos: paráfrase fiel até a licença da versão bíblica ser definida (seção 9.5 do descritivo).
 * Mudou um texto? Rode: node scripts/gerar-audios.ts --force-oracoes
 */
export type Tradition = "evangelica" | "catolica" | "geral";
export type Prayer = {
  id: string;
  title: string;
  group: "Orações da fé" | "Salmos" | "Para o dia a dia";
  note?: string;
  for: Tradition[];
  text: string;
};

const TODAS: Tradition[] = ["evangelica", "catolica", "geral"];

export const PRAYERS: Prayer[] = [
  {
    id: "pai-nosso",
    title: "Pai Nosso",
    group: "Orações da fé",
    note: "Mateus 6:9-13",
    for: ["evangelica", "geral"],
    text: "Pai nosso, que estás nos céus, santificado seja o teu nome. Venha o teu Reino. Seja feita a tua vontade, assim na terra como no céu. O pão nosso de cada dia dá-nos hoje. Perdoa as nossas dívidas, assim como nós perdoamos aos nossos devedores. E não nos deixes cair em tentação, mas livra-nos do mal, porque teu é o Reino, o poder e a glória para sempre. Amém.",
  },
  {
    id: "pai-nosso-catolico",
    title: "Pai Nosso",
    group: "Orações da fé",
    note: "Forma litúrgica",
    for: ["catolica"],
    text: "Pai nosso que estais nos céus, santificado seja o vosso nome; venha a nós o vosso Reino; seja feita a vossa vontade, assim na terra como no céu. O pão nosso de cada dia nos dai hoje; perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido; e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.",
  },
  {
    id: "ave-maria",
    title: "Ave Maria",
    group: "Orações da fé",
    for: ["catolica"],
    text: "Ave Maria, cheia de graça, o Senhor é convosco; bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora de nossa morte. Amém.",
  },
  {
    id: "santo-anjo",
    title: "Santo Anjo do Senhor",
    group: "Orações da fé",
    for: ["catolica"],
    text: "Santo Anjo do Senhor, meu zeloso guardador, se a ti me confiou a piedade divina, sempre me rege, me guarda, me governa e me ilumina. Amém.",
  },
  {
    id: "gloria",
    title: "Glória ao Pai",
    group: "Orações da fé",
    for: ["catolica"],
    text: "Glória ao Pai, ao Filho e ao Espírito Santo. Como era no princípio, agora e sempre. Amém.",
  },
  {
    id: "serenidade",
    title: "Oração da Serenidade",
    group: "Orações da fé",
    for: TODAS,
    text: "Senhor, concede-me serenidade para aceitar as coisas que não posso mudar, coragem para mudar as que posso, e sabedoria para reconhecer a diferença entre elas. Amém.",
  },
  {
    id: "sao-francisco",
    title: "Oração pela Paz",
    group: "Orações da fé",
    note: "Atribuída a São Francisco de Assis",
    for: TODAS,
    text: "Senhor, fazei-me instrumento de vossa paz. Onde houver ódio, que eu leve o amor. Onde houver ofensa, que eu leve o perdão. Onde houver discórdia, que eu leve a união. Onde houver dúvida, que eu leve a fé. Onde houver erro, que eu leve a verdade. Onde houver desespero, que eu leve a esperança. Onde houver tristeza, que eu leve a alegria. Onde houver trevas, que eu leve a luz. Ó Mestre, fazei que eu procure mais consolar que ser consolado, compreender que ser compreendido, amar que ser amado. Pois é dando que se recebe, é perdoando que se é perdoado, e é morrendo que se vive para a vida eterna. Amém.",
  },
  {
    id: "salmo-23",
    title: "Salmo 23",
    group: "Salmos",
    note: "O Senhor é o meu pastor · paráfrase",
    for: TODAS,
    text: "O Senhor é o meu pastor; nada me faltará. Ele me faz descansar em pastos verdes e me conduz a águas tranquilas. Ele renova as minhas forças e me guia por caminhos certos, por amor do seu nome. Mesmo que eu atravesse o vale da sombra da morte, não terei medo de mal nenhum, porque tu estás comigo; a tua vara e o teu cajado me dão segurança. Preparas uma mesa para mim diante dos meus inimigos; unges a minha cabeça com óleo, e o meu cálice transborda. A bondade e o amor de Deus me acompanharão todos os dias da minha vida, e eu habitarei na casa do Senhor para sempre.",
  },
  {
    id: "salmo-91",
    title: "Salmo 91",
    group: "Salmos",
    note: "Proteção do Altíssimo · paráfrase",
    for: TODAS,
    text: "Quem mora no abrigo do Altíssimo descansa à sombra do Todo-poderoso. Eu digo ao Senhor: tu és o meu refúgio e a minha fortaleza, o meu Deus, em quem eu confio. Ele te livra da armadilha do caçador e da peste que destrói. Ele te cobre com as suas penas, e debaixo das suas asas você encontra abrigo; a fidelidade dele é escudo e proteção. Você não terá medo do terror da noite, nem da flecha que voa de dia, nem da doença que anda na escuridão, nem do mal que devasta ao meio-dia. Mil podem cair ao seu lado, e dez mil à sua direita, mas nada disso chegará até você. Porque você fez do Senhor o seu refúgio, e do Altíssimo a sua morada, nenhum mal te alcançará, e nenhuma praga chegará à sua casa. Pois ele dará ordens aos seus anjos a seu respeito, para que te guardem em todos os teus caminhos. Eles te levarão nas mãos, para que você não tropece em nenhuma pedra. Você pisará o leão e a serpente. Porque ele me ama, eu o livrarei, diz o Senhor; eu o protegerei, porque ele conhece o meu nome. Ele clamará por mim, e eu responderei; estarei com ele na angústia, eu o livrarei e o honrarei. Darei a ele vida longa e lhe mostrarei a minha salvação.",
  },
  {
    id: "salmo-121",
    title: "Salmo 121",
    group: "Salmos",
    note: "De onde vem o meu socorro · paráfrase",
    for: TODAS,
    text: "Levanto os meus olhos para os montes: de onde virá o meu socorro? O meu socorro vem do Senhor, que fez o céu e a terra. Ele não deixará você tropeçar; aquele que te guarda não dorme. O Senhor é quem te guarda; o Senhor é a sombra que te protege. De dia o sol não te fará mal, nem a lua de noite. O Senhor te protegerá de todo mal; ele guardará a sua vida. O Senhor guardará a sua saída e a sua chegada, desde agora e para sempre.",
  },
  {
    id: "manha",
    title: "Oração da manhã",
    group: "Para o dia a dia",
    for: TODAS,
    text: "Senhor, obrigado por mais este dia. Eu entrego nas tuas mãos tudo o que vou viver hoje: o meu trabalho, a minha família e as minhas preocupações. Guarda os meus passos, as minhas palavras e os meus pensamentos. Que eu seja luz para quem cruzar o meu caminho. Em nome de Jesus, amém.",
  },
  {
    id: "noite",
    title: "Oração antes de dormir",
    group: "Para o dia a dia",
    for: TODAS,
    text: "Senhor, obrigado por este dia, pelo que deu certo e pelo que eu aprendi com o que não deu. Perdoa as minhas falhas e me ajuda a perdoar quem me feriu. Entrego nas tuas mãos as preocupações que eu não consigo resolver. Guarda a minha casa, a minha família e o meu sono. Que eu descanse em paz, sabendo que tu cuidas de mim. Em nome de Jesus, amém.",
  },
  {
    id: "ansiedade",
    title: "Oração na ansiedade",
    group: "Para o dia a dia",
    for: TODAS,
    text: "Senhor, o meu coração está apertado e os meus pensamentos correm rápido demais. Eu respiro fundo e lembro que tu estás aqui. Toma conta do que eu não consigo controlar. Acalma a minha mente, aquieta o meu peito e me dá a tua paz, que é maior do que o meu entendimento. Um passo de cada vez, eu confio em ti. Em nome de Jesus, amém.",
  },
];

export const prayerAudio = (id: string) => `/audio/oracoes/${id}.mp3`;
export const prayersFor = (t: Tradition) => PRAYERS.filter((p) => p.for.includes(t));
