import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FeedbackHostComponent } from './shared/ui/feedback-host.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, FeedbackHostComponent],
  template: '<router-outlet /><app-feedback-host />'
})
export class App {}
