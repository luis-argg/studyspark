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

import type { Note, NoteDraft } from '../../core/models/note';
import type { SubjectOption } from '../../core/stores/subjects.store';

@Component({
  selector: 'app-note-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './note-form.html',
  styleUrl: './note-form.css',
})
export class NoteForm {
  private readonly fb = inject(FormBuilder);

  readonly open = model(false);
  readonly note = input<Note | null>(null);
  readonly subjects = input<readonly SubjectOption[]>([]);

  readonly closed = output<void>();
  readonly saved = output<NoteDraft>();

  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    subjectId: this.fb.control<string | null>(null),
    body: ['', Validators.required],
    tags: [''],
    pinned: [false],
  });

  constructor() {
    effect(() => {
      const dialog = this.dialogRef()?.nativeElement;
      const isOpen = this.open();

      if (!dialog) {
        return;
      }

      if (isOpen && !dialog.open) {
        this.sync();
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

    const value = this.form.getRawValue();

    this.saved.emit({
      title: value.title,
      body: value.body.trim(),
      subjectId: value.subjectId,
      tags: value.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      pinned: value.pinned,
    });
  }

  protected get hasTitleError(): boolean {
    const title = this.form.controls.title;
    return title.invalid && (title.touched || title.dirty);
  }

  protected get hasBodyError(): boolean {
    const body = this.form.controls.body;
    return body.invalid && (body.touched || body.dirty);
  }

  private sync(): void {
    const note = this.note();

    this.form.reset({
      title: note?.title ?? '',
      subjectId: note?.subjectId ?? null,
      body: note?.body ?? '',
      tags: note?.tags.join(', ') ?? '',
      pinned: note?.pinned ?? false,
    });
  }
}
