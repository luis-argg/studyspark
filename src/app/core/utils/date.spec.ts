import {
  addDays,
  addMonths,
  compareIso,
  daysBetween,
  formatRelativeDate,
  parseIsoDate,
  startOfMonth,
  toIsoDate,
  todayIso,
} from './date';

describe('date utils', () => {
  it('should format a local date as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('should pad single digit months and days', () => {
    expect(toIsoDate(new Date(2026, 8, 9))).toBe('2026-09-09');
  });

  it('should parse an ISO date in local time, not UTC', () => {
    const parsed = parseIsoDate('2026-01-05');

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(5);
    expect(parsed.getHours()).toBe(0);
  });

  it('should round-trip through parse and format', () => {
    expect(toIsoDate(parseIsoDate('2026-12-31'))).toBe('2026-12-31');
  });

  it('should report today in local time', () => {
    expect(todayIso()).toBe(toIsoDate(new Date()));
  });

  it('should add days across a month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('should clamp the day when shifting months', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonths('2026-01-15', 2)).toBe('2026-03-15');
  });

  it('should jump a year when shifting months past December', () => {
    expect(addMonths('2026-11-10', 3)).toBe('2027-02-10');
  });

  it('should get the first day of the month', () => {
    expect(startOfMonth('2026-07-24')).toBe('2026-07-01');
  });

  it('should compare ISO keys chronologically', () => {
    expect(compareIso('2026-01-05', '2026-01-06')).toBe(-1);
    expect(compareIso('2026-01-06', '2026-01-05')).toBe(1);
    expect(compareIso('2026-01-05', '2026-01-05')).toBe(0);
  });

  it('should count whole days between two keys', () => {
    expect(daysBetween('2026-01-01', '2026-01-08')).toBe(7);
    expect(daysBetween('2026-01-08', '2026-01-01')).toBe(-7);
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('should label nearby dates with relative words, in lowercase for mid-sentence use', () => {
    const today = '2026-01-05';

    expect(formatRelativeDate('2026-01-05', today)).toBe('hoy');
    expect(formatRelativeDate('2026-01-06', today)).toBe('mañana');
    expect(formatRelativeDate('2026-01-04', today)).toBe('ayer');
    expect(formatRelativeDate('2026-01-08', today)).toBe('en 3 días');
  });

  it('should fall back to a short date far from today', () => {
    expect(formatRelativeDate('2026-05-20', '2026-01-05')).toMatch(/may/);
  });
});
