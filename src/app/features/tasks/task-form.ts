import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { SubjectOption } from '../../core/stores/subjects.store';
import type { Task, TaskDraft, TaskPriority } from '../../core/models/task';
import { todayIso } from '../../core/utils/date';

interface TaskFormValue {
  title: string;
  subjectId: string | null;
  dueDate: string;
  priority: TaskPriority;
}

@Component({
  selector: 'app-task-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
})
export class TaskForm {
  private readonly fb = inject(FormBuilder);

  readonly open = model(false);

  /** `null` = modo creación; con id, modo edición. */
  readonly task = input<Task | null>(null);

  readonly subjects = input<readonly SubjectOption[]>([]);

  readonly closed = output<void>();
  readonly saved = output<TaskDraft>();
  readonly deleted = output<string>();

  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly priorities: ReadonlyArray<{ value: TaskPriority; label: string }> = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    subjectId: this.fb.control<string | null>(null),
    dueDate: [todayIso(), Validators.required],
    priority: this.fb.nonNullable.control<TaskPriority>('medium'),
  });

  constructor() {
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      const isOpen = this.open();

      if (!dialog) {
        return;
      }

      if (isOpen && !dialog.open) {
        this.syncForm();
        dialog.showModal();
      } else if (!isOpen && dialog.open) {
        dialog.close();
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue() as TaskFormValue;
    this.saved.emit({
      title: value.title,
      subjectId: value.subjectId,
      dueDate: value.dueDate,
      priority: value.priority,
    });
  }

  protected cancel(): void {
    this.closed.emit();
  }

  protected remove(): void {
    const task = this.task();
    if (task) {
      this.deleted.emit(task.id);
    }
  }

  protected invalid(control: keyof TaskFormValue): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.touched || field.dirty);
  }

  protected get hasTitleError(): boolean {
    return this.invalid('title');
  }

  protected get hasDueDateError(): boolean {
    return this.invalid('dueDate');
  }

  private syncForm(): void {
    const task = this.task();

    this.form.reset(
      task
        ? {
            title: task.title,
            subjectId: task.subjectId,
            dueDate: task.dueDate,
            priority: task.priority,
          }
        : {
            title: '',
            subjectId: null,
            dueDate: todayIso(),
            priority: 'medium' as TaskPriority,
          },
    );
  }
}
