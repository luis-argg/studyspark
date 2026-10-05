import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ClockService } from '../../core/clock/clock.service';
import type { Task, TaskDraft, TaskPriority, TaskStatus } from '../../core/models/task';
import { SubjectsStore } from '../../core/stores/subjects.store';
import { TasksStore } from '../../core/stores/tasks.store';
import { compareIso, daysBetween, formatRelativeDate } from '../../core/utils/date';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { TaskForm } from './task-form';

type StatusFilter = 'all' | TaskStatus;
type PriorityFilter = 'all' | TaskPriority;

@Component({
  selector: 'app-tasks-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, RouterLink, TaskForm],
  templateUrl: './tasks-page.html',
  styleUrl: './tasks-page.css',
})
export class TasksPage {
  protected readonly tasksStore = inject(TasksStore);
  protected readonly subjectsStore = inject(SubjectsStore);
  private readonly clock = inject(ClockService);

  protected readonly statusFilter = signal<StatusFilter>('pending');
  protected readonly priorityFilter = signal<PriorityFilter>('all');
  protected readonly subjectFilter = signal<string>('all');
  protected readonly search = signal('');

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Task | null>(null);

  protected readonly subjects = this.subjectsStore.options;
  protected readonly hasNoSubjects = computed(() => this.subjectsStore.count() === 0);
  protected readonly isEmpty = computed(() => this.tasksStore.totalCount() === 0);

  protected readonly visible = computed(() => {
    const status = this.statusFilter();
    const priority = this.priorityFilter();
    const subject = this.subjectFilter();
    const needle = this.search().trim().toLowerCase();

    return this.tasksStore.tasks().filter((task) => {
      if (status !== 'all' && task.status !== status) {
        return false;
      }
      if (priority !== 'all' && task.priority !== priority) {
        return false;
      }
      if (subject !== 'all' && task.subjectId !== (subject === 'none' ? null : subject)) {
        return false;
      }
      if (needle && !task.title.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
  });

  protected readonly filteredCount = computed(() => this.visible().length);

  protected readonly statuses: ReadonlyArray<{ value: StatusFilter; label: string }> = [
    { value: 'pending', label: 'Pendientes' },
    { value: 'done', label: 'Completadas' },
    { value: 'all', label: 'Todas' },
  ];

  protected readonly priorities: ReadonlyArray<{ value: PriorityFilter; label: string }> = [
    { value: 'all', label: 'Cualquier prioridad' },
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Media' },
    { value: 'low', label: 'Baja' },
  ];

  protected readonly priorityLabels: Readonly<Record<TaskPriority, string>> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  };

  protected openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(task: Task): void {
    this.editing.set(task);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected save(draft: TaskDraft): void {
    const current = this.editing();

    if (current) {
      this.tasksStore.update(current.id, draft);
    } else {
      this.tasksStore.add(draft);
    }

    this.closeForm();
  }

  protected remove(id: string): void {
    this.tasksStore.remove(id);
    this.closeForm();
  }

  protected toggle(task: Task): void {
    this.tasksStore.toggle(task.id);
  }

  protected clearCompleted(): void {
    this.tasksStore.removeCompleted();
  }

  protected setStatus(value: StatusFilter): void {
    this.statusFilter.set(value);
  }

  protected setPriority(value: PriorityFilter): void {
    this.priorityFilter.set(value);
  }

  protected setSubject(value: string): void {
    this.subjectFilter.set(value);
  }

  protected resetFilters(): void {
    this.statusFilter.set('all');
    this.priorityFilter.set('all');
    this.subjectFilter.set('all');
    this.search.set('');
  }

  protected hasActiveFilters(): boolean {
    return (
      this.statusFilter() !== 'pending' ||
      this.priorityFilter() !== 'all' ||
      this.subjectFilter() !== 'all' ||
      this.search().trim().length > 0
    );
  }

  protected dueLabel(dueDate: string): string {
    return formatRelativeDate(dueDate, this.clock.today());
  }

  protected isOverdue(task: Task): boolean {
    return task.status === 'pending' && daysBetween(this.clock.today(), task.dueDate) < 0;
  }

  protected isDueToday(task: Task): boolean {
    return task.status === 'pending' && compareIso(task.dueDate, this.clock.today()) === 0;
  }

  protected subjectName(subjectId: string | null): string {
    return this.subjectsStore.nameOf(subjectId);
  }

  protected subjectColor(subjectId: string | null): string {
    return this.subjectsStore.colorOf(subjectId);
  }
}
