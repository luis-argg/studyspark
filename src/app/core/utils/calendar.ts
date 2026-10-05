import { addDays, addMonths, daysBetween, parseIsoDate, startOfMonth, todayIso } from './date';

export interface CalendarDay {
  readonly iso: string;
  readonly dayOfMonth: number;
  readonly inCurrentMonth: boolean;
  readonly isToday: boolean;
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export function weekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

function startOfWeek(iso: string): string {
  const offset = (parseIsoDate(iso).getDay() + 6) % 7;
  return addDays(iso, -offset);
}

export function monthGrid(iso: string, today = todayIso()): readonly CalendarDay[] {
  const gridStart = startOfWeek(startOfMonth(iso));
  const days: CalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const dayIso = addDays(gridStart, index);
    days.push({
      iso: dayIso,
      dayOfMonth: parseIsoDate(dayIso).getDate(),
      inCurrentMonth: dayIso.slice(0, 7) === iso.slice(0, 7),
      isToday: dayIso === today,
    });
  }

  return days;
}

export function shiftMonth(iso: string, months: number): string {
  return addMonths(startOfMonth(iso), months);
}

export function monthLabel(iso: string): string {
  const [year = 1970, month = 1] = iso.split('-').map(Number);
  const formatted = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function daysLabel(iso: string): string {
  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parseIsoDate(iso));
}

export function relativeToToday(iso: string, today = todayIso()): number {
  return daysBetween(today, iso);
}
