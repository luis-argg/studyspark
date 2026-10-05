export interface Note {
  id: string;
  title: string;
  body: string;
  subjectId: string | null;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Campos que el editor de apuntes controla; las marcas de tiempo las calcula el store. */
export interface NoteDraft {
  title: string;
  body: string;
  subjectId: string | null;
  tags: string[];
  pinned: boolean;
}
