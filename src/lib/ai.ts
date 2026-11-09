import Anthropic from "@anthropic-ai/sdk";

export const CHAT_MODEL = "claude-opus-5-5";
export const FAST_MODEL = "claude-haiku-5-5";

export function aiAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let _client: Anthropic | null = null;
export function ai() {
  if (!_client) _client = new Anthropic({ maxRetries: 1, timeout: 60_000 });
  return _client;
}

export function nowBR() {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" });
}
