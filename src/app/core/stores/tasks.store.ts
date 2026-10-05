import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { ClockService } from '../clock/clock.service';
import type { Task, TaskDraft } from '../models/task';
import { STORAGE_KEYS } from '../models/storage-key';
import { isTask } from '../storage/entity-guards';
import { StorageService } from '../storage/storage.service';
import { compareIso } from '../utils/date';
import { createId } from '../utils/id';

@Injectable({ providedIn: 'root' })
export class TasksStore {
  private readonly storage = inject(StorageService);
  private readonly clock = inject(ClockService);

  private readonly state = signal<Task[]>(this.storage.read(STORAGE_KEYS.tasks, [], isTask));

  readonly tasks = this.state.asReadonly();

  readonly pending = computed(() =>
    this.state()
      .filter((task) => task.status === 'pending')
      .sort((a, b) => compareIso(a.dueDate, b.dueDate)),
  );

  readonly completed = computed(() =>
    this.state()
      .filter((task) => task.status === 'done')
      .sort((a, b) => compareIso(b.dueDate, a.dueDate)),
  );

  readonly overdue = computed(() => {
    const today = this.clock.today();
    return this.pending().filter((task) => compareIso(task.dueDate, today) < 0);
  });

  readonly dueToday = computed(() => {
    const today = this.clock.today();
    return this.pending().filter((task) => task.dueDate === today);
  });

  readonly totalCount = computed(() => this.state().length);
  readonly pendingCount = computed(() => this.pending().length);
  readonly overdueCount = computed(() => this.overdue().length);
  readonly completedCount = computed(() => this.completed().length);

  readonly byId = computed(() => new Map(this.state().map((task) => [task.id, task])));

  constructor() {
    effect(() => this.storage.write(STORAGE_KEYS.tasks, this.state()));
  }

  add(draft: TaskDraft): Task {
    const task: Task = {
      id: createId(),
      title: draft.title.trim(),
      subjectId: draft.subjectId,
      dueDate: draft.dueDate,
      priority: draft.priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    this.state.update((tasks) => [...tasks, task]);
    return task;
  }

  update(id: string, draft: TaskDraft): void {
    this.state.update((tasks) =>
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              title: draft.title.trim(),
              subjectId: draft.subjectId,
              dueDate: draft.dueDate,
              priority: draft.priority,
            }
          : task,
      ),
    );
  }

  toggle(id: string): void {
    this.state.update((tasks) =>
      tasks.map((task) => {
        if (task.id !== id) {
          return task;
        }
        const done = task.status === 'done';
        return {
          ...task,
          status: done ? 'pending' : 'done',
          completedAt: done ? null : new Date().toISOString(),
        };
      }),
    );
  }

  remove(id: string): void {
    this.state.update((tasks) => tasks.filter((task) => task.id !== id));
  }

  removeCompleted(): void {
    this.state.update((tasks) => tasks.filter((task) => task.status !== 'done'));
  }

  /** Deja sin materia las tareas que apuntan a una materia que se está borrando. */
  detachSubject(subjectId: string): void {
    this.state.update((tasks) =>
      tasks.map((task) => (task.subjectId === subjectId ? { ...task, subjectId: null } : task)),
    );
  }

  replaceAll(tasks: Task[]): void {
    this.state.set(tasks);
  }

  tasksForDate(date: string): Task[] {
    return this.state()
      .filter((task) => task.dueDate === date)
      .sort((a, b) => compareIso(a.dueDate, b.dueDate));
  }
}
