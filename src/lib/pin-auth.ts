import "server-only";
import { createHash, createHmac, randomInt } from "node:crypto";
import { onlyDigits } from "./cpf";

/**
 * Login CPF + PIN de 4 números.
 * - O PIN nunca vira a senha diretamente: a senha guardada é HMAC(AUTH_SECRET, cpf + PIN).
 *   Assim não dá para testar PINs direto na API do Supabase e pular o bloqueio de tentativas.
 * - As funções do banco (cpf_signup, cpf_reset, ...) só aceitam chamadas com a chave do servidor.
 * Atenção: trocar AUTH_SECRET invalida todos os PINs (todo mundo teria de redefinir).
 */
function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET não configurado");
  return s;
}
export const serverKey = () => secret();
export const cpfEmail = (cpf: string) => `cpf${onlyDigits(cpf)}@cpf.anjo-ia.app`;
export const derivePassword = (cpf: string, pin: string) =>
  createHmac("sha256", secret()).update(`pin:${onlyDigits(cpf)}:${pin}`).digest("base64url");
export const guardKey = (scope: string, cpf: string) => createHash("sha256").update(`${scope}:${onlyDigits(cpf)}`).digest("hex");
export const randomPIN = () => String(randomInt(0, 10000)).padStart(4, "0");
