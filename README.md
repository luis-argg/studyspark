# StudySpark

Aplicación local para organizar el estudio de un estudiante: tareas con fecha
límite, apuntes de clase, calendario de entregas y avisos de vencimiento.

**Todos los datos viven en el `localStorage` del navegador.** No hay servidor, ni
base de datos, ni cuentas. Nada sale del equipo del usuario.

## Stack

| Pieza        | Elección                                       | Motivo                                                                               |
| ------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| Framework    | Angular 22 (standalone, **zoneless**, signals) | Sin `zone.js`; el estado se actualiza con `signal()`                                 |
| Render       | **Solo CSR**                                   | El SSR no aporta nada cuando el dato es local, y complica el acceso a `localStorage` |
| Persistencia | `localStorage` a través de `StorageService`    | Sin dependencias                                                                     |
| Estilos      | CSS puro con design tokens en `src/styles.css` | Cero dependencias, bundle mínimo                                                     |
| Tests        | Vitest vía `@angular/build:unit-test` (jsdom)  | Incluye `localStorage`                                                               |

## Scripts

```bash
npm start                    # servidor de desarrollo en http://localhost:4200
npm run build                # build de producción (valida budgets)
npm run watch                # build de desarrollo en modo watch
npm test                     # tests en modo watch
npm test -- --watch=false    # tests una sola vez
npx prettier --write "src/**/*.{ts,html,css}"
```

## Arquitectura

```
src/app/
├── core/
│   ├── models/       task · note · subject · notification · storage-key
│   ├── storage/      storage.service.ts · guards.ts · entity-guards.ts
│   ├── stores/       tasks · notes · subjects · notifications
│   ├── clock/        clock.service.ts (el día actual como signal)
│   ├── dev/          seed-data.ts · seed.service.ts
│   ├── backup/       backup.service.ts (export / import JSON)
│   ├── theme/        theme.service.ts (claro / oscuro / sistema)
│   └── utils/        date.ts · calendar.ts · id.ts
├── layout/
│   ├── header/       header.ts · header.html · header.css
│   ├── sidebar/      sidebar.ts · sidebar.html · sidebar.css · nav.config.ts
│   ├── footer/       footer.ts · footer.html · footer.css
│   └── shell/        shell.ts · shell.html · shell.css
├── shared/ui/        empty-state
└── features/
    ├── tasks/        tasks-page · task-form (modal)
    ├── notes/        notes-page · note-form (modal)
    ├── calendar/     calendar-page
    ├── notifications/ notifications-page
    └── settings/     settings-page · subject-form (modal)
```

### El layout

`Shell` solo compone: mantiene el estado del menú móvil y coloca las tres piezas
de "chrome" alrededor del `router-outlet`.

```
Shell
├── app-header          marca · fecha · campana · toggle de tema   → emite menuToggle
├── app-sidebar         navegación por secciones                   ← open, → closed
├── router-outlet       la vista activa
└── app-footer
```

La comunicación es explícita: el shell es dueño de `menuOpen`, el header avisa
con `menuToggle` y el sidebar emite `closed` al navegar. Ninguno de los tres
conoce al shell más allá de eso.

`nav.config.ts` es el lugar donde se agrega o renombra una sección del menú.

### El patrón de los stores

El proyecto es zoneless, así que **nada de lo que pasa en `localStorage` dispara
detección de cambios**. El estado real vive en un `signal()` y el almacenamiento
es solo el destino:

```ts
@Injectable({ providedIn: 'root' })
export class TasksStore {
  private readonly storage = inject(StorageService);

  // Se lee en el inicializador: al ser CSR-only, `localStorage` siempre existe.
  private readonly state = signal<Task[]>(this.storage.read(KEYS.tasks, [], isTask));

  readonly tasks = this.state.asReadonly();
  readonly pending = computed(() => /* ... */);

  constructor() {
    effect(() => this.storage.write(KEYS.tasks, this.state()));
  }
}
```

Al ser CSR-only (sin SSR), leer `localStorage` en el inicializador de campo es
seguro y no hace falta `isPlatformBrowser()`.

### Fechas

Todo se maneja con claves `YYYY-MM-DD` en **hora local**. Nunca se usa
`new Date('2026-01-05')`: el constructor con _string_ interpreta la fecha como
UTC y desplaza el día, lo que rompe las comparaciones en zonas con offset
negativo. Todo pasa por `parseIsoDate` / `toIsoDate` de `core/utils/date.ts`.

### El día actual también es un signal

`ClockService` expone `today` como signal y lo refresca cada minuto. Hace falta
porque `overdue`, `dueToday` y las notificaciones dependen de "hoy": si se
calcularan llamando a `todayIso()` dentro de un `computed`, la app no se enteraría
de que cambió el día con la pestaña abierta de medianoche.

### Los modales

Son `<dialog>` nativos con `showModal()`, lo que aporta foco atrapado, `Esc` y
`::backdrop` sin código extra. El `open` es un `model()` y un `effect` sincroniza
el diálogo; el componente nunca llama a `showModal()` desde un click.

## Rutas

| Ruta              | Vista          | Estado                                  |
| ----------------- | -------------- | --------------------------------------- |
| `/tareas`         | Tareas         | Lista con filtros, búsqueda y modal     |
| `/apuntes`        | Apuntes        | Listado con búsqueda, etiquetas y modal |
| `/calendario`     | Calendario     | Mes navegable + agenda del día          |
| `/notificaciones` | Notificaciones | Avisos de vencidas y de hoy             |
| `/ajustes`        | Ajustes        | Materias, tema, seed y respaldo         |

`''` y cualquier ruta desconocida redirigen a `/tareas`.

## Estado de avance

Hecho:

- Base sin SSR, con router lazy y design tokens (incluye tema oscuro).
- Layout en tres componentes: `header`, `sidebar` y `footer`, compuestos por el
  shell y responsive en móvil.
- Capa de datos: modelos, `StorageService` con parseo tolerante a datos
  corruptos, type guards y cuatro stores con sus mutaciones.
- `ClockService` para que lo relativo a "hoy" reaccione al cambio de día.
- Las cinco vistas implementadas, con modales para tarea, apunte y materia.
- Datos de ejemplo (4 materias, 10 tareas, 4 apuntes) y borrado total en Ajustes.
- Export / import JSON con validación previa: si el archivo no cuadra no se toca
  el almacenamiento.
- 104 tests sobre storage, fechas, calendario, layout, stores, seed y respaldo.

Pendiente:

- Vista de la nota completa sin el resumen plegable (hoy se lee dentro de la lista).
- Tests de componente para las cinco vistas (la lógica ya está cubierta).
- Posible editor con markdown en lugar de texto plano.

## Notas

- `anyComponentStyle` tiene el presupuesto en 6 kB (Angular lo genera en 4 kB),
  insuficiente para un layout de esta densidad.
- Si borras los datos del navegador, se pierde todo: por eso el export/import JSON
  vive en Ajustes.
- Los type guards validan la lista entera o nada: un único elemento corrupto
  descarta el array completo en vez de devolverlo a medias.
