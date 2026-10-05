export const STORAGE_PREFIX = 'ss:';

export const STORAGE_KEYS = {
  tasks: `${STORAGE_PREFIX}tasks`,
  notes: `${STORAGE_PREFIX}notes`,
  subjects: `${STORAGE_PREFIX}subjects`,
  notifications: `${STORAGE_PREFIX}notifications`,
  theme: `${STORAGE_PREFIX}theme`,
} as const;

export const APP_VERSION = 1;

export interface BackupFile {
  app: 'study-spark';
  version: number;
  exportedAt: string;
  tasks: unknown;
  notes: unknown;
  subjects: unknown;
}
