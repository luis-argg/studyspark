export type NotificationKind = 'overdue' | 'today';

export interface AppNotification {
  /** Estable a partir del id de la tarea, para no duplicar avisos entre recargas. */
  id: string;
  kind: NotificationKind;
  taskId: string;
  taskTitle: string;
  dueDate: string;
  createdAt: string;
  read: boolean;
}
