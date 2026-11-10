import Link from "next/link";
import { TERMS_VERSION } from "@/lib/terms";

export const metadata = { title: "Termos e privacidade — Anjo IA" };

export default function Termos() {
  return (
    <article className="mx-auto max-w-2xl space-y-4 px-4 py-10 leading-relaxed">
      <p className="rounded-xl border border-line bg-surface-2 p-3 text-sm"><strong>Rascunho para a fase de testes ({TERMS_VERSION}).</strong> Este texto ainda precisa do parecer jurídico (LGPD, regras das lojas) antes de abrir ao público.</p>
      <h1 className="text-2xl font-extrabold">Termos de uso e política de privacidade</h1>
      <div className="rounded-xl border-2 border-gold bg-surface-2 p-4">
        <p className="font-bold">Acompanhamento pela equipe de cuidado</p>
        <p className="mt-1 text-sm">Ao usar o Anjo IA, você concorda que a equipe de cuidado do aplicativo pode acessar e ler as suas conversas, orações e o seu histórico para acompanhar a sua caminhada e ajudar você no que for preciso. Cada acesso fica registrado e você pode consultar esse registro em Ajustes. Se não concordar com isso, não aceite os termos e não use o aplicativo.</p>
      </div>
      <h2 className="text-lg font-bold">1. O que é o Anjo IA</h2>
      <p>O Anjo IA é um aplicativo com inteligência artificial que conversa, aconselha com base na Bíblia e faz orações. Ele não é serviço médico, psicológico, pastoral ou de emergência, e não substitui esses profissionais.</p>
      <h2 className="text-lg font-bold">2. Quem pode usar</h2>
      <p>Somente pessoas com 18 anos ou mais.</p>
      <h2 className="text-lg font-bold">3. Emergências</h2>
      <p>Em risco de vida, ligue 188 (CVV), 192 (SAMU) ou 190 (Polícia). O botão SOS mostra esses números mesmo sem internet. Se você cadastrar contatos de confiança, eles podem ser avisados quando você apertar o SOS ou quando o app perceber sinais de risco grave. Eles não recebem o conteúdo das conversas.</p>
      <h2 className="text-lg font-bold">4. Dados que tratamos</h2>
      <p>Cadastro (nome, e-mail), preferências, conversas, orações, pedidos de oração, contatos de confiança, eventos de risco e alertas. Conversas sobre fé e saúde emocional são dados sensíveis (LGPD, art. 11) e são tratadas com base no seu consentimento (inclusive para o acompanhamento pela equipe de cuidado, ver item 6) e, nos casos de risco à vida, para a proteção da vida (art. 11, II, “e”).</p>
      <h2 className="text-lg font-bold">5. Com quem compartilhamos</h2>
      <p>Com fornecedores necessários para o app funcionar: hospedagem e banco de dados (Supabase, servidores em São Paulo; Vercel), inteligência artificial (Anthropic, que processa as mensagens para gerar as respostas) e envio de e-mails (Resend). Não vendemos dados e não usamos suas conversas para publicidade.</p>
      <h2 className="text-lg font-bold">6. Acesso da equipe</h2>
      <p>A equipe de cuidado do Anjo IA pode acessar e ler o seu histórico completo — conversas, orações, pedidos de oração, check-ins de humor, eventos de risco e Rede de Cuidado — para acompanhar a sua caminhada, cuidar de você, revisar casos de risco, atender pedidos seus e dar suporte. Ao aceitar estes termos, você consente expressamente com esse acesso, inclusive às suas conversas. Cada acesso fica registrado com o nome de quem acessou, a data e o motivo, e você pode consultar esse registro ao baixar os seus dados em Ajustes. Você pode retirar esse consentimento a qualquer momento excluindo a sua conta em Ajustes.</p>
      <h2 className="text-lg font-bold">7. Seus direitos</h2>
      <p>Você pode baixar todos os seus dados e excluir sua conta a qualquer momento em Ajustes. Também pode revogar consentimentos e falar com o encarregado de dados (DPO) pelo canal que será informado aqui.</p>
      <Link href="/" className="btn-ghost inline-flex">Voltar</Link>
    </article>
  );
}
