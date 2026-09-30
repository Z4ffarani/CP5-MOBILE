function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

// Máscara aplicada durante a digitação: (11) 3456-7890 para fixo e (11) 91234-5678 para celular.
// Separadores só aparecem seguidos de dígitos, então apagar com backspace funciona normalmente.
export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function phoneError(value: string): string | null {
  const length = onlyDigits(value).length;
  return length === 10 || length === 11 ? null : 'Informe um celular válido com DDD, como (11) 91234-5678.';
}

// Máscara DD/MM/AAAA aplicada durante a digitação.
export function formatBirthDate(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function birthDateError(value: string, today: Date = new Date()): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return 'Informe a data de nascimento no formato DD/MM/AAAA.';

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // O Date "corrige" datas impossíveis (31/02 vira 03/03); se os campos mudaram, a data não existe.
  const exists = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!exists || year < 1900) return 'Data de nascimento inválida.';
  if (date > today) return 'A data de nascimento não pode estar no futuro.';
  return null;
}
