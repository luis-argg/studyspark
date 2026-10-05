import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tareas' },
      {
        path: 'tareas',
        title: 'Tareas · StudySpark',
        loadComponent: () => import('./features/tasks/tasks-page').then((m) => m.TasksPage),
      },
      {
        path: 'apuntes',
        title: 'Apuntes · StudySpark',
        loadComponent: () => import('./features/notes/notes-page').then((m) => m.NotesPage),
      },
      {
        path: 'calendario',
        title: 'Calendario · StudySpark',
        loadComponent: () =>
          import('./features/calendar/calendar-page').then((m) => m.CalendarPage),
      },
      {
        path: 'notificaciones',
        title: 'Notificaciones · StudySpark',
        loadComponent: () =>
          import('./features/notifications/notifications-page').then((m) => m.NotificationsPage),
      },
      {
        path: 'ajustes',
        title: 'Ajustes · StudySpark',
        loadComponent: () =>
          import('./features/settings/settings-page').then((m) => m.SettingsPage),
      },
      { path: '**', redirectTo: 'tareas' },
    ],
  },
];
