import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ClockService } from '../../core/clock/clock.service';
import { SubjectsStore } from '../../core/stores/subjects.store';
import { TasksStore } from '../../core/stores/tasks.store';
import {
  daysLabel,
  monthGrid,
  monthLabel,
  relativeToToday,
  shiftMonth,
  weekdayLabels,
} from '../../core/utils/calendar';
import { startOfMonth } from '../../core/utils/date';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-calendar-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, RouterLink],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.css',
})
export class CalendarPage {
  private readonly tasksStore = inject(TasksStore);
  private readonly subjectsStore = inject(SubjectsStore);
  private readonly clock = inject(ClockService);

  protected readonly weekdays = weekdayLabels();

  protected readonly cursor = signal(startOfMonth(this.clock.today()));
  protected readonly selectedDay = signal(this.clock.today());

  protected readonly monthTitle = computed(() => monthLabel(this.cursor()));
  protected readonly days = computed(() => monthGrid(this.cursor(), this.clock.today()));
  protected readonly selectedDayTitle = computed(() => daysLabel(this.selectedDay()));

  protected readonly countsByDay = computed(() => {
    const counts = new Map<string, number>();
    for (const task of this.tasksStore.tasks()) {
      counts.set(task.dueDate, (counts.get(task.dueDate) ?? 0) + 1);
    }
    return counts;
  });

  protected readonly selectedTasks = computed(() =>
    this.tasksStore.tasksForDate(this.selectedDay()),
  );
  protected readonly selectedIsEmpty = computed(() => this.selectedTasks().length === 0);
  protected readonly isAtCurrentMonth = computed(
    () => this.cursor() === startOfMonth(this.clock.today()),
  );

  protected countFor(iso: string): number {
    return this.countsByDay().get(iso) ?? 0;
  }

  protected hasOverdueOn(iso: string): boolean {
    return this.tasksStore.tasksForDate(iso).some((task) => this.isOverdue(task.dueDate));
  }

  protected isOverdue(dueDate: string): boolean {
    return relativeToToday(dueDate, this.clock.today()) < 0;
  }

  protected isPending(status: string): boolean {
    return status === 'pending';
  }

  protected selectDay(iso: string): void {
    this.selectedDay.set(iso);
  }

  protected previousMonth(): void {
    this.cursor.set(shiftMonth(this.cursor(), -1));
  }

  protected nextMonth(): void {
    this.cursor.set(shiftMonth(this.cursor(), 1));
  }

  protected goToToday(): void {
    const today = this.clock.today();
    this.cursor.set(startOfMonth(today));
    this.selectedDay.set(today);
  }

  protected subjectName(subjectId: string | null): string {
    return this.subjectsStore.nameOf(subjectId);
  }

  protected subjectColor(subjectId: string | null): string {
    return this.subjectsStore.colorOf(subjectId);
  }
}
