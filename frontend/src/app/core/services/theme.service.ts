import { Injectable, effect, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'nexo_theme';

/** Preferencia de tema. Guardarla en localStorage es aceptable: no es un dato sensible. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly preference = signal<ThemePreference>(this.read());

  constructor() {
    effect(() => {
      const value = this.preference();
      const root = document.documentElement;
      if (value === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', value);
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch {
        // Almacenamiento no disponible: la preferencia dura solo esta sesión.
      }
    });
  }

  cycle(): void {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    this.preference.update(current => order[(order.indexOf(current) + 1) % order.length]);
  }

  private read(): ThemePreference {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
      return 'system';
    }
  }
}
