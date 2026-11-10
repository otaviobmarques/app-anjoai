/** Converte o que a pessoa digita (telefone, e-mail ou usuário da equipe) no login interno. */
export function loginEmail(input: string) {
  const v = input.trim();
  if (v.includes("@")) return v.toLowerCase();
  let d = v.replace(/\D/g, "");
  if (d.length >= 10) {
    if (d.length === 10 || d.length === 11) d = "55" + d;
    return `${d}@tel.anjo-ia.app`;
  }
  return `${v.toLowerCase()}@anjo-ia.app`; // contas da equipe, ex.: "Admin"
}
