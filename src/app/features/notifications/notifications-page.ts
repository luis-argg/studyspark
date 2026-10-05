import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { Task } from '../../core/models/task';
import { ClockService } from '../../core/clock/clock.service';
import { SubjectsStore } from '../../core/stores/subjects.store';
import { TasksStore } from '../../core/stores/tasks.store';
import { NOTIFICATION_LABELS, NotificationsStore } from '../../core/stores/notifications.store';
import { formatRelativeDate } from '../../core/utils/date';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-notifications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, RouterLink],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.css',
})
export class NotificationsPage {
  protected readonly store = inject(NotificationsStore);
  private readonly tasksStore = inject(TasksStore);
  private readonly subjectsStore = inject(SubjectsStore);
  private readonly clock = inject(ClockService);

  protected readonly notifications = this.store.notifications;
  protected readonly isEmpty = computed(() => this.notifications().length === 0);
  protected readonly hasUnread = computed(() => this.store.unreadCount() > 0);

  protected readonly labels = NOTIFICATION_LABELS;

  protected markAllRead(): void {
    this.store.markAllRead();
  }

  protected dismissAll(): void {
    this.store.dismissAll();
  }

  protected dismiss(taskId: string): void {
    this.store.dismiss(taskId);
  }

  protected dueLabel(dueDate: string): string {
    return formatRelativeDate(dueDate, this.clock.today());
  }

  protected daysLate(dueDate: string): number {
    return this.store.daysLate(dueDate);
  }

  protected taskOf(taskId: string): Task | undefined {
    return this.tasksStore.byId().get(taskId);
  }

  protected subjectName(subjectId: string | null): string {
    return this.subjectsStore.nameOf(subjectId);
  }

  protected subjectColor(subjectId: string | null): string {
    return this.subjectsStore.colorOf(subjectId);
  }
}
