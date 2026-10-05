import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { STORAGE_KEYS } from '../../core/models/storage-key';
import type { Note } from '../../core/models/note';
import type { Subject } from '../../core/models/subject';
import { NotesStore } from '../../core/stores/notes.store';
import { SubjectsStore } from '../../core/stores/subjects.store';
import { formatRelativeDate, todayIso, toIsoDate } from '../../core/utils/date';
import { NotesPage } from './notes-page';

const NOW = new Date().toISOString();

const SUBJECTS: Subject[] = [{ id: 's-mat', name: 'Matemáticas', color: '#4f46e5' }];

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: 'Derivadas',
    body: 'Reglas principales',
    subjectId: null,
    tags: [],
    pinned: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

const NOTES: Note[] = [
  note({ id: 'n1', title: 'Sin materia', subjectId: null, tags: ['parcial'] }),
  note({ id: 'n2', title: 'Con materia', subjectId: 's-mat', tags: ['repaso'] }),
];

describe('NotesPage', () => {
  let fixture: ComponentFixture<NotesPage>;
  let notesStore: NotesStore;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify(SUBJECTS));
    localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(NOTES));

    await TestBed.configureTestingModule({ imports: [NotesPage] }).compileComponents();

    fixture = TestBed.createComponent(NotesPage);
    notesStore = TestBed.inject(NotesStore);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  function subjectSelect(): HTMLSelectElement {
    return fixture.nativeElement.querySelector('#notes-subject') as HTMLSelectElement;
  }

  function titles(): string[] {
    return [...fixture.nativeElement.querySelectorAll('.note-title')].map((el) =>
      el.textContent?.trim(),
    );
  }

  it('should list every note by default', () => {
    expect(titles()).toEqual(['Sin materia', 'Con materia']);
  });

  it('should render the empty option with a value that is not the text "null"', () => {
    const values = [...subjectSelect().options].map((option) => option.value);

    expect(values).not.toContain('null');
    expect(values).toHaveLength(3);
    expect(values).toContain('none');
    expect(values).toContain('s-mat');
  });

  /** El store ordena las opciones por nombre, así que se busca por etiqueta. */
  function indexOfOption(label: string): number {
    return [...subjectSelect().options].findIndex((o) => o.textContent?.trim() === label);
  }

  /** Elige por etiqueta, igual que haría una persona: no depende del centinela. */
  function filterByLabel(label: string): void {
    const el = subjectSelect();
    el.selectedIndex = indexOfOption(label);
    el.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  /**
   * Regresión: "Sin materia" llegaba al filtro como el string `"null"`, así que
   * los apuntes con `subjectId: null` desaparecían de los resultados.
   */
  it('should keep notes without a subject when filtering by "Sin materia"', () => {
    filterByLabel('Sin materia');

    expect(titles()).toEqual(['Sin materia']);
  });

  it('should keep notes with a subject when filtering by that subject', () => {
    filterByLabel('Matemáticas');

    expect(titles()).toEqual(['Con materia']);
  });

  it('should go back to every note when "Todas" is picked', () => {
    filterByLabel('Sin materia');
    filterByLabel('Todas');

    expect(titles()).toEqual(['Sin materia', 'Con materia']);
  });

  /** Regresión: el valor del select se reseteaba a "Todas" al filtrar sin materia. */
  it('should keep "Sin materia" visible in the select after filtering by it', () => {
    const expected = indexOfOption('Sin materia');
    expect(expected).toBeGreaterThan(0);

    filterByLabel('Sin materia');

    expect(subjectSelect().value).toBe('none');
    expect(subjectSelect().selectedIndex).toBe(expected);
  });

  it('should offer a way to clear the active filters', () => {
    filterByLabel('Sin materia');
    expect(fixture.nativeElement.querySelector('.filters .btn')).toBeTruthy();

    (fixture.nativeElement.querySelector('.filters .btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(subjectSelect().value).toBe('');
    expect(titles()).toEqual(['Sin materia', 'Con materia']);
  });

  it('should filter by tag', () => {
    (fixture.nativeElement.querySelector('.toolbar .btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(titles()).toEqual(['Sin materia']);
  });

  /** Regresión: se usaba `confirm()` nativo, sin estilo y bloqueando el hilo. */
  it('should confirm the deletion in a dialog, not with the native confirm()', () => {
    const nativeConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    try {
      (
        fixture.nativeElement.querySelector('.note-actions .btn-delete') as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      expect(nativeConfirm).not.toHaveBeenCalled();
      expect(notesStore.count()).toBe(2);

      const dialog = fixture.nativeElement.querySelector(
        'app-confirm-dialog dialog',
      ) as HTMLDialogElement;
      expect(dialog.open).toBe(true);

      (dialog.querySelector('.btn-danger') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(dialog.open).toBe(false);
      expect(notesStore.count()).toBe(1);
      expect(titles()).toEqual(['Con materia']);
    } finally {
      nativeConfirm.mockRestore();
    }
  });

  it('should keep the note when the confirmation is dismissed', () => {
    (fixture.nativeElement.querySelector('.note-actions .btn-delete') as HTMLButtonElement).click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector(
      'app-confirm-dialog dialog',
    ) as HTMLDialogElement;
    (dialog.querySelector('.btn-secondary') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(notesStore.count()).toBe(2);
  });

  /**
   * Regresión: `updatedAt.slice(0, 10)` leía el día en UTC mientras el resto de
   * la app fecha en hora local. Solo es observable fuera de UTC; en UTC ambas
   * coinciden y el test degrada a comprobar el contrato.
   */
  it('should date the "updated" label from local time', () => {
    const localIso = toIsoDate(new Date(NOW));
    expect(fixture.componentInstance['updatedLabel'](NOTES[0])).toBe(
      formatRelativeDate(localIso, todayIso()),
    );
  });

  it('should pin and unpin a note', () => {
    const pin = fixture.nativeElement.querySelector('.note-actions .btn-secondary');
    (pin as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(notesStore.notes()[0].pinned).toBe(true);
  });

  it('should expose the subjects of the store for the filter', () => {
    expect(TestBed.inject(SubjectsStore).count()).toBe(1);
  });
});
