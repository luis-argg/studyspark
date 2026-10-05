import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import type { TaskDraft } from '../../core/models/task';
import type { SubjectOption } from '../../core/stores/subjects.store';
import { TaskForm } from './task-form';

const OPTIONS: readonly SubjectOption[] = [
  { id: null, name: 'Sin materia', color: 'var(--text-subtle)' },
  { id: 's-mat', name: 'Matemáticas', color: '#4f46e5' },
  { id: 's-fis', name: 'Física', color: '#15803d' },
];

/** Dos materias con el mismo nombre: el `track` no puede depender del texto. */
const DUPLICATED_OPTIONS: readonly SubjectOption[] = [
  { id: null, name: 'Sin materia', color: 'var(--text-subtle)' },
  { id: 's-1', name: 'Matemáticas', color: '#4f46e5' },
  { id: 's-2', name: 'Matemáticas', color: '#15803d' },
];

describe('TaskForm', () => {
  let fixture: ComponentFixture<TaskForm>;
  let emitted: TaskDraft | null;

  beforeEach(async () => {
    localStorage.clear();
    emitted = null;

    await TestBed.configureTestingModule({ imports: [TaskForm] }).compileComponents();

    fixture = TestBed.createComponent(TaskForm);
    fixture.componentInstance['saved'].subscribe((draft: TaskDraft) => (emitted = draft));
  });

  afterEach(() => localStorage.clear());

  function open(subjects: readonly SubjectOption[] = OPTIONS): void {
    fixture.componentRef.setInput('subjects', subjects);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  }

  function subjectSelect(): HTMLSelectElement {
    return fixture.nativeElement.querySelector('#task-subject') as HTMLSelectElement;
  }

  function choose(value: string): void {
    const el = subjectSelect();
    el.value = value;
    el.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function submit(): void {
    fixture.componentInstance['form'].controls['title'].setValue('Ensayo');
    fixture.componentInstance['submit']();
    fixture.detectChanges();
  }

  it('should render one option per subject plus the empty one', () => {
    open();

    const options = [...subjectSelect().options].map((option) => option.textContent?.trim());

    expect(options).toEqual(['Sin materia', 'Matemáticas', 'Física']);
  });

  /**
   * Regresión: con `[value]` el DOM coerciona `null` al string `"null"` y el
   * form guardaba ese texto en vez de un `null` de verdad.
   */
  it('should never expose a literal "null" as an option value', () => {
    open();

    const values = [...subjectSelect().options].map((option) => option.value);

    expect(values).not.toContain('null');
  });

  it('should store a real null when "Sin materia" is picked', () => {
    open();
    choose(subjectSelect().options[0].value);
    submit();

    expect(emitted).not.toBeNull();
    expect(emitted!.subjectId).toBeNull();
  });

  it('should store the subject id when a subject is picked', () => {
    open();
    choose(subjectSelect().options[1].value);
    submit();

    expect(emitted!.subjectId).toBe('s-mat');
  });

  it('should keep the empty option selected while it is the current value', () => {
    open();

    const el = subjectSelect();

    expect(el.selectedIndex).toBe(0);
    expect(el.value).toBe(el.options[0].value);
  });

  it('should load the values of the task being edited', () => {
    fixture.componentRef.setInput('task', {
      id: 't1',
      title: 'Ensayo',
      subjectId: 's-fis',
      dueDate: '2026-01-10',
      priority: 'high',
      status: 'pending',
      createdAt: '2026-01-01T00:00:00.000Z',
      completedAt: null,
    });
    open();

    expect(subjectSelect().value).toBe(subjectSelect().options[2].value);
    expect(fixture.componentInstance['form'].controls['title'].value).toBe('Ensayo');
  });

  /**
   * Regresión: `track option.name` producía claves duplicadas con dos materias
   * homónimas (NG0955 en desarrollo y reconciliación defectuosa en producción).
   */
  it('should render subjects that share a name without duplicate track keys', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      open(DUPLICATED_OPTIONS);

      const options = [...subjectSelect().options];
      expect(options).toHaveLength(3);
      expect([...options].map((option) => option.textContent?.trim())).toEqual([
        'Sin materia',
        'Matemáticas',
        'Matemáticas',
      ]);

      const duplicated = warn.mock.calls.filter((call) =>
        String(call[0]).includes('duplicated keys'),
      );
      expect(duplicated).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });

  it('should close the native dialog when it is dismissed', () => {
    open();

    expect(fixture.nativeElement.querySelector('dialog').open).toBe(true);

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
  });
});
