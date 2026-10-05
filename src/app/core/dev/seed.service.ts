import { Injectable, computed, inject } from '@angular/core';

import { buildSeedData } from './seed-data';
import { NotesStore } from '../stores/notes.store';
import { NotificationsStore } from '../stores/notifications.store';
import { SubjectsStore } from '../stores/subjects.store';
import { TasksStore } from '../stores/tasks.store';

/**
 * Carga y borra datos de ejemplo.
 *
 * Escribe a través de los stores (no directo a `localStorage`) para que los
 * signals se actualicen sin recargar la página.
 */
@Injectable({ providedIn: 'root' })
export class SeedService {
  private readonly tasks = inject(TasksStore);
  private readonly notes = inject(NotesStore);
  private readonly subjects = inject(SubjectsStore);
  private readonly notifications = inject(NotificationsStore);

  readonly isEmpty = computed(
    () => this.tasks.totalCount() === 0 && this.notes.count() === 0 && this.subjects.count() === 0,
  );

  load(): void {
    const data = buildSeedData();

    this.subjects.replaceAll(data.subjects);
    this.tasks.replaceAll(data.tasks);
    this.notes.replaceAll(data.notes);
    this.notifications.reset();
  }

  clear(): void {
    this.subjects.replaceAll([]);
    this.tasks.replaceAll([]);
    this.notes.replaceAll([]);
    this.notifications.reset();
  }
}
