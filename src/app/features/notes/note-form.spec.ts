import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import type { NoteDraft } from '../../core/models/note';
import type { SubjectOption } from '../../core/stores/subjects.store';
import { NoteForm } from './note-form';

const OPTIONS: readonly SubjectOption[] = [
  { id: null, name: 'Sin materia', color: 'var(--text-subtle)' },
  { id: 's-mat', name: 'Matemáticas', color: '#4f46e5' },
];

describe('NoteForm', () => {
  let fixture: ComponentFixture<NoteForm>;
  let emitted: NoteDraft | null;

  beforeEach(async () => {
    localStorage.clear();
    emitted = null;

    await TestBed.configureTestingModule({ imports: [NoteForm] }).compileComponents();

    fixture = TestBed.createComponent(NoteForm);
    fixture.componentInstance['saved'].subscribe((draft: NoteDraft) => (emitted = draft));
  });

  afterEach(() => localStorage.clear());

  function open(): void {
    fixture.componentRef.setInput('subjects', OPTIONS);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  }

  function subjectSelect(): HTMLSelectElement {
    return fixture.nativeElement.querySelector('#note-subject') as HTMLSelectElement;
  }

  function choose(value: string): void {
    const el = subjectSelect();
    el.value = value;
    el.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function submit(): void {
    const form = fixture.componentInstance['form'];
    form.controls['title'].setValue('Derivadas');
    form.controls['body'].setValue('Contenido');
    fixture.componentInstance['submit']();
    fixture.detectChanges();
  }

  /** Regresión: `[value]` coerciona `null` al string `"null"`. */
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

  it('should split, trim and drop empty tags', () => {
    open();
    const form = fixture.componentInstance['form'];
    form.controls['title'].setValue('Derivadas');
    form.controls['body'].setValue('Contenido');
    form.controls['tags'].setValue(' cálculo , , parcial ');
    fixture.componentInstance['submit']();

    expect(emitted!.tags).toEqual(['cálculo', 'parcial']);
  });

  it('should not emit while the form is invalid', () => {
    open();
    fixture.componentInstance['form'].controls['title'].setValue('');
    fixture.componentInstance['submit']();

    expect(emitted).toBeNull();
  });
});
