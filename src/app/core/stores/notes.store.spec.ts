import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { Note, NoteDraft } from '../models/note';
import { NotesStore } from './notes.store';

function draft(overrides: Partial<NoteDraft> = {}): NoteDraft {
  return {
    title: 'Apunte',
    body: 'Contenido',
    subjectId: null,
    tags: [],
    pinned: false,
    ...overrides,
  };
}

describe('NotesStore', () => {
  let store: NotesStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(NotesStore);
  });

  afterEach(() => localStorage.clear());

  /** Los singletons de root se cachean: hay que rehacer el inyector para releer el storage. */
  function reinject(): NotesStore {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(NotesStore);
  }

  it('adds notes with generated ids and timestamps', () => {
    const created = store.add(draft({ title: '  Límites  ' }));

    expect(created.id).toBeTruthy();
    expect(created.title).toBe('Límites');
    expect(created.createdAt).toBe(created.updatedAt);
    expect(store.count()).toBe(1);
  });

  it('normalizes tags: trim, lowercase and no duplicates', () => {
    const created = store.add(draft({ tags: [' Cálculo ', 'parcial', 'cálculo', '', '  '] }));

    expect(created.tags).toEqual(['cálculo', 'parcial']);
  });

  it('bumps updatedAt when editing', () => {
    const created = store.add(draft());
    store.update(created.id, draft({ title: 'Editado' }));

    const updated = store.byId().get(created.id) as Note;
    expect(updated.title).toBe('Editado');
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(updated.createdAt).getTime(),
    );
  });

  it('orders pinned notes first, then most recently updated', () => {
    store.replaceAll([
      {
        id: 'a',
        title: 'Viejo',
        body: '',
        subjectId: null,
        tags: [],
        pinned: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'b',
        title: 'Nuevo',
        body: '',
        subjectId: null,
        tags: [],
        pinned: false,
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
      {
        id: 'c',
        title: 'Fijado',
        body: '',
        subjectId: null,
        tags: [],
        pinned: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    expect(store.ordered().map((note) => note.title)).toEqual(['Fijado', 'Nuevo', 'Viejo']);
  });

  it('toggles the pin flag', () => {
    const created = store.add(draft());

    store.togglePin(created.id);
    expect(store.pinnedCount()).toBe(1);

    store.togglePin(created.id);
    expect(store.pinnedCount()).toBe(0);
  });

  it('searches by text in title and body, case-insensitively', () => {
    store.add(draft({ title: 'Integrales', body: 'Por partes' }));
    store.add(draft({ title: 'Derivadas', body: 'Regla de la cadena' }));

    const byTitle = store.search({ text: 'INTEGRALES', subjectId: undefined, tag: null });
    const byBody = store.search({ text: 'cadena', subjectId: undefined, tag: null });

    expect(byTitle).toHaveLength(1);
    expect(byBody).toHaveLength(1);
  });

  it('distinguishes "no subject filter" from "notes without a subject"', () => {
    store.add(draft({ title: 'Con materia', subjectId: 'mat' }));
    store.add(draft({ title: 'Sin materia', subjectId: null }));

    expect(store.search({ text: '', subjectId: undefined, tag: null })).toHaveLength(2);
    expect(store.search({ text: '', subjectId: null, tag: null }).map((n) => n.title)).toEqual([
      'Sin materia',
    ]);
  });

  it('filters by subject and tag at the same time', () => {
    store.add(draft({ title: 'A', subjectId: 'mat', tags: ['parcial'] }));
    store.add(draft({ title: 'B', subjectId: 'mat', tags: ['repaso'] }));
    store.add(draft({ title: 'C', subjectId: 'his', tags: ['parcial'] }));

    const results = store.search({ text: '', subjectId: 'mat', tag: 'parcial' });

    expect(results.map((note) => note.title)).toEqual(['A']);
  });

  it('collects every tag in alphabetical order', () => {
    store.add(draft({ tags: ['zeta', 'alfa'] }));
    store.add(draft({ tags: ['alfa', 'medio'] }));

    expect(store.allTags()).toEqual(['alfa', 'medio', 'zeta']);
  });

  it('detaches a deleted subject from its notes', () => {
    store.add(draft({ subjectId: 'mat' }));
    store.add(draft({ subjectId: null }));

    store.detachSubject('mat');

    expect(store.notes().every((note) => note.subjectId === null)).toBe(true);
    expect(store.count()).toBe(2);
  });

  it('removes notes and replaces the collection', () => {
    const first = store.add(draft({ title: 'Primera' }));
    store.add(draft({ title: 'Segunda' }));

    store.remove(first.id);
    expect(store.notes().map((note) => note.title)).toEqual(['Segunda']);

    store.replaceAll([]);
    expect(store.count()).toBe(0);
  });

  it('persists to localStorage', () => {
    store.add(draft({ title: 'Persistida' }));
    TestBed.inject(ApplicationRef).tick();

    const raw = localStorage.getItem('ss:notes');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toHaveLength(1);
  });

  it('ignores corrupted stored data', () => {
    localStorage.setItem(
      'ss:notes',
      JSON.stringify([{ id: 'x', title: 'sin cuerpo ni etiquetas' }]),
    );

    const fresh = reinject();

    expect(fresh.notes()).toEqual([]);
  });

  it('stores the body verbatim so indentation survives', () => {
    const original = draft({ body: '  primer renglón\n  segundo  ' });
    store.add(original);

    expect(store.notes()[0].body).toBe('  primer renglón\n  segundo  ');
  });
});
