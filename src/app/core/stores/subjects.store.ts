import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { createDefaultSubjects } from '../dev/default-subjects';
import type { Subject, SubjectDraft } from '../models/subject';
import { STORAGE_KEYS } from '../models/storage-key';
import { isSubject } from '../storage/entity-guards';
import { StorageService } from '../storage/storage.service';
import { createId } from '../utils/id';

export const NO_SUBJECT_LABEL = 'Sin materia';

const NO_SUBJECT_COLOR = 'var(--text-subtle)';

export interface SubjectOption {
  readonly id: string | null;
  readonly name: string;
  readonly color: string;
}

@Injectable({ providedIn: 'root' })
export class SubjectsStore {
  private readonly storage = inject(StorageService);

  private readonly state = signal<Subject[]>(this.initialSubjects());

  /**
   * En el primer arranque no hay nada guardado, así que se siembran las materias
   * básicas. Una clave existente gana siempre, incluso si vale `[]`: si la
   * persona borró todas, no deben reaparecer solas en la siguiente visita.
   */
  private initialSubjects(): Subject[] {
    return this.storage.has(STORAGE_KEYS.subjects)
      ? this.storage.read<Subject[]>(STORAGE_KEYS.subjects, [], isSubject)
      : createDefaultSubjects();
  }

  readonly subjects = this.state.asReadonly();

  readonly count = computed(() => this.state().length);

  constructor() {
    effect(() => this.storage.write(STORAGE_KEYS.subjects, this.state()));
  }

  readonly options = computed<SubjectOption[]>(() =>
    [{ id: null, name: NO_SUBJECT_LABEL, color: NO_SUBJECT_COLOR }, ...this.state()].sort((a, b) =>
      a.name.localeCompare(b.name, 'es'),
    ),
  );

  private readonly index = computed(() => new Map(this.state().map((s) => [s.id, s])));

  nameOf(subjectId: string | null): string {
    if (subjectId === null) {
      return NO_SUBJECT_LABEL;
    }
    return this.index().get(subjectId)?.name ?? NO_SUBJECT_LABEL;
  }

  colorOf(subjectId: string | null): string {
    if (subjectId === null) {
      return NO_SUBJECT_COLOR;
    }
    return this.index().get(subjectId)?.color ?? NO_SUBJECT_COLOR;
  }

  exists(subjectId: string | null): boolean {
    return subjectId !== null && this.index().has(subjectId);
  }

  add(draft: SubjectDraft): Subject {
    const subject: Subject = { id: createId(), name: draft.name.trim(), color: draft.color };
    this.state.update((subjects) => [...subjects, subject]);
    return subject;
  }

  update(id: string, draft: SubjectDraft): void {
    this.state.update((subjects) =>
      subjects.map((subject) =>
        subject.id === id ? { ...subject, name: draft.name.trim(), color: draft.color } : subject,
      ),
    );
  }

  replaceAll(subjects: Subject[]): void {
    this.state.set(subjects);
  }

  /** Borra la materia. Quien la llame debe desasignarla de tareas y apuntes. */
  remove(id: string): void {
    this.state.update((subjects) => subjects.filter((subject) => subject.id !== id));
  }
}
