import { Injectable, inject } from '@angular/core';

import { APP_VERSION, type BackupFile } from '../models/storage-key';
import { isNote, isSubject, isTask, reconcileSubjectIds } from '../storage/entity-guards';
import { isRecord } from '../storage/guards';
import { NotesStore } from '../stores/notes.store';
import { SubjectsStore } from '../stores/subjects.store';
import { TasksStore } from '../stores/tasks.store';

export type ImportResult =
  | { readonly ok: true; readonly counts: { tasks: number; notes: number; subjects: number } }
  | { readonly ok: false; readonly reason: string };

const FILE_NAME = 'study-spark-respaldo.json';

@Injectable({ providedIn: 'root' })
export class BackupService {
  private readonly tasks = inject(TasksStore);
  private readonly notes = inject(NotesStore);
  private readonly subjects = inject(SubjectsStore);

  /** Descarga un JSON con todo el contenido de la app. */
  export(): void {
    const payload: BackupFile = {
      app: 'study-spark',
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      tasks: this.tasks.tasks(),
      notes: this.notes.notes(),
      subjects: this.subjects.subjects(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = FILE_NAME;
    document.body.append(link);
    link.click();
    link.remove();

    // El revoke va en el siguiente tick: hacerlo en el mismo puede cancelar la
    // descarga antes de que el navegador la haya iniciado.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  /**
   * Valida la forma del archivo antes de escribir. Si algo no cuadra no se
   * toca el almacenamiento, para no dejar la app a medias.
   */
  import(raw: string): ImportResult {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ok: false, reason: 'El archivo no es un JSON válido.' };
    }

    if (!isRecord(parsed)) {
      return { ok: false, reason: 'El archivo no tiene la estructura esperada.' };
    }

    if (parsed['app'] !== 'study-spark') {
      return { ok: false, reason: 'El archivo no fue exportado desde StudySpark.' };
    }

    const { tasks, notes, subjects } = parsed;

    if (!isTask(tasks)) {
      return { ok: false, reason: 'La lista de tareas no es válida.' };
    }
    if (!isSubject(subjects)) {
      return { ok: false, reason: 'La lista de materias no es válida.' };
    }
    if (!isNote(notes)) {
      return { ok: false, reason: 'La lista de apuntes no es válida.' };
    }

    const clean = reconcileSubjectIds(tasks, notes, subjects);

    this.subjects.replaceAll(subjects);
    this.tasks.replaceAll(clean.tasks);
    this.notes.replaceAll(clean.notes);

    return {
      ok: true,
      counts: { tasks: clean.tasks.length, notes: clean.notes.length, subjects: subjects.length },
    };
  }
}
