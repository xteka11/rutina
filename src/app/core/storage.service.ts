import { Injectable } from '@angular/core';

/**
 * Capa de persistencia. Usa localStorage y nunca lanza:
 * si el navegador lo bloquea, la app sigue en memoria y `ok` pasa a false.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  ok = true;
  private mem = new Map<string, string>();

  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key) ?? this.mem.get(key) ?? null;
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      this.ok = false;
      const raw = this.mem.get(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    }
  }

  write(key: string, value: unknown): boolean {
    const raw = JSON.stringify(value);
    this.mem.set(key, raw);
    try {
      localStorage.setItem(key, raw);
      this.ok = true;
      return true;
    } catch {
      this.ok = false;
      return false;
    }
  }

  remove(key: string): void {
    this.mem.delete(key);
    try { localStorage.removeItem(key); } catch { /* nada que hacer */ }
  }
}
