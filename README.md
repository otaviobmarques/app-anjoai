# Anjo IA — Fase 0 (PWA de teste)

Conselheiro cristão de bolso com IA. Implementa a **Fase 0** do *Descritivo técnico do app v1.2*, sem WhatsApp.

## O que está pronto

| Item do descritivo | Onde |
|---|---|
| Abertura com logotipo e brilho dourado | `src/app/page.tsx` |
| Cadastro/login por e-mail (RF01 parcial) | `src/app/entrar` |
| Aceite de termos + maioridade, com versão registrada (RF03) | `src/app/boas-vindas`, tabela `consents` |
| Perfil: nome, tradição, versão da Bíblia, voz, tema, modo (RF02) | `src/app/config` |
| Temas do anjo: Anjo da marca, Asas de Luz, Auréola (RF10) | `src/components/AngelArt.tsx` |
| Modos escuro / claro / automático + letras ajustáveis (RF11) | `globals.css`, Ajustes |
| Conversa por texto com streaming (RF04) | `src/app/conversa`, `src/app/api/chat` |
| Ditado por voz e resposta em voz (RF05, versão do navegador) | `src/lib/voice.ts` |
| Memória da jornada, visível e apagável (RF07) | `journey_memory`, Ajustes |
| Orações personalizadas, salvar, ouvir; pedidos de oração (RF08) | `src/app/oracoes`, `src/app/api/oracao` |
| Palavra do dia (RF09, sem notificação ainda) | `src/lib/verses.ts` |
| Rede de Cuidado: até 2 contatos, convite e confirmação (RF12) | `src/app/rede`, `src/app/convite/[token]` |
| Detecção de risco em camadas + alertas por e-mail (RF13) | `src/lib/risk.ts`, `src/lib/alerts.ts` |
| Botão SOS sempre visível, funciona sem internet (RF14) | `src/components/SosButton.tsx`, `src/app/sos`, `public/sw.js` |
| Limite do plano gratuito que nunca bloqueia crise (RF24) | `src/lib/limits.ts` |
| Exportar e excluir conta e dados (RF25) | `src/app/api/conta` |
| Painel simples: métricas e fila de revisão de risco (RF26 parcial) | `src/app/admin` |

## Detecção de risco (Fase 0)

1. **Palavras-chave**, instantâneas: funcionam mesmo se a IA cair. Nível 2 ou 3 já mostra o cartão de crise (188/192) e avisa o modelo por uma mensagem de sistema.
2. **Classificador** (Claude Haiku 5.5, saída estruturada), roda em paralelo à resposta. Nível 3 avisa a Rede de Cuidado por e-mail.
3. **Prompt-Mestre**: o próprio modelo segue o protocolo de crise.

Se a IA falhar ou recusar em uma conversa de risco, o app responde com um texto fixo de encaminhamento (`CRISIS_FALLBACK`).

## Provisório — precisa de revisão antes do teste fechado

- **Prompt-Mestre** (`src/lib/prompt.ts`): rascunho v0.1 escrito sem o documento oficial. Precisa de revisão de pastor/padre, psicólogo e jurídico.
- **Protocolo de crise e regras da Rede de Cuidado**: rascunho, pelo mesmo motivo.
- **Termos e privacidade** (`src/app/termos`): rascunho, sem parecer jurídico.
- **Palavra do dia**: versículos em paráfrase livre até a licença da versão bíblica ser definida.
- **Símbolo do anjo**: vetorizado automaticamente a partir do PNG. Trocar pelo vetor oficial do designer.
- **Confirmação automática de e-mail** (trigger `autoconfirm_email`): só para o grupo fechado. Remover antes de abrir ao público.

## Variáveis de ambiente

Veja `.env.example`.

- `ANTHROPIC_API_KEY`: sem ela o app funciona, mas a conversa e as orações respondem que a IA não está ligada. O SOS e as palavras-chave continuam funcionando.
- `RESEND_API_KEY` e `ALERT_FROM`: sem elas, os alertas ficam registrados como "pendente" no painel e não são enviados. É preciso um domínio verificado no Resend (ex.: `anjoia.com.br`).

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencher
npm run dev
```

## Banco (Supabase `anjo-ia`, sa-east-1)

Todas as tabelas têm RLS por usuário. Eventos de risco e alertas só são gravados por funções `security definer` (`log_risk_event`, `record_alert`). Para tornar alguém administrador:

```sql
update public.profiles set is_admin = true where id = (select id from auth.users where email = 'voce@exemplo.com');
```
