import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { STORAGE_KEYS } from '../models/storage-key';
import { StorageService } from '../storage/storage.service';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Según el sistema' },
];

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly document = inject(DOCUMENT);

  private readonly preference = signal<ThemePreference>(
    this.storage.read<ThemePreference>(STORAGE_KEYS.theme, 'system', isThemePreference),
  );

  private readonly systemDark = signal(this.matchesSystem());

  readonly current = this.preference.asReadonly();

  readonly isDark = computed(() => {
    const preference = this.preference();
    if (preference === 'system') {
      return this.systemDark();
    }
    return preference === 'dark';
  });

  constructor() {
    const media = this.matchMedia();
    media?.addEventListener('change', () => this.systemDark.set(this.matchesSystem()));

    effect(() => this.storage.write(STORAGE_KEYS.theme, this.preference()));

    effect(() => {
      const isDark = this.isDark();
      const root = this.document.documentElement;

      if (this.preference() === 'system') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
      }
    });
  }

  set(preference: ThemePreference): void {
    this.preference.set(preference);
  }

  toggle(): void {
    this.set(this.isDark() ? 'light' : 'dark');
  }

  private matchesSystem(): boolean {
    return this.matchMedia()?.matches ?? false;
  }

  private matchMedia(): MediaQueryList | null {
    return this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
  }
}
