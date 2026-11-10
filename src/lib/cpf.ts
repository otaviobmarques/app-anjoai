export const onlyDigits = (s: string) => (s ?? "").replace(/\D/g, "");

/** Valida CPF (dígitos verificadores). */
export function validCPF(input: string) {
  const c = onlyDigits(input);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const dv = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(c[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(c[9]) && dv(10) === Number(c[10]);
}

export function formatCPF(input: string) {
  const c = onlyDigits(input).slice(0, 11);
  return c.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export const validPIN = (pin: string) => /^\d{4}$/.test(pin);
