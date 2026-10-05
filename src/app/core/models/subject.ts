export interface Subject {
  id: string;
  name: string;
  /** Color en formato hex, usado en badges y filtros. */
  color: string;
}

export interface SubjectDraft {
  name: string;
  color: string;
}
