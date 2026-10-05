export interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
}

export interface NavSection {
  readonly heading: string;
  readonly items: readonly NavItem[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    heading: 'Estudio',
    items: [
      { path: '/tareas', label: 'Tareas', icon: '✓', description: 'Pendientes y entregas' },
      { path: '/apuntes', label: 'Apuntes', icon: '✎', description: 'Notas de clase' },
      { path: '/calendario', label: 'Calendario', icon: '▦', description: 'Fechas límite' },
      {
        path: '/notificaciones',
        label: 'Notificaciones',
        icon: '◔',
        description: 'Avisos y recordatorios',
      },
    ],
  },
  {
    heading: 'Cuenta',
    items: [{ path: '/ajustes', label: 'Ajustes', icon: '⚙', description: 'Materias y respaldo' }],
  },
];

export const NOTIFICATIONS_PATH = '/notificaciones';
