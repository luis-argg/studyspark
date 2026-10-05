import type { Subject } from '../models/subject';

/**
 * Materias con las que arranca la app la primera vez. Los ids son estables y no
 * aleatorios a propósito: el seed de ejemplo y las tareas y apuntes de
 * demostración apuntan a estas entradas, así que no pueden depender del orden
 * en que se creó cada una ni de un `createId()` por sesión.
 */
export const DEFAULT_SUBJECTS: readonly Subject[] = [
  { id: 's-mat', name: 'Matemáticas', color: '#4f46e5' },
  { id: 's-ing', name: 'Inglés', color: '#0369a1' },
  { id: 's-soc', name: 'Sociales', color: '#b45309' },
  { id: 's-fis', name: 'Física Fundamental', color: '#0f766e' },
  { id: 's-qui', name: 'Química', color: '#7c3aed' },
  { id: 's-bio', name: 'Biología', color: '#65a30d' },
  { id: 's-lit', name: 'Literatura', color: '#be185d' },
  { id: 's-fil', name: 'Filosofía', color: '#475569' },
  { id: 's-rob', name: 'Robótica', color: '#15803d' },
  { id: 's-lab', name: 'Laboratorio', color: '#c2410c' },
  { id: 's-tal', name: 'Taller', color: '#a16207' },
  { id: 's-sop', name: 'Soporte', color: '#b91c1c' },
  { id: 's-art', name: 'Artes', color: '#db2777' },
  { id: 's-emp', name: 'Emprendimiento', color: '#1d4ed8' },
  { id: 's-com', name: 'Computación', color: '#0891b2' },
];

/** Copia mutable, porque `SubjectsStore` mantiene la suya en un signal. */
export function createDefaultSubjects(): Subject[] {
  return DEFAULT_SUBJECTS.map((subject) => ({ ...subject }));
}
