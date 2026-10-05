import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ClockService } from '../clock/clock.service';
import type { TaskDraft } from '../models/task';
import { addDays, todayIso } from '../utils/date';
import { NotificationsStore } from './notifications.store';
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

describe('NotificationsStore', () => {
  const today = todayIso();
  const day = signal(today);

  let store: NotificationsStore;
  let tasks: TasksStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: ClockService, useValue: { today: day.asReadonly() } }],
    });
    store = TestBed.inject(NotificationsStore);
    tasks = TestBed.inject(TasksStore);
    day.set(today);
  });

  afterEach(() => localStorage.clear());

  it('raises an overdue notification and one for today, ignoring the future', () => {
    tasks.add(draft({ title: 'Atrasada', dueDate: addDays(today, -3) }));
    tasks.add(draft({ title: 'Para hoy', dueDate: today }));
    tasks.add(draft({ title: 'Mañana', dueDate: addDays(today, 1) }));

    expect(store.notifications().map((n) => n.kind)).toEqual(['overdue', 'today']);
    expect(store.overdueCount()).toBe(1);
  });

  it('drops the notification once the task is completed', () => {
    const task = tasks.add(draft({ title: 'Atrasada', dueDate: addDays(today, -1) }));
    expect(store.notifications()).toHaveLength(1);

    tasks.toggle(task.id);

    expect(store.notifications()).toHaveLength(0);
  });

  it('follows the day when it changes', () => {
    tasks.add(draft({ title: 'Vence mañana', dueDate: addDays(today, 1) }));
    expect(store.notifications()).toHaveLength(0);

    day.set(addDays(today, 1));

    expect(store.notifications()).toHaveLength(1);
    expect(store.notifications()[0].kind).toBe('today');
  });

  it('counts how many days late a task is', () => {
    expect(store.daysLate(addDays(today, -4))).toBe(4);
    expect(store.daysLate(today)).toBe(0);
    expect(store.daysLate(addDays(today, 4))).toBe(0);
  });

  it('marks everything as read', () => {
    tasks.add(draft({ title: 'A', dueDate: addDays(today, -1) }));
    tasks.add(draft({ title: 'B', dueDate: today }));

    expect(store.unreadCount()).toBe(2);

    store.markAllRead();

    expect(store.unreadCount()).toBe(0);
    expect(store.notifications().every((n) => n.read)).toBe(true);
  });

  it('hides a dismissed task for the rest of the day', () => {
    const task = tasks.add(draft({ title: 'Atrasada', dueDate: addDays(today, -1) }));

    store.dismiss(task.id);

    expect(store.notifications()).toHaveLength(0);
  });

  it('brings a dismissed task back the next day if still pending', () => {
    const task = tasks.add(draft({ title: 'Atrasada', dueDate: addDays(today, -1) }));
    store.dismiss(task.id);
    expect(store.notifications()).toHaveLength(0);

    day.set(addDays(today, 1));

    expect(store.notifications()).toHaveLength(1);
    expect(store.notifications()[0].kind).toBe('overdue');
  });

  it('dismisses every visible notification at once', () => {
    tasks.add(draft({ title: 'A', dueDate: addDays(today, -1) }));
    tasks.add(draft({ title: 'B', dueDate: today }));

    store.dismissAll();

    expect(store.notifications()).toHaveLength(0);
  });

  it('reset clears read marks and dismissals', () => {
    const task = tasks.add(draft({ title: 'Atrasada', dueDate: addDays(today, -1) }));
    store.markAllRead();
    store.dismiss(task.id);
    store.reset();

    expect(store.notifications()).toHaveLength(1);
    expect(store.unreadCount()).toBe(1);
  });

  it('persists its state to localStorage', () => {
    tasks.add(draft({ title: 'Atrasada', dueDate: addDays(today, -1) }));
    store.markAllRead();
    TestBed.inject(ApplicationRef).tick();

    const raw = localStorage.getItem('ss:notifications');
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)['read']).toHaveLength(1);
  });

  it('ignores corrupted stored data', () => {
    localStorage.setItem('ss:notifications', JSON.stringify({ read: 'no array' }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: ClockService, useValue: { today: day.asReadonly() } }],
    });

    const fresh = TestBed.inject(NotificationsStore);

    expect(fresh.unreadCount()).toBe(0);
  });
});
