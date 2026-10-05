import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { ClockService } from '../../core/clock/clock.service';
import type { Note, NoteDraft } from '../../core/models/note';
import { NotesStore } from '../../core/stores/notes.store';
import { SubjectsStore } from '../../core/stores/subjects.store';
import { formatRelativeDate, toIsoDate } from '../../core/utils/date';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { NoteForm } from './note-form';

/**
 * Valores centinela del `<select>` de materia.
 *
 * El option de "Sin materia" no puede llevar `[value]="null"`: el DOM
 * coerciona `null` al string `"null"` y el filtro compararía contra un
 * `subjectId` que ya no es `null`. Los ids de materia son UUID, así que
 * ningún valor centinela colisiona con uno real.
 */
const ALL_SUBJECTS = '';
const NO_SUBJECT = 'none';

@Component({
  selector: 'app-notes-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialog, EmptyState, NoteForm],
  templateUrl: './notes-page.html',
  styleUrl: './notes-page.css',
})
export class NotesPage {
  protected readonly notesStore = inject(NotesStore);
  protected readonly subjectsStore = inject(SubjectsStore);
  private readonly clock = inject(ClockService);

  protected readonly text = signal('');
  protected readonly subjectValue = signal<string>(ALL_SUBJECTS);
  protected readonly tag = signal<string | null>(null);

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Note | null>(null);
  protected readonly expanded = signal<string | null>(null);

  protected readonly confirmOpen = signal(false);
  protected readonly pendingDelete = signal<Note | null>(null);

  protected readonly allSubjectsValue = ALL_SUBJECTS;
  protected readonly noSubjectValue = NO_SUBJECT;

  protected readonly tags = this.notesStore.allTags;
  protected readonly subjects = this.subjectsStore.options;

  /**
   * El id real que se filtra. Los dos centinelas se distinguen a propósito:
   * `undefined` es "todas" y `null` es "solo las que no tienen materia", que es
   * un filtro real y no la ausencia de filtro.
   */
  protected readonly subjectId = computed<string | null | undefined>(() => {
    const value = this.subjectValue();
    return value === ALL_SUBJECTS ? undefined : value === NO_SUBJECT ? null : value;
  });

  protected readonly results = computed(() =>
    this.notesStore.search({
      text: this.text(),
      subjectId: this.subjectId(),
      tag: this.tag(),
    }),
  );

  protected readonly isEmpty = computed(() => this.notesStore.count() === 0);
  protected readonly hasFilters = computed(
    () => this.text().trim() !== '' || this.subjectValue() !== ALL_SUBJECTS || this.tag() !== null,
  );

  protected onText(event: Event): void {
    this.text.set((event.target as HTMLInputElement).value);
  }

  protected onSubject(event: Event): void {
    this.subjectValue.set((event.target as HTMLSelectElement).value);
  }

  protected onTag(value: string): void {
    this.tag.set(this.tag() === value ? null : value);
  }

  protected clearFilters(): void {
    this.text.set('');
    this.subjectValue.set(ALL_SUBJECTS);
    this.tag.set(null);
  }

  protected isExpanded(noteId: string): boolean {
    return this.expanded() === noteId;
  }

  protected toggleExpanded(noteId: string): void {
    this.expanded.set(this.expanded() === noteId ? null : noteId);
  }

  protected excerpt(body: string): string {
    const flat = body.replace(/\s+/g, ' ').trim();
    return flat.length > 140 ? `${flat.slice(0, 140)}…` : flat;
  }

  /**
   * `updatedAt` es un instante UTC en ISO, pero la etiqueta compara contra la
   * fecha local: se reconvierte con `toIsoDate` para no correr un día en zonas
   * con offset negativo.
   */
  protected updatedLabel(note: Note): string {
    return formatRelativeDate(toIsoDate(new Date(note.updatedAt)), this.clock.today());
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(note: Note): void {
    this.editing.set(note);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected save(draft: NoteDraft): void {
    const current = this.editing();

    if (current) {
      this.notesStore.update(current.id, draft);
    } else {
      this.notesStore.add(draft);
    }

    this.closeForm();
  }

  protected remove(note: Note): void {
    this.pendingDelete.set(note);
    this.confirmOpen.set(true);
  }

  protected closeConfirm(): void {
    this.confirmOpen.set(false);
    this.pendingDelete.set(null);
  }

  protected confirmDelete(): void {
    const note = this.pendingDelete();
    this.closeConfirm();

    if (!note) {
      return;
    }

    this.notesStore.remove(note.id);

    if (this.expanded() === note.id) {
      this.expanded.set(null);
    }
  }

  protected confirmMessage(): string {
    const note = this.pendingDelete();
    return note ? `Se eliminará el apunte «${note.title}». Esta acción no se puede deshacer.` : '';
  }

  protected togglePin(note: Note): void {
    this.notesStore.togglePin(note.id);
  }
}
