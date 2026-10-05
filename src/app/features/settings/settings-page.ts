import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { BackupService } from '../../core/backup/backup.service';
import { SeedService } from '../../core/dev/seed.service';
import type { Subject, SubjectDraft } from '../../core/models/subject';
import { NotesStore } from '../../core/stores/notes.store';
import { SubjectsStore } from '../../core/stores/subjects.store';
import { TasksStore } from '../../core/stores/tasks.store';
import { ThemeService, THEME_OPTIONS, type ThemePreference } from '../../core/theme/theme.service';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { SubjectForm } from './subject-form';

/** Qué acción espera confirmación. El diálogo es único, el payload decide. */
type PendingAction =
  | { readonly kind: 'clear' }
  | { readonly kind: 'seed' }
  | { readonly kind: 'subject'; readonly subject: Subject };

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialog, EmptyState, SubjectForm],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  protected readonly subjectsStore = inject(SubjectsStore);
  protected readonly tasksStore = inject(TasksStore);
  protected readonly notesStore = inject(NotesStore);
  protected readonly theme = inject(ThemeService);
  private readonly backup = inject(BackupService);
  private readonly seed = inject(SeedService);

  protected readonly themeOptions = THEME_OPTIONS;

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Subject | null>(null);

  protected readonly message = signal<string | null>(null);

  protected readonly confirmOpen = signal(false);
  protected readonly pending = signal<PendingAction | null>(null);

  protected readonly stats = computed(() => ({
    subjects: this.subjectsStore.count(),
    tasks: this.tasksStore.totalCount(),
    notes: this.notesStore.count(),
  }));

  /** Índice de la opción de tema activa, para el roving tabindex del radiogroup. */
  protected readonly selectedThemeIndex = computed(() => {
    const current = this.theme.current();
    const index = THEME_OPTIONS.findIndex((option) => option.value === current);

    // Si el valor no está en la lista, se cae al primero: nunca deja al grupo
    // entero con tabindex="-1", que lo haría inalcanzable por teclado.
    return index === -1 ? 0 : index;
  });

  protected readonly isEmpty = this.seed.isEmpty;

  /** Textos del diálogo, derivados de la acción pendiente. */
  protected readonly confirmTitle = computed(() => {
    const pending = this.pending();

    switch (pending?.kind) {
      case 'clear':
        return '¿Borrar todo?';
      case 'seed':
        return '¿Cargar datos de ejemplo?';
      case 'subject':
        return `¿Eliminar «${pending.subject.name}»?`;
      default:
        return '';
    }
  });

  protected readonly confirmMessage = computed(() => {
    const pending = this.pending();

    switch (pending?.kind) {
      case 'clear':
        return `Se eliminarán ${this.stats().tasks} tareas, ${this.stats().notes} apuntes y ${this.stats().subjects} materias. Esta acción no se puede deshacer.`;
      case 'seed':
        return 'Se reemplazarán todas las tareas, apuntes y materias actuales por un conjunto de ejemplo.';
      case 'subject': {
        const used = this.usageOf(pending.subject.id);

        return used > 0
          ? `Se quitará de ${used} tarea${used === 1 ? '' : 's'} y apuntes, que quedarán sin materia.`
          : 'No tiene tareas ni apuntes asociados.';
      }
      default:
        return '';
    }
  });

  protected readonly confirmLabel = computed(() => {
    switch (this.pending()?.kind) {
      case 'clear':
        return 'Sí, borrar todo';
      case 'seed':
        return 'Sí, reemplazar';
      case 'subject':
        return 'Eliminar materia';
      default:
        return 'Confirmar';
    }
  });

  protected usageOf(subjectId: string): number {
    return (
      this.tasksStore.tasks().filter((task) => task.subjectId === subjectId).length +
      this.notesStore.notes().filter((note) => note.subjectId === subjectId).length
    );
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(subject: Subject): void {
    this.editing.set(subject);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected save(draft: SubjectDraft): void {
    const current = this.editing();

    if (current) {
      this.subjectsStore.update(current.id, draft);
    } else {
      this.subjectsStore.add(draft);
    }

    this.closeForm();
  }

  /** Al borrar una materia sus tareas y apuntes quedan sin asignar. */
  protected remove(subject: Subject): void {
    this.askConfirm({ kind: 'subject', subject });
  }

  protected setTheme(value: ThemePreference): void {
    this.theme.set(value);
  }

  /** Flechas y Home/End para moverse entre las opciones (patrón radiogroup). */
  protected onThemeKey(event: KeyboardEvent, index: number): void {
    const total = this.themeOptions.length;
    let next: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % total;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index - 1 + total) % total;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = total - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.setTheme(this.themeOptions[next].value);

    const radios = (
      event.currentTarget as HTMLElement
    ).parentElement?.querySelectorAll<HTMLElement>('[role="radio"]');
    radios?.[next]?.focus();
  }

  protected loadSeed(): void {
    if (this.isEmpty()) {
      this.applySeed();
      return;
    }

    this.askConfirm({ kind: 'seed' });
  }

  protected askClear(): void {
    this.askConfirm({ kind: 'clear' });
  }

  protected askConfirm(pending: PendingAction): void {
    this.pending.set(pending);
    this.confirmOpen.set(true);
  }

  protected closeConfirm(): void {
    this.confirmOpen.set(false);
    this.pending.set(null);
  }

  protected confirmAction(): void {
    const pending = this.pending();
    this.closeConfirm();

    switch (pending?.kind) {
      case 'clear':
        this.clearAll();
        break;
      case 'seed':
        this.applySeed();
        break;
      case 'subject':
        this.deleteSubject(pending.subject);
        break;
    }
  }

  private applySeed(): void {
    this.seed.load();
    this.message.set('Datos de ejemplo cargados.');
  }

  private deleteSubject(subject: Subject): void {
    this.tasksStore.detachSubject(subject.id);
    this.notesStore.detachSubject(subject.id);
    this.subjectsStore.remove(subject.id);
    this.message.set(`Materia «${subject.name}» eliminada.`);
  }

  private clearAll(): void {
    this.seed.clear();
    this.message.set('Todo vacío. Ya puedes empezar de cero.');
  }

  protected exportBackup(): void {
    this.backup.export();
    this.message.set('Respaldo descargado.');
  }

  protected async importBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    const result = this.backup.import(await file.text());

    this.message.set(
      result.ok
        ? `Restaurado: ${result.counts.tasks} tareas, ${result.counts.notes} apuntes y ${result.counts.subjects} materias.`
        : `No se pudo importar: ${result.reason}`,
    );
  }
}
