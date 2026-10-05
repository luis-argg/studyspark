import { Injectable, computed, effect, inject, signal } from '@angular/core';

import type { Note, NoteDraft } from '../models/note';
import { STORAGE_KEYS } from '../models/storage-key';
import { isNote } from '../storage/entity-guards';
import { StorageService } from '../storage/storage.service';
import { createId } from '../utils/id';

export interface NoteQuery {
  readonly text: string;
  /**
   * `undefined` no filtra por materia; `null` filtra por los apuntes **sin**
   * materia. La distinción importa porque "Sin materia" es un filtro real, no
   * la ausencia de uno.
   */
  readonly subjectId: string | null | undefined;
  readonly tag: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotesStore {
  private readonly storage = inject(StorageService);

  private readonly state = signal<Note[]>(this.storage.read(STORAGE_KEYS.notes, [], isNote));

  readonly notes = this.state.asReadonly();

  readonly ordered = computed(() =>
    [...this.state()].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    }),
  );

  readonly count = computed(() => this.state().length);
  readonly pinnedCount = computed(() => this.state().filter((note) => note.pinned).length);

  readonly allTags = computed(() => {
    const tags = new Set<string>();
    for (const note of this.state()) {
      for (const tag of note.tags) {
        tags.add(tag);
      }
    }
    return [...tags].sort((a, b) => a.localeCompare(b, 'es'));
  });

  readonly byId = computed(() => new Map(this.state().map((note) => [note.id, note])));

  constructor() {
    effect(() => this.storage.write(STORAGE_KEYS.notes, this.state()));
  }

  search(query: NoteQuery): Note[] {
    const needle = query.text.trim().toLowerCase();

    return this.ordered().filter((note) => {
      if (query.subjectId !== undefined && note.subjectId !== query.subjectId) {
        return false;
      }
      if (query.tag !== null && !note.tags.includes(query.tag)) {
        return false;
      }
      if (needle && !`${note.title} ${note.body}`.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
  }

  add(draft: NoteDraft): Note {
    const now = new Date().toISOString();
    const note: Note = {
      id: createId(),
      title: draft.title.trim(),
      body: draft.body,
      subjectId: draft.subjectId,
      tags: normalizeTags(draft.tags),
      pinned: draft.pinned,
      createdAt: now,
      updatedAt: now,
    };

    this.state.update((notes) => [...notes, note]);
    return note;
  }

  update(id: string, draft: NoteDraft): void {
    this.state.update((notes) =>
      notes.map((note) =>
        note.id === id
          ? {
              ...note,
              title: draft.title.trim(),
              body: draft.body,
              subjectId: draft.subjectId,
              tags: normalizeTags(draft.tags),
              pinned: draft.pinned,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    );
  }

  togglePin(id: string): void {
    this.state.update((notes) =>
      notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note)),
    );
  }

  remove(id: string): void {
    this.state.update((notes) => notes.filter((note) => note.id !== id));
  }

  /** Deja sin materia los apuntes que apuntan a una materia que se está borrando. */
  detachSubject(subjectId: string): void {
    this.state.update((notes) =>
      notes.map((note) => (note.subjectId === subjectId ? { ...note, subjectId: null } : note)),
    );
  }

  replaceAll(notes: Note[]): void {
    this.state.set(notes);
  }
}

function normalizeTags(tags: readonly string[]): string[] {
  const cleaned = tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);

  return [...new Set(cleaned)];
}
