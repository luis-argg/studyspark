import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DEFAULT_SUBJECTS } from '../dev/default-subjects';
import { STORAGE_KEYS } from '../models/storage-key';
import type { Subject, SubjectDraft } from '../models/subject';
import { NO_SUBJECT_LABEL, SubjectsStore } from './subjects.store';

function draft(overrides: Partial<SubjectDraft> = {}): SubjectDraft {
  return { name: 'Materia', color: '#4f46e5', ...overrides };
}

describe('SubjectsStore', () => {
  let store: SubjectsStore;

  beforeEach(() => {
    localStorage.clear();
    // Sin esta clave la app siembra las materias básicas en el primer arranque,
    // que es justo lo que ensaya un describe aparte más abajo. El resto de tests
    // parten de "no hay materias".
    localStorage.setItem(STORAGE_KEYS.subjects, '[]');
    TestBed.configureTestingModule({});
    store = TestBed.inject(SubjectsStore);
  });

  afterEach(() => localStorage.clear());

  function reinject(): SubjectsStore {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(SubjectsStore);
  }

  it('adds subjects trimmed with a generated id', () => {
    const created = store.add(draft({ name: '  Historia  ' }));

    expect(created.id).toBeTruthy();
    expect(created.name).toBe('Historia');
    expect(store.count()).toBe(1);
  });

  it('offers "Sin materia" alongside every subject', () => {
    store.add(draft({ name: 'Zoom' }));
    store.add(draft({ name: 'Álgebra' }));

    const names = store.options().map((option) => option.name);

    expect(names).toContain(NO_SUBJECT_LABEL);
    expect(names).toContain('Zoom');
    expect(names).toContain('Álgebra');
    expect(store.options()).toHaveLength(3);
  });

  it('resolves names and colors, falling back when unknown', () => {
    const created = store.add(draft({ name: 'Física', color: '#b45309' }));

    expect(store.nameOf(created.id)).toBe('Física');
    expect(store.colorOf(created.id)).toBe('#b45309');
    expect(store.nameOf(null)).toBe(NO_SUBJECT_LABEL);
    expect(store.nameOf('fantasma')).toBe(NO_SUBJECT_LABEL);
  });

  it('reports whether a subject exists', () => {
    const created = store.add(draft());

    expect(store.exists(created.id)).toBe(true);
    expect(store.exists(null)).toBe(false);
    expect(store.exists('fantasma')).toBe(false);
  });

  it('renames a subject', () => {
    const created = store.add(draft({ name: 'Antes' }));

    store.update(created.id, draft({ name: 'Después', color: '#15803d' }));

    expect(store.subjects()[0].name).toBe('Después');
    expect(store.colorOf(created.id)).toBe('#15803d');
  });

  it('removes and replaces the collection', () => {
    const first = store.add(draft({ name: 'Primera' }));
    store.add(draft({ name: 'Segunda' }));

    store.remove(first.id);
    expect(store.subjects().map((s) => s.name)).toEqual(['Segunda']);

    store.replaceAll([]);
    expect(store.count()).toBe(0);
  });

  it('persists to localStorage', () => {
    store.add(draft({ name: 'Persistida' }));
    TestBed.inject(ApplicationRef).tick();

    const raw = localStorage.getItem(STORAGE_KEYS.subjects);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toHaveLength(1);
  });

  it('reads valid stored data on construction', () => {
    const valid: Subject = { id: 's1', name: 'De antes', color: '#0369a1' };
    localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify([valid]));

    const fresh = reinject();

    expect(fresh.subjects()).toEqual([valid]);
  });

  it('discards the whole list when a single entry is corrupt', () => {
    const valid: Subject = { id: 's1', name: 'De antes', color: '#0369a1' };
    localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify([valid, { roto: true }]));

    const fresh = reinject();

    expect(fresh.subjects()).toEqual([]);
  });

  describe('primer arranque', () => {
    it('seeds the basic subjects when nothing was ever stored', () => {
      localStorage.removeItem(STORAGE_KEYS.subjects);

      const fresh = reinject();

      expect(fresh.subjects()).toEqual(DEFAULT_SUBJECTS);
      expect(fresh.subjects().map((s) => s.name)).toContain('Física Fundamental');
      expect(fresh.subjects().map((s) => s.name)).toContain('Computación');
    });

    it('gives every basic subject a unique id and a distinct colour', () => {
      localStorage.removeItem(STORAGE_KEYS.subjects);

      const fresh = reinject();
      const fresh2 = reinject();

      // Sin este guardia las aserciones de unicidad pasarían en vacío.
      expect(fresh.subjects()).toHaveLength(DEFAULT_SUBJECTS.length);

      const ids = fresh.subjects().map((s) => s.id);
      const colors = fresh.subjects().map((s) => s.color);

      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(colors).size).toBe(colors.length);
      // Id estable: otra instancia debe seguir apuntando a las mismas materias.
      expect(fresh2.subjects()).toEqual(DEFAULT_SUBJECTS);
    });

    it('does not bring them back once the user empties the list', () => {
      store.replaceAll([]);
      TestBed.inject(ApplicationRef).tick();

      expect(reinject().count()).toBe(0);
    });

    it('respects a list the user trimmed down', () => {
      const kept: Subject = { id: 's-mat', name: 'Matemáticas', color: '#4f46e5' };
      localStorage.setItem(STORAGE_KEYS.subjects, JSON.stringify([kept]));

      expect(reinject().subjects()).toEqual([kept]);
    });
  });
});
