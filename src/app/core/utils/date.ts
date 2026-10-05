export function toIsoDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(iso: string): Date {
  const [year = 1970, month = 1, day = 1] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function addMonths(iso: string, months: number): string {
  const date = parseIsoDate(iso);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toIsoDate(date);
}

export function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function daysBetween(from: string, to: string): number {
  const msPerDay = 86_400_000;
  return Math.round((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / msPerDay);
}

/**
 * Etiquetas en minúscula: todos sus usos son a mitad de frase
 * ("Vence en 3 días", "Actualizado ayer"), donde una mayúscula se lee mal.
 */
const RELATIVE_LABELS: Record<string, string> = {
  '-1': 'ayer',
  '0': 'hoy',
  '1': 'mañana',
};

export function formatRelativeDate(iso: string, today = todayIso()): string {
  const diff = daysBetween(today, iso);
  const relative = RELATIVE_LABELS[String(diff)];
  if (relative) {
    return relative;
  }

  if (diff > 1 && diff < 7) {
    return `en ${diff} días`;
  }

  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(
    parseIsoDate(iso),
  );
}

export function formatLongDate(date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
