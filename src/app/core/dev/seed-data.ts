import type { Note } from '../models/note';
import type { Subject } from '../models/subject';
import type { Task, TaskPriority } from '../models/task';
import { addDays, todayIso } from '../utils/date';

export interface SeedData {
  readonly subjects: Subject[];
  readonly tasks: Task[];
  readonly notes: Note[];
}

const SUBJECTS: readonly Subject[] = [
  { id: 'seed-mat', name: 'Matemáticas', color: '#4f46e5' },
  { id: 'seed-prog', name: 'Programación', color: '#0369a1' },
  { id: 'seed-hist', name: 'Historia', color: '#b45309' },
  { id: 'seed-fis', name: 'Física', color: '#15803d' },
];

interface TaskSeed {
  readonly id: string;
  readonly title: string;
  readonly subjectId: string | null;
  readonly dueInDays: number;
  readonly priority: TaskPriority;
  readonly done?: boolean;
}

const TASK_SEEDS: readonly TaskSeed[] = [
  {
    id: 'seed-t1',
    title: 'Entregar el ensayo de la Revolución Industrial',
    subjectId: 'seed-hist',
    dueInDays: -3,
    priority: 'high',
  },
  {
    id: 'seed-t2',
    title: 'Ejercicios 4 y 5 de integrales',
    subjectId: 'seed-mat',
    dueInDays: -1,
    priority: 'high',
  },
  {
    id: 'seed-t3',
    title: 'Leer el capítulo 7 antes del seminario',
    subjectId: 'seed-hist',
    dueInDays: 0,
    priority: 'medium',
  },
  {
    id: 'seed-t4',
    title: 'Terminar la práctica de arrays y bucles',
    subjectId: 'seed-prog',
    dueInDays: 0,
    priority: 'medium',
  },
  {
    id: 'seed-t5',
    title: 'Informe de laboratorio: péndulo simple',
    subjectId: 'seed-fis',
    dueInDays: 2,
    priority: 'high',
  },
  {
    id: 'seed-t6',
    title: 'Mesa de trabajo en grupo',
    subjectId: 'seed-prog',
    dueInDays: 4,
    priority: 'medium',
  },
  {
    id: 'seed-t7',
    title: 'Repasar EU1 para el parcial',
    subjectId: 'seed-mat',
    dueInDays: 6,
    priority: 'high',
  },
  {
    id: 'seed-t8',
    title: 'Comprar el material del taller',
    subjectId: null,
    dueInDays: 8,
    priority: 'low',
  },
  {
    id: 'seed-t9',
    title: 'Mapa conceptual del Renacimiento',
    subjectId: 'seed-hist',
    dueInDays: -5,
    priority: 'medium',
    done: true,
  },
  {
    id: 'seed-t10',
    title: 'Problema de fuerza y aceleración',
    subjectId: 'seed-fis',
    dueInDays: -2,
    priority: 'medium',
    done: true,
  },
];

const NOTE_SEEDS: ReadonlyArray<Omit<Note, 'createdAt' | 'updatedAt'>> = [
  {
    id: 'seed-n1',
    title: 'Derivadas: reglas principales',
    body: [
      '# Derivadas',
      '',
      '- **Potencia**: d/dx (xⁿ) = n·xⁿ⁻¹',
      "- **Producto**: (uv)' = u'v + uv'",
      "- **Cadena**: d/dx f(g(x)) = f'(g(x))·g'(x)",
      '',
      '> Recordar siempre la regla de la cadena anidada.',
      '',
      '```',
      'Ejemplo: d/dx (3x² + 2) = 6x',
      '```',
    ].join('\n'),
    subjectId: 'seed-mat',
    tags: ['cálculo', 'parcial'],
    pinned: true,
  },
  {
    id: 'seed-n2',
    title: 'Ciclo de vida de un componente',
    body: [
      '# Componentes',
      '',
      '1. Se construye el componente',
      '2. Se calculan los `input`',
      '3. Se renderiza la plantilla',
      '4. Se detectan cambios',
      '',
      'En modo **zoneless** nada de esto salta solo: hay que actualizar un signal.',
    ].join('\n'),
    subjectId: 'seed-prog',
    tags: ['angular'],
    pinned: false,
  },
  {
    id: 'seed-n3',
    title: 'Causas de la Revolución Industrial',
    body: [
      '## Factores',
      '',
      '1. Revolución agrícola previa',
      '2. Capital acumulado por el comercio',
      '3. Innovaciones textiles',
      '4. Carbón y hierro en Gran Bretaña',
      '',
      'Fechas clave: **1760** máquina de vapor, **1785** telar mecánico.',
    ].join('\n'),
    subjectId: 'seed-hist',
    tags: ['tema-3', 'ensayo'],
    pinned: false,
  },
  {
    id: 'seed-n4',
    title: 'Leyes de Newton (repaso rápido)',
    body: [
      '## Las tres leyes',
      '',
      '- 1ª: cuerpo en reposo sigue en reposo',
      '- 2ª: F = m·a',
      '- 3ª: toda fuerza tiene reacción igual y opuesta',
    ].join('\n'),
    subjectId: 'seed-fis',
    tags: ['mecánica'],
    pinned: false,
  },
];

/**
 * Datos de ejemplo con fechas relativas a hoy, para que la app se vea
 * poblada al abrirla y se puedan juzgar listas, calendario y avisos.
 */
export function buildSeedData(): SeedData {
  const today = todayIso();
  const createdAt = new Date().toISOString();

  const tasks: Task[] = TASK_SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    subjectId: seed.subjectId,
    dueDate: addDays(today, seed.dueInDays),
    priority: seed.priority,
    status: seed.done ? 'done' : 'pending',
    createdAt,
    completedAt: seed.done ? createdAt : null,
  }));

  const notes: Note[] = NOTE_SEEDS.map((seed) => ({
    ...seed,
    createdAt,
    updatedAt: createdAt,
  }));

  return { subjects: [...SUBJECTS], tasks, notes };
}
