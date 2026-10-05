import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import type { Task, TaskDraft } from '../models/task';
import { addDays, todayIso } from '../utils/date';
import { TasksStore } from './tasks.store';

function draft(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
    title: 'Tarea',
    subjectId: null,
    dueDate: todayIso(),
    priority: 'medium',
    ...overrides,
  };
}

describe('TasksStore', () => {
  const today = todayIso();
  let store: TasksStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(TasksStore);
  });

  afterEach(() => localStorage.clear());

  /** Los singletons de root se cachean: hay que rehacer el inyector para releer el storage. */
  function reinject(): TasksStore {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(TasksStore);
  }

  it('adds tasks trimmed and always pending', () => {
    const created = store.add(draft({ title: '  Repasar apuntes  ' }));

    expect(created.title).toBe('Repasar apuntes');
    expect(created.status).toBe('pending');
    expect(created.completedAt).toBeNull();
    expect(store.totalCount()).toBe(1);
  });

  it('separates pending from completed', () => {
    const first = store.add(draft({ title: 'A' }));
    store.add(draft({ title: 'B' }));
    store.toggle(first.id);

    expect(store.pendingCount()).toBe(1);
    expect(store.completedCount()).toBe(1);
  });

  it('counts overdue and due today relative to the current day', () => {
    store.add(draft({ title: 'Atrasada', dueDate: addDays(today, -2) }));
    store.add(draft({ title: 'Hoy', dueDate: today }));
    store.add(draft({ title: 'Mañana', dueDate: addDays(today, 1) }));

    expect(store.overdueCount()).toBe(1);
    expect(store.dueToday().map((task) => task.title)).toEqual(['Hoy']);
  });

  it('does not count completed tasks as overdue', () => {
    const task = store.add(draft({ title: 'Atrasada', dueDate: addDays(today, -5) }));
    store.toggle(task.id);

    expect(store.overdueCount()).toBe(0);
  });

  it('toggles status and stamps completedAt', () => {
    const task = store.add(draft());

    store.toggle(task.id);
    expect(store.tasks()[0].status).toBe('done');
    expect(store.tasks()[0].completedAt).not.toBeNull();

    store.toggle(task.id);
    expect(store.tasks()[0].status).toBe('pending');
    expect(store.tasks()[0].completedAt).toBeNull();
  });

  it('updates fields without resetting the status', () => {
    const task = store.add(draft({ title: 'Original' }));
    store.toggle(task.id);
    store.update(task.id, draft({ title: 'Editada', priority: 'high' }));

    const updated = store.tasks()[0];
    expect(updated.title).toBe('Editada');
    expect(updated.priority).toBe('high');
    expect(updated.status).toBe('done');
  });

  it('removes one task and bulk-removes completed ones', () => {
    const keep = store.add(draft({ title: 'Pendiente' }));
    const drop = store.add(draft({ title: 'Hecha' }));
    store.toggle(drop.id);

    store.remove(drop.id);
    expect(store.tasks().map((task) => task.id)).toEqual([keep.id]);

    store.toggle(keep.id);
    store.removeCompleted();
    expect(store.totalCount()).toBe(0);
  });

  it('detaches a deleted subject from its tasks', () => {
    store.add(draft({ subjectId: 'mat' }));
    store.add(draft({ subjectId: null }));

    store.detachSubject('mat');

    expect(store.tasks().every((task) => task.subjectId === null)).toBe(true);
    expect(store.totalCount()).toBe(2);
  });

  it('groups tasks by due date', () => {
    store.add(draft({ title: 'Otra', dueDate: addDays(today, 3) }));
    store.add(draft({ title: 'Hoy A' }));
    store.add(draft({ title: 'Hoy B' }));

    expect(store.tasksForDate(today).map((task) => task.title)).toEqual(['Hoy A', 'Hoy B']);
  });

  it('replaceAll swaps the whole collection', () => {
    store.add(draft());
    const incoming: Task[] = [
      {
        id: 'x',
        title: 'Importada',
        subjectId: null,
        dueDate: today,
        priority: 'low',
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null,
      },
    ];

    store.replaceAll(incoming);

    expect(store.tasks()).toEqual(incoming);
  });

  it('persists to localStorage', () => {
    store.add(draft({ title: 'Persistida' }));
    TestBed.inject(ApplicationRef).tick();

    const raw = localStorage.getItem('ss:tasks');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toHaveLength(1);
  });

  it('reads existing data on construction', () => {
    localStorage.setItem(
      'ss:tasks',
      JSON.stringify([
        {
          id: 'old',
          title: 'De antes',
          subjectId: null,
          dueDate: today,
          priority: 'high',
          status: 'pending',
          createdAt: '2026-01-01T00:00:00.000Z',
          completedAt: null,
        },
      ]),
    );

    const fresh = reinject();

    expect(fresh.tasks().map((task) => task.title)).toEqual(['De antes']);
  });

  it('ignores corrupted stored data', () => {
    localStorage.setItem('ss:tasks', JSON.stringify([{ nope: true }]));

    const fresh = reinject();

    expect(fresh.tasks()).toEqual([]);
  });
});
