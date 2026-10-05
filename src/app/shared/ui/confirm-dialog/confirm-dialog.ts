import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

/**
 * Confirmación para acciones destructivas, sobre `<dialog>` nativo (foco
 * atrapado, `Esc` y `::backdrop` sin código extra). Reemplaza a `confirm()`,
 * que no se puede estilar y bloquea el hilo.
 *
 * Igual que en `TaskForm`, el `open` es un `model()` y un `effect` sincroniza
 * el diálogo: el componente nunca llama a `showModal()` desde un click.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="dialog confirm"
      [class.confirm-danger]="tone() === 'danger'"
      (close)="closed.emit()"
      (cancel)="$event.preventDefault(); closed.emit()"
    >
      <div class="dialog-panel">
        <header class="dialog-header">
          <h2 class="dialog-title">{{ title() }}</h2>
          <p class="dialog-text">{{ message() }}</p>
        </header>

        <footer class="dialog-footer">
          <button type="button" class="btn btn-secondary" autofocus (click)="cancel()">
            {{ cancelLabel() }}
          </button>
          <button type="button" [class]="confirmClass()" (click)="confirm()">
            {{ confirmLabel() }}
          </button>
        </footer>
      </div>
    </dialog>
  `,
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  readonly open = model(false);

  readonly title = input.required<string>();
  readonly message = input('');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');

  /** `danger` pinta el botón de confirmación en rojo. */
  readonly tone = input<'danger' | 'primary'>('primary');

  readonly confirmed = output<void>();
  readonly closed = output<void>();

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialogRef().nativeElement;
      const isOpen = this.open();

      if (isOpen && !dialog.open) {
        dialog.showModal();
      } else if (!isOpen && dialog.open) {
        dialog.close();
      }
    });
  }

  protected confirmClass(): string {
    return this.tone() === 'danger' ? 'btn btn-danger' : 'btn btn-primary';
  }

  protected confirm(): void {
    // `confirmed` va primero: el padre lee su payload en ese manejador, y
    // `closed` lo limpia después.
    this.confirmed.emit();
    this.closed.emit();
  }

  protected cancel(): void {
    this.closed.emit();
  }
}
