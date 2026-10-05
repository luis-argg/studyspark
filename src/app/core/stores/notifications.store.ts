import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { ClockService } from '../clock/clock.service';
import type { AppNotification } from '../models/notification';
import { STORAGE_KEYS } from '../models/storage-key';
import { isRecord } from '../storage/guards';
import { StorageService } from '../storage/storage.service';
import { compareIso, daysBetween } from '../utils/date';
import { TasksStore } from './tasks.store';

export const NOTIFICATION_LABELS: Record<AppNotification['kind'], string> = {
  overdue: 'Vencida',
  today: 'Para hoy',
};

/**
 * `dismissed` guarda el día en que se descartó cada tarea, no solo el id.
 * Así el aviso de hoy se calla, pero el de mañana vuelve a aparecer si la
 * tarea sigue sin completarse.
 */
interface NotificationState {
  readonly read: string[];
  readonly dismissed: Record<string, string>;
}

const DEFAULT_STATE: NotificationState = { read: [], dismissed: {} };

const isNotificationState = (value: unknown): value is NotificationState =>
  isRecord(value) && Array.isArray(value['read']) && isRecord(value['dismissed']);

@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly storage = inject(StorageService);
  private readonly tasks = inject(TasksStore);
  private readonly clock = inject(ClockService);

  private readonly state = signal<NotificationState>(
    this.storage.read(STORAGE_KEYS.notifications, DEFAULT_STATE, isNotificationState),
  );

  readonly notifications = computed<AppNotification[]>(() => {
    const today = this.clock.today();
    const { read, dismissed } = this.state();
    const readSet = new Set(read);
    const createdAt = new Date().toISOString();

    return this.tasks
      .pending()
      .filter((task) => compareIso(task.dueDate, today) <= 0)
      .filter((task) => dismissed[task.id] !== today)
      .map<AppNotification>((task) => {
        const overdue = compareIso(task.dueDate, today) < 0;
        const kind: AppNotification['kind'] = overdue ? 'overdue' : 'today';

        return {
          id: `${kind}:${task.id}`,
          kind,
          taskId: task.id,
          taskTitle: task.title,
          dueDate: task.dueDate,
          createdAt,
          read: readSet.has(task.id),
        };
      })
      .sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'overdue' ? -1 : 1;
        }
        return compareIso(a.dueDate, b.dueDate);
      });
  });

  readonly unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  readonly overdueCount = computed(
    () => this.notifications().filter((n) => n.kind === 'overdue').length,
  );

  /** Días que lleva vencida una tarea; 0 si no está vencida. */
  daysLate(dueDate: string): number {
    return Math.max(0, -daysBetween(this.clock.today(), dueDate));
  }

  markAllRead(): void {
    const ids = this.notifications().map((n) => n.taskId);
    this.state.update((current) => ({ ...current, read: [...new Set([...current.read, ...ids])] }));
  }

  dismiss(taskId: string): void {
    const today = this.clock.today();
    this.state.update((current) => ({
      ...current,
      dismissed: { ...current.dismissed, [taskId]: today },
    }));
  }

  dismissAll(): void {
    const today = this.clock.today();
    const dismissed = { ...this.state().dismissed };

    for (const notification of this.notifications()) {
      dismissed[notification.taskId] = today;
    }

    this.state.update((current) => ({ ...current, dismissed }));
  }

  reset(): void {
    this.state.set(DEFAULT_STATE);
  }

  constructor() {
    effect(() => this.storage.write(STORAGE_KEYS.notifications, this.state()));
  }
}
