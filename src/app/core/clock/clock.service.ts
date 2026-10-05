import { DestroyRef, Injectable, inject, signal } from '@angular/core';

import { todayIso } from '../utils/date';

const CHECK_INTERVAL_MS = 60_000;

/**
 * Expone el día actual como signal.
 *
 * Los `computed` que dependen de "hoy" (vencidas, para hoy, notificaciones)
 * necesitan una dependencia reactiva real: llamar `todayIso()` dentro de un
 * computed no la registra, así que la app no se entera de que cambió el día
 * si la pestaña queda abierta de medianoche.
 */
@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly current = signal(todayIso());

  readonly today = this.current.asReadonly();

  constructor() {
    const timer = setInterval(() => this.refresh(), CHECK_INTERVAL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  private refresh(): void {
    const next = todayIso();
    if (next !== this.current()) {
      this.current.set(next);
    }
  }
}
