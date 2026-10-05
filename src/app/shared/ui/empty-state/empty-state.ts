import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Estado vacío reutilizable: icono, mensaje y una acción opcional proyectada. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <div class="empty-state-icon" aria-hidden="true">{{ icon() }}</div>
      <p class="empty-state-title">{{ title() }}</p>
      @if (text()) {
        <p class="empty-state-text">{{ text() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EmptyState {
  readonly icon = input('·');
  readonly title = input.required<string>();
  readonly text = input<string>('');
}
