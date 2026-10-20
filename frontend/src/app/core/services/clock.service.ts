import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Reloj compartido: una sola señal que avanza cada segundo para tiempos relativos y cuentas regresivas. */
@Injectable({ providedIn: 'root' })
export class ClockService {
  readonly now = signal(Date.now());

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
