import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { Subject, SubjectDraft } from '../../core/models/subject';

const PALETTE = [
  '#4f46e5',
  '#0369a1',
  '#15803d',
  '#b45309',
  '#b91c1c',
  '#7c3aed',
  '#0f766e',
  '#be185d',
  '#57534e',
  '#1d4ed8',
] as const;

@Component({
  selector: 'app-subject-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './subject-form.html',
})
export class SubjectForm {
  private readonly fb = inject(FormBuilder);

  readonly open = model(false);
  readonly subject = input<Subject | null>(null);

  readonly closed = output<void>();
  readonly saved = output<SubjectDraft>();

  protected readonly palette: readonly string[] = PALETTE;
  protected readonly selectedColor = signal<string>(PALETTE[0]);

  /** Índice del color activo, para el roving tabindex del radiogroup. */
  protected readonly selectedColorIndex = computed(() => {
    const index = this.palette.indexOf(this.selectedColor());
    return index === -1 ? 0 : index;
  });

  private readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(40)]],
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

  protected pickColor(color: string): void {
    this.selectedColor.set(color);
  }

  /** Flechas y Home/End para moverse entre los swatches (patrón radiogroup). */
  protected onColorKey(event: KeyboardEvent, index: number): void {
    const total = this.palette.length;
    let next: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % total;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index - 1 + total) % total;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = total - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.pickColor(this.palette[next]);

    const swatches = (
      event.currentTarget as HTMLElement
    ).parentElement?.querySelectorAll<HTMLElement>('[role="radio"]');
    swatches?.[next]?.focus();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saved.emit({ name: this.form.getRawValue().name, color: this.selectedColor() });
  }

  protected get hasNameError(): boolean {
    const name = this.form.controls.name;
    return name.invalid && (name.touched || name.dirty);
  }

  private sync(): void {
    const subject = this.subject();
    this.form.reset({ name: subject?.name ?? '' });
    this.selectedColor.set(subject?.color ?? PALETTE[0]);
  }
}
