import type { Note } from '../models/note';
import type { Subject } from '../models/subject';
import type { Task } from '../models/task';
import {
  isArrayOf,
  isBoolean,
  isNullableString,
  isOneOf,
  isRecord,
  isString,
  isStringArray,
} from './guards';

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export const TASK_STATUSES = ['pending', 'done'] as const;

export const isTask = isArrayOf(
  (value): value is Task =>
    isRecord(value) &&
    isString(value['id']) &&
    isString(value['title']) &&
    isNullableString(value['subjectId']) &&
    isString(value['dueDate']) &&
    isOneOf(TASK_PRIORITIES)(value['priority']) &&
    isOneOf(TASK_STATUSES)(value['status']) &&
    isString(value['createdAt']) &&
    isNullableString(value['completedAt']),
);

export const isSubject = isArrayOf(
  (value): value is Subject =>
    isRecord(value) && isString(value['id']) && isString(value['name']) && isString(value['color']),
);

export const isNote = isArrayOf(
  (value): value is Note =>
    isRecord(value) &&
    isString(value['id']) &&
    isString(value['title']) &&
    isString(value['body']) &&
    isNullableString(value['subjectId']) &&
    isStringArray(value['tags']) &&
    isBoolean(value['pinned']) &&
    isString(value['createdAt']) &&
    isString(value['updatedAt']),
);

/** Deja sin materia lo que apunta a una materia que no vino en el archivo. */
export function reconcileSubjectIds(
  tasks: readonly Task[],
  notes: readonly Note[],
  subjects: readonly Subject[],
): { tasks: Task[]; notes: Note[] } {
  const valid = new Set(subjects.map((subject) => subject.id));

  const detach = (subjectId: string | null): string | null =>
    subjectId !== null && !valid.has(subjectId) ? null : subjectId;

  return {
    tasks: tasks.map((task) => ({ ...task, subjectId: detach(task.subjectId) })),
    notes: notes.map((note) => ({ ...note, subjectId: detach(note.subjectId) })),
  };
}
