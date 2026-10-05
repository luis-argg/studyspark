import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ClockService } from '../../core/clock/clock.service';
import { NotificationsStore } from '../../core/stores/notifications.store';
import { ThemeService } from '../../core/theme/theme.service';
import { formatLongDate, parseIsoDate } from '../../core/utils/date';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly notifications = inject(NotificationsStore);
  private readonly theme = inject(ThemeService);
  private readonly clock = inject(ClockService);

  /** Avisa al shell para abrir el menú lateral en móvil. */
  readonly menuToggle = output<void>();

  /** Depende de `clock.today` para que la fecha cambie al pasar medianoche. */
  protected readonly todayLabel = computed(() => formatLongDate(parseIsoDate(this.clock.today())));
  protected readonly unreadCount = this.notifications.unreadCount;
  protected readonly isDark = computed(() => this.theme.isDark());

  protected toggleTheme(): void {
    this.theme.toggle();
  }
}
