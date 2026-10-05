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

  /**
   * Si no hay nada que cargar. Las materias no cuentan: son taxonomía y siempre
   * hay, así que en el primer arranque la app ya trae las 15 básicas pero sigue
   * siendo "vacía" y `loadSeed()` puede saltarse la confirmación.
   */
  readonly isEmpty = computed(() => this.tasks.totalCount() === 0 && this.notes.count() === 0);

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
