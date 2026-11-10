/** Link "clique para conversar" do WhatsApp: abre o WhatsApp da própria pessoa com a mensagem pronta. Sem API, sem custo. */
export function waLink(phone: string, text: string) {
  let d = phone.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d; // número brasileiro com DDD
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export const SOS_WHATSAPP_TEXT = (contactName: string) =>
  `${contactName ? `Oi, ${contactName.split(" ")[0]}. ` : ""}Estou passando por um momento muito difícil e preciso de ajuda agora. Pode me ligar ou vir até mim, por favor? (mensagem enviada pelo botão SOS do Anjo IA)`;
