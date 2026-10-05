import { monthGrid, monthLabel, shiftMonth, weekdayLabels } from './calendar';
import { startOfMonth, todayIso } from './date';

describe('calendar utils', () => {
  it('should start the week on Monday', () => {
    expect(weekdayLabels()[0]).toBe('Lun');
    expect(weekdayLabels()).toHaveLength(7);
  });

  it('should always render 42 cells', () => {
    expect(monthGrid('2026-01-01')).toHaveLength(42);
  });

  it('should include the whole month', () => {
    const grid = monthGrid('2026-01-01');
    const inMonth = grid.filter((day) => day.inCurrentMonth);

    expect(inMonth).toHaveLength(31);
    expect(inMonth[0].iso).toBe('2026-01-01');
    expect(inMonth[30].iso).toBe('2026-01-31');
  });

  it('should begin the grid on the Monday of the first week', () => {
    const grid = monthGrid('2026-01-01');

    expect(new Date(2026, 0, 1).getDay()).toBe(4);
    expect(grid[0].iso).toBe('2025-12-29');
  });

  it('should mark exactly one day as today', () => {
    const today = todayIso();
    const grid = monthGrid(startOfMonth(today), today);

    expect(grid.filter((day) => day.isToday)).toHaveLength(1);
    expect(grid.find((day) => day.isToday)?.iso).toBe(today);
  });

  it('should mark days outside the month', () => {
    const grid = monthGrid('2026-01-01');

    expect(grid[0].inCurrentMonth).toBe(false);
    expect(grid[41].iso).toBe('2026-02-08');
  });

  it('should shift between months in both directions', () => {
    expect(shiftMonth('2026-01-15', -1)).toBe('2025-12-01');
    expect(shiftMonth('2026-01-15', 1)).toBe('2026-02-01');
    expect(shiftMonth('2026-12-15', 1)).toBe('2027-01-01');
  });

  it('should label the month in Spanish', () => {
    expect(monthLabel('2026-01-01').toLowerCase()).toContain('enero');
    expect(monthLabel('2026-01-01')).toContain('2026');
  });
});
