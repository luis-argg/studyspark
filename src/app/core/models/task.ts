export type TaskStatus = 'pending' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  subjectId: string | null;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface TaskDraft {
  title: string;
  subjectId: string | null;
  dueDate: string;
  priority: TaskPriority;
}
