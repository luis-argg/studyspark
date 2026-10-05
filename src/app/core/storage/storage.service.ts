import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  read<T>(key: string, fallback: T, validate?: (value: unknown) => value is T): T {
    let raw: string | null = null;

    try {
      raw = this.storage()?.getItem(key) ?? null;
    } catch {
      return fallback;
    }

    if (raw === null) {
      return fallback;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.remove(key);
      return fallback;
    }

    if (validate && !validate(parsed)) {
      this.remove(key);
      return fallback;
    }

    return parsed as T;
  }

  /**
   * Si la clave existe. Distingue "nunca se guardó" de "se guardó vacío", algo
   * que `read` no puede expresar porque en ambos casos devuelve el fallback.
   */
  has(key: string): boolean {
    try {
      return this.storage()?.getItem(key) != null;
    } catch {
      return false;
    }
  }

  write<T>(key: string, value: T): boolean {
    try {
      this.storage()?.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): void {
    try {
      this.storage()?.removeItem(key);
    } catch {
      return;
    }
  }

  private storage(): Storage | null {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
