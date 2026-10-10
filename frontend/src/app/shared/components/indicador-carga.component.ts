import { Component, input } from '@angular/core';

@Component({
  selector: 'app-indicador-carga',
  standalone: true,
  template: `<p class="loading-message" aria-live="polite">{{ message() }}</p>`
})
export class IndicadorCargaComponent {
  message = input('Cargando...');
}
