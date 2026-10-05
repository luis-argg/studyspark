import { TestBed } from '@angular/core/testing';

import { NotesStore } from '../stores/notes.store';
import { SubjectsStore } from '../stores/subjects.store';
import { TasksStore } from '../stores/tasks.store';
import { todayIso } from '../utils/date';
import { DEFAULT_SUBJECTS } from './default-subjects';
import { SeedService } from './seed.service';

describe('SeedService', () => {
  let seed: SeedService;
  let tasks: TasksStore;
  let notes: NotesStore;
  let subjects: SubjectsStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    seed = TestBed.inject(SeedService);
    tasks = TestBed.inject(TasksStore);
    notes = TestBed.inject(NotesStore);
    subjects = TestBed.inject(SubjectsStore);
  });

  afterEach(() => localStorage.clear());

  it('reports empty state before loading', () => {
    expect(seed.isEmpty()).toBe(true);
  });

  it('loads subjects, tasks and notes', () => {
    seed.load();

    expect(seed.isEmpty()).toBe(false);
    expect(subjects.count()).toBeGreaterThan(0);
    expect(tasks.totalCount()).toBeGreaterThan(0);
    expect(notes.count()).toBeGreaterThan(0);
  });

  it('keeps the basic subjects instead of swapping them for a demo set', () => {
    seed.load();

    expect(subjects.subjects()).toEqual(DEFAULT_SUBJECTS);
  });

  /** Las materias básicas no cuentan como datos: el arranque sigue "vacío". */
  it('reports empty state even though the basic subjects are seeded', () => {
    expect(subjects.count()).toBe(DEFAULT_SUBJECTS.length);
    expect(seed.isEmpty()).toBe(true);
  });

  it('only links tasks and notes to existing subjects', () => {
    seed.load();

    const ids = new Set(subjects.subjects().map((subject) => subject.id));

    expect(tasks.tasks().every((task) => task.subjectId === null || ids.has(task.subjectId))).toBe(
      true,
    );
    expect(notes.notes().every((note) => note.subjectId === null || ids.has(note.subjectId))).toBe(
      true,
    );
  });

  it('builds valid dates relative to today', () => {
    seed.load();

    expect(tasks.tasks().every((task) => /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate))).toBe(true);
    expect(tasks.tasks().some((task) => task.dueDate <= todayIso())).toBe(true);
  });

  it('is idempotent', () => {
    seed.load();
    const first = tasks.totalCount();

    seed.load();

    expect(tasks.totalCount()).toBe(first);
    expect(subjects.count()).toBe(DEFAULT_SUBJECTS.length);
  });

  it('replaces whatever was there before', () => {
    tasks.add({
      title: 'Mía',
      subjectId: null,
      dueDate: todayIso(),
      priority: 'low',
    });

    seed.load();

    expect(tasks.tasks().some((task) => task.title === 'Mía')).toBe(false);
  });

  it('clear empties every collection', () => {
    seed.load();

    seed.clear();

    expect(seed.isEmpty()).toBe(true);
    expect(tasks.totalCount()).toBe(0);
    expect(notes.count()).toBe(0);
    expect(subjects.count()).toBe(0);
  });

  it('clears notification state so warnings appear again', () => {
    seed.load();
    seed.clear();
    seed.load();

    expect(seed.isEmpty()).toBe(false);
  });
});
