import { TestBed } from '@angular/core/testing';

import { BackupService } from './backup.service';
import type { Note } from '../models/note';
import type { Subject } from '../models/subject';
import type { Task } from '../models/task';
import { NotesStore } from '../stores/notes.store';
import { SubjectsStore } from '../stores/subjects.store';
import { TasksStore } from '../stores/tasks.store';
import { addDays, todayIso } from '../utils/date';

const NOW = new Date().toISOString();

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Tarea',
    subjectId: null,
    dueDate: todayIso(),
    priority: 'medium',
    status: 'pending',
    createdAt: NOW,
    completedAt: null,
    ...overrides,
  };
}

function note(overrides: Partial<Note> = {}): Note {
  return {
    id: 'n1',
    title: 'Apunte',
    body: 'Contenido',
    subjectId: null,
    tags: [],
    pinned: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function subject(overrides: Partial<Subject> = {}): Subject {
  return { id: 's1', name: 'Matemáticas', color: '#4f46e5', ...overrides };
}

function file(data: Record<string, unknown>): string {
  return JSON.stringify({ app: 'study-spark', version: 1, exportedAt: NOW, ...data });
}

describe('BackupService', () => {
  let backup: BackupService;
  let tasks: TasksStore;
  let notes: NotesStore;
  let subjects: SubjectsStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    backup = TestBed.inject(BackupService);
    tasks = TestBed.inject(TasksStore);
    notes = TestBed.inject(NotesStore);
    subjects = TestBed.inject(SubjectsStore);
  });

  afterEach(() => localStorage.clear());

  it('rejects text that is not JSON', () => {
    const result = backup.import('esto no es json');

    expect(result.ok).toBe(false);
  });

  it('rejects files from another app', () => {
    const result = backup.import(
      JSON.stringify({ app: 'otra-cosa', tasks: [], notes: [], subjects: [] }),
    );

    expect(result).toEqual({ ok: false, reason: 'El archivo no fue exportado desde StudySpark.' });
  });

  it('rejects malformed collections', () => {
    const result = backup.import(file({ tasks: [{ nope: true }], notes: [], subjects: [] }));

    expect(result.ok).toBe(false);
  });

  it('rejects an unknown subject reference but keeps the rest', () => {
    const result = backup.import(
      file({
        tasks: [task({ subjectId: 'fantasma' })],
        notes: [note()],
        subjects: [],
      }),
    );

    expect(result.ok).toBe(true);
    expect(tasks.tasks()[0].subjectId).toBeNull();
  });

  it('restores a full backup', () => {
    const result = backup.import(
      file({
        tasks: [
          task({ id: 't1' }),
          task({ id: 't2', title: 'Otra', dueDate: addDays(todayIso(), 2) }),
        ],
        notes: [note({ id: 'n1' }), note({ id: 'n2', title: 'Otro apunte' })],
        subjects: [subject({ id: 's1' })],
      }),
    );

    expect(result).toEqual({
      ok: true,
      counts: { tasks: 2, notes: 2, subjects: 1 },
    });
    expect(subjects.nameOf('s1')).toBe('Matemáticas');
    expect(notes.count()).toBe(2);
  });

  it('keeps valid subject links and only nulls the dangling ones', () => {
    backup.import(
      file({
        tasks: [task({ id: 't1', subjectId: 's1' }), task({ id: 't2', subjectId: 'fantasma' })],
        notes: [note({ subjectId: 'fantasma' })],
        subjects: [subject({ id: 's1' })],
      }),
    );

    expect(tasks.tasks().map((t) => t.subjectId)).toEqual(['s1', null]);
    expect(notes.notes()[0].subjectId).toBeNull();
  });

  it('replaces the current content instead of merging', () => {
    tasks.add({ title: 'Antes', subjectId: null, dueDate: todayIso(), priority: 'low' });

    backup.import(file({ tasks: [task({ id: 'nuevo' })], notes: [], subjects: [] }));

    expect(tasks.totalCount()).toBe(1);
    expect(tasks.tasks()[0].id).toBe('nuevo');
  });

  it('leaves storage untouched when the file is invalid', () => {
    tasks.add({ title: 'Antes', subjectId: null, dueDate: todayIso(), priority: 'low' });

    const result = backup.import(file({ tasks: 'no soy una lista', notes: [], subjects: [] }));

    expect(result.ok).toBe(false);
    expect(tasks.totalCount()).toBe(1);
  });

  it('round-trips data exported by the same service', () => {
    backup.import(
      file({
        tasks: [task({ id: 't1', subjectId: 's1' })],
        notes: [note({ id: 'n1', subjectId: 's1', tags: ['parcial'] })],
        subjects: [subject({ id: 's1' })],
      }),
    );

    const snapshot = {
      tasks: tasks.tasks(),
      notes: notes.notes(),
      subjects: subjects.subjects(),
    };

    tasks.replaceAll([]);
    notes.replaceAll([]);
    subjects.replaceAll([]);

    const result = backup.import(file(snapshot));

    expect(result.ok).toBe(true);
    expect(tasks.tasks()).toEqual(snapshot.tasks);
    expect(notes.notes()).toEqual(snapshot.notes);
    expect(subjects.subjects()).toEqual(snapshot.subjects);
  });
});
