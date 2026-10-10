import { Component, input } from '@angular/core';

@Component({
  selector: 'app-mensaje-error',
  standalone: true,
  template: `<div class="error-message" role="alert">{{ message() }}</div>`
})
export class MensajeErrorComponent {
  message = input('');
}
