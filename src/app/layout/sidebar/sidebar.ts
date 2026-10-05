import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { NotificationsStore } from '../../core/stores/notifications.store';
import { NOTIFICATIONS_PATH, NAV_SECTIONS } from './nav.config';

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  host: {
    '[class.sidebar-open]': 'open()',
  },
})
export class Sidebar {
  private readonly notifications = inject(NotificationsStore);

  /** Lo controla el shell; en móvil el sidebar se desliza con este flag. */
  readonly open = input(false);

  /** Se emite al navegar, para que el shell cierre el menú en pantallas chicas. */
  readonly closed = output<void>();

  protected readonly sections = NAV_SECTIONS;
  protected readonly notificationsPath = NOTIFICATIONS_PATH;
  protected readonly unreadCount = this.notifications.unreadCount;
}
